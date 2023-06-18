import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { Throttle } from '@nestjs/throttler';
import axios from 'axios';
import moment from 'moment';
import { storage } from 'src/config/firebase-config';
import {
  AddContributorArgs,
  CreateNewRepositoryArgs,
  DeleteRepositoryArgs,
  GetRepositoryByIdArgs,
  GetUserRepositoriesArgs,
  GetWorkspaceRepositoriesArgs,
  ToggleLikeRepositoryArgs,
  PinRepositoryArgs,
  RemoveContributorArgs,
  RemoveTabsFromRepositoryArgs,
  SetRepositoryTabsArgs,
  UpdateRepositoryArgs,
  UpdateRepositoryAccessArgs,
  UnpinRepositoryTabArgs,
  PinRepositoryTabArgs,
  GetRepositoryBySlugArgs,
  UpdateReadmeArgs,
  ReadReadmeArgs,
  UpdateRepositoryBannerArgs,
  GetRepositoryBannerArgs,
} from 'src/dto';
import { GqlThrottlerGuard } from 'src/middlewares';
import { AccessVisibility, AppResponse, Repository, ResponseType } from 'src/models';
import { FlattenRolePermission, UserRole, throwPermissionChecker } from 'src/models/role.model';
import { buildSlug, getAuthUser, getUnsafeAuthUser, makeid } from 'src/utils';
import stream from 'stream';

import { RepositoryTabService } from '../repository-tab';
import { StorageService } from '../storage';
import { UserService } from '../user';
import { WorkspaceService } from '../workspace';
import { RepositoryService } from './repository.service';

const isPermitted = (repository: Repository, userId: string): boolean => {
  return repository.permittedUsers.includes(userId);
};

const isContributor = (repository: Repository, userId: string): boolean => {
  return repository.contributors.some(contributor => contributor === userId);
};

@Resolver(() => Repository)
export class RepositoryResolver {
  constructor(
    private repositoryService: RepositoryService,
    private workspaceService: WorkspaceService,
    private repositoryTabService: RepositoryTabService,
    private userService: UserService,
    private storageService: StorageService
  ) {}

  async checkRepositoryPermission(
    repository: Repository,
    userId: string,
    permission: FlattenRolePermission[]
  ) {
    const isContributor = this.repositoryService.isRepositoryContributor(repository, userId);
    const workspace = await this.workspaceService.getAuthWorkspaceById(
      userId,
      repository.workspaceId
    );
    let userRole = await this.workspaceService.findUserRoleInWorkspace(workspace, userId);
    if (userRole === undefined && isContributor) {
      userRole = UserRole.RepositoryContributor;
    }
    if (!workspace) throw new Error('No workspace found');
    if (isPermitted(repository, userId)) return;
    throwPermissionChecker(userRole, permission);
  }

  @Query(() => [Repository])
  async getUserRepositories(
    @Context('req') req,
    @Args('getUserRepositoriesArgs') args: GetUserRepositoriesArgs
  ) {
    try {
      const { userId } = args;
      const authUser = getUnsafeAuthUser(req);
      if (authUser && authUser.id === userId) {
        /** Get all workspace private / public repositories associated with user ID */
        const workspaces = await this.workspaceService.getAuthUserWorkspaces(userId);
        const repositories = await Promise.all(
          workspaces.map(async workspace => {
            const repository = await this.repositoryService.getWorkspaceRepositories(workspace.id);
            return repository;
          })
        );
        const contributedRepositories = await this.repositoryService.getAuthUserRepositories(
          userId
        );
        return [...repositories, ...contributedRepositories];
      }
      /** Get all workspace public repositories associated with user ID */
      const workspaces = await this.workspaceService.getUserPublicWorkspaces(userId);
      const repositories = await Promise.all(
        workspaces.map(async workspace => {
          const repository = await this.repositoryService.getWorkspacePublicRepositories(
            workspace.id
          );
          return repository;
        })
      );
      const contributedRepositories = await this.repositoryService.getAuthUserRepositories(userId);
      return [...repositories, ...contributedRepositories];
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Repository])
  async getWorkspaceRepositories(
    @Context('req') req,
    @Args('getWorkspaceRepositoriesArgs') args: GetWorkspaceRepositoriesArgs
  ) {
    try {
      const authUser = getUnsafeAuthUser(req);
      const { workspaceId: workspaceId } = args;
      const repositories = await this.repositoryService.getWorkspaceRepositories(workspaceId);
      if (authUser) {
        const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, authUser.id);
        if (isMember) return repositories;
      }
      return repositories.filter(
        repository =>
          repository.visibility === AccessVisibility.Public ||
          isContributor(repository, authUser.id) ||
          isPermitted(repository, authUser.id)
      );
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Repository])
  async getAllPublicRepositories() {
    try {
      let repositories = [];
      const workspaces = await this.workspaceService.getPublicWorkspaces();
      for (const workspace of workspaces) {
        const workspaceRepositories = await this.repositoryService.getWorkspacePublicRepositories(
          workspace.id
        );
        repositories = repositories.concat(workspaceRepositories);
      }
      return repositories;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Repository)
  async getRepositoryBySlug(
    @Context('req') req,
    @Args('getRepositoryBySlugArgs') args: GetRepositoryBySlugArgs
  ): Promise<Repository> {
    try {
      const { slug, workspaceId } = args;
      const authUser = getUnsafeAuthUser(req);
      /** If repository is private, check the read access */
      const existingRepository = await this.repositoryService.getRepositoryBySlug(
        workspaceId,
        slug
      );
      if (existingRepository.visibility === AccessVisibility.Private) {
        await this.checkRepositoryPermission(existingRepository, authUser.id, [
          'repository',
          'read',
        ]);
      }
      return existingRepository;
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => Repository)
  async getRepositoryById(
    @Context('req') req,
    @Args('getRepositoryByIdArgs') args: GetRepositoryByIdArgs
  ): Promise<Repository> {
    try {
      const { id } = args;
      const authUser = getUnsafeAuthUser(req);

      /** If repository is private, check the read access */
      const existingRepository = await this.repositoryService.getDataById(id);
      if (existingRepository.visibility === AccessVisibility.Private) {
        await this.checkRepositoryPermission(existingRepository, authUser.id, [
          'repository',
          'read',
        ]);
      }
      return this.repositoryService.getDataById(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse, { nullable: true })
  async setRepositoryTabs(
    @Context('req') req,
    @Args('setRepositoryTabsArgs') args: SetRepositoryTabsArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id: repositoryId, tabs, directories } = args;
      const existingRepository = await this.repositoryService.getDataById(repositoryId);
      if (!existingRepository) throw new Error('No repository found');

      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, authUser.id, [
        'repository',
        'tabs',
        'update',
      ]);

      await this.repositoryService.updateData(repositoryId, {
        tabs: tabs,
        directories,
      });
    } catch (error) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async createNewRepository(
    @Context('req') req,
    @Args('createRepositoryArgs') args: CreateNewRepositoryArgs
  ): Promise<AppResponse> {
    /** Upsert repository */
    try {
      const authUser = getAuthUser(req);
      const { name, tabs, workspaceId, description, icon, visibility, directories } = args;

      /** Must be a workspace member to create a repository */
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, authUser.id);
      if (!isMember) throw new Error('Not workspace member');

      const slug = buildSlug(name);
      const existingRepository = await this.repositoryService.getRepositoryBySlug(
        workspaceId,
        slug
      );
      if (existingRepository) {
        /** Add tabs to existing repository if existed */
        const repositoryTabs = await this.repositoryTabService.createManyRepositoryTab(tabs);
        await this.repositoryService.updateData(existingRepository.id, {
          tabs: existingRepository.tabs.concat(repositoryTabs),
          description,
          visibility,
        });
        return {
          message: `Successfully update repository ${name}`,
          type: ResponseType.Success,
        };
      } else {
        /** Create new repository if not exist */
        await this.repositoryService.createNewRepository(
          icon,
          slug,
          name,
          tabs,
          authUser.id,
          workspaceId,
          visibility,
          [],
          directories,
          description
        );
        return {
          message: `Successfully create new repository ${name}`,
          type: ResponseType.Success,
        };
      }
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async removeTabsFromRepository(
    @Context('req') req,
    @Args('removeTabsFromRepositoryArgs') args: RemoveTabsFromRepositoryArgs
  ): Promise<AppResponse> {
    /** Upsert repository */
    try {
      const authUser = getAuthUser(req);
      const { id, tabs } = args;

      const existingRepository = await this.repositoryService.getDataById(id);
      if (!existingRepository) throw new Error('No repository found');

      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, authUser.id, [
        'repository',
        'tabs',
        'delete',
      ]);

      /** Add tabs to existing repository if existed */
      await this.repositoryService.updateData(existingRepository.id, {
        tabs: existingRepository.tabs.filter(
          tab => !tabs.some(removedTab => removedTab === tab.id)
        ),
      });
      return {
        message: `Successfully remove tabs from repository`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async addRepositoryContributor(
    @Context('req') req,
    @Args('addRepositoryContributorArgs') args: AddContributorArgs
  ): Promise<AppResponse> {
    try {
      const { id, member_email } = args;
      const authUser = getAuthUser(req);
      const _repository = await this.repositoryService.getDataById(id);

      const isWorkspaceMember = await this.workspaceService.isWorkspaceMember(
        _repository.workspaceId,
        authUser.id
      );
      if (!isWorkspaceMember) throw new Error('Not workspace member');

      const user = await this.userService.getUserByEmail(member_email);
      if (!user) throw new Error('Contributor email is not valid');

      if (_repository.contributors.some(contributor => contributor === user.id))
        throw new Error('Contributor is added already');

      await this.repositoryService.updateData(id, {
        ..._repository,
        updated_date: moment().unix(),
        contributors: _repository.contributors.concat([user.id]),
      });
      return {
        message: `Successfully update repository ${id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async removeRepositoryContributor(
    @Context('req') req,
    @Args('removeRepositoryContributorArgs') args: RemoveContributorArgs
  ): Promise<AppResponse> {
    try {
      const { id, member_email } = args;
      const authUser = getAuthUser(req);
      const _repository = await this.repositoryService.getDataById(id);

      const isWorkspaceMember = await this.workspaceService.isWorkspaceMember(
        _repository.workspaceId,
        authUser.id
      );
      if (!isWorkspaceMember) throw new Error('Not workspace member');

      const user = await this.userService.getUserByEmail(member_email);
      if (!user) throw new Error('Contributor email is not valid');

      if (!_repository.contributors.some(contributor => contributor === user.id))
        throw new Error('Contributor is not in repository');

      await this.repositoryService.updateData(id, {
        ..._repository,
        updated_date: moment().unix(),
        contributors: _repository.contributors.filter(contributor => contributor !== user.id),
      });
      return {
        message: `Successfully update repository ${id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async updateRepositoryAccess(
    @Context('req') req,
    @Args('updateRepositoryAccessArgs') args: UpdateRepositoryAccessArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id, accessPermission, permittedUsers } = args;
      const existingRepository = await this.repositoryService.getDataById(id);
      if (!existingRepository) throw new Error('No repository found');

      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, authUser.id, [
        'repository',
        'access',
        'update',
      ]);

      await this.repositoryService.updateData(id, {
        accessPermission,
        permittedUsers,
      });
      return {
        message: `Successfully update repository permission ${id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => Repository)
  async updateRepositoryInfo(
    @Context('req') req,
    @Args('updateRepositoryInfoArgs') args: UpdateRepositoryArgs
  ): Promise<Repository> {
    try {
      const authUser = getAuthUser(req);
      const { id, name, visibility, description, icon } = args;
      const existingRepository = await this.repositoryService.getDataById(id);
      if (!existingRepository) throw new Error('No repository found');
      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, authUser.id, [
        'repository',
        'update',
      ]);

      const slug = buildSlug(name);
      const updatedRecord = await this.repositoryService.updateData(id, {
        name,
        slug,
        visibility,
        description,
        icon,
      });
      return updatedRecord;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async deleteRepository(
    @Context('req') req,
    @Args('deleteRepositoryArgs') args: DeleteRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id } = args;

      const existingRepository = await this.repositoryService.getDataById(id);
      if (!existingRepository) throw new Error('No repository found');

      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, authUser.id, [
        'repository',
        'delete',
      ]);

      await this.repositoryService.deleteData(id);
      return {
        message: `Successfully delete repository ${id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async pinRepository(@Context('req') req, @Args('pinRepositoryArgs') args: PinRepositoryArgs) {
    try {
      const authUser = getAuthUser(req);
      const { id } = args;
      const userId = authUser.id;

      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');

      const existingRepository = await this.repositoryService.getDataById(id);
      if (!existingRepository) throw new Error('No repository found');

      /** Check permission of user if the repository is private */
      if (existingRepository.visibility === AccessVisibility.Private) {
        await this.checkRepositoryPermission(existingRepository, authUser.id, [
          'repository',
          'read',
        ]);
      }

      if (!this.repositoryService.hasUserPinned(existingRepository, authUser.id)) {
        /** Add user id to the list of pinned in repository */
        await this.repositoryService.updateData(id, {
          pinned: existingRepository.pinned.concat(authUser.id),
        });
        /** Add repository id to the list of pinned in user */
        await this.userService.updateData(authUser.id, {
          pinned_repositories: currentUser.pinned_repositories.concat(id),
        });
      }
      return {
        message: `Successfully pin repository ${id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async unpinRepository(@Context('req') req, @Args('unpinRepositoryArgs') args: PinRepositoryArgs) {
    try {
      const authUser = getAuthUser(req);
      const { id } = args;
      const userId = authUser.id;

      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');

      const existingRepository = await this.repositoryService.getDataById(id);
      if (!existingRepository) throw new Error('No repository found');

      /** Check permission of user if the repository is private */
      if (existingRepository.visibility === AccessVisibility.Private) {
        await this.checkRepositoryPermission(existingRepository, authUser.id, [
          'repository',
          'read',
        ]);
      }

      if (this.repositoryService.hasUserPinned(existingRepository, authUser.id)) {
        /** Remove user id from the list of pinned in repository */
        await this.repositoryService.updateData(id, {
          pinned: existingRepository.pinned.filter(userWhoPin => userWhoPin !== authUser.id),
        });
        /** Remove repository id from the list of pinned in user */
        await this.userService.updateData(authUser.id, {
          pinned_repositories: currentUser.pinned_repositories.filter(
            repositoryId => repositoryId !== id
          ),
        });
      }
      return {
        message: `Successfully unpin repository ${id}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async toggleLikeRepository(
    @Context('req') req,
    @Args('toggleLikeRepositoryArgs') args: ToggleLikeRepositoryArgs
  ) {
    try {
      const authUser = getAuthUser(req);
      const { id } = args;
      const userId = authUser.id;

      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');

      const repository = await this.repositoryService.getDataById(id);
      const liked = repository.favorites.some(userId => userId === authUser.id);

      /** Add / Remove repository id from the list of favorites in user */
      await this.userService.updateData(authUser.id, {
        favorites: liked
          ? (currentUser.favorites || []).filter(repositoryId => repositoryId !== id)
          : (currentUser.favorites || []).concat([repository.id]),
      });
      /** Add / Remove user id from the list of favorites in repository */
      await this.repositoryService.updateData(id, {
        favorites: liked
          ? repository.favorites.filter(userId => userId !== authUser.id)
          : repository.favorites.concat([userId]),
      });
      return {
        message: 'Successfully toggle repository favorite',
        type: ResponseType.Success,
      };
    } catch (error) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Query(() => String)
  async getReadmeContent(
    @Context('req') req,
    @Args('readReadmeArgs') args: ReadReadmeArgs
  ): Promise<string> {
    try {
      const { repositoryId } = args;
      const authUser = getUnsafeAuthUser(req);
      const userId = authUser.id;
      const existingRepository = await this.repositoryService.getDataById(repositoryId);

      if (!existingRepository) throw new Error('No repository found');
      /** Handle check permission */
      if (existingRepository.visibility === AccessVisibility.Private) {
        await this.checkRepositoryPermission(existingRepository, userId, ['repository', 'read']);
      }

      const response = await axios.get(existingRepository.readme);
      return response.data;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async updateReadme(
    @Context('req') req,
    @Args('updateReadmeArgs') args: UpdateReadmeArgs
  ): Promise<AppResponse> {
    try {
      const { readmeData, repositoryId } = args;
      const authUser = getAuthUser(req);
      const userId = authUser.id;
      const existingRepository = await this.repositoryService.getDataById(repositoryId);

      if (!existingRepository) throw new Error('No repository found');
      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, userId, ['repository', 'update']);

      /** Upload README to object storage */
      const bucket = storage.bucket();
      const prefixPath = `${existingRepository.workspaceId}/${existingRepository.slug}`;
      await this.storageService.uploadMarkdownFilePath(bucket, prefixPath, 'README.md', readmeData);
      /** Get file path on cloud storage */
      const fileName = `${prefixPath}/README.md`;

      if (existingRepository.readme.length === 0) {
        const url = await this.storageService.generateSignedUrl(bucket, fileName);
        await this.repositoryService.updateData(repositoryId, {
          readme: url,
        });
      }
      return {
        message: `Successfully update repository ${repositoryId}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Query(() => String)
  async getRepositoryBanner(
    @Context('req') req,
    @Args('getRepositoryBannerArgs') args: GetRepositoryBannerArgs
  ): Promise<string> {
    try {
      const { repositoryId } = args;
      const authUser = getUnsafeAuthUser(req);
      const userId = authUser.id;
      const existingRepository = await this.repositoryService.getDataById(repositoryId);

      if (!existingRepository) throw new Error('No repository found');
      /** Handle check permission */
      if (existingRepository.visibility === AccessVisibility.Private) {
        await this.checkRepositoryPermission(existingRepository, userId, ['repository', 'read']);
      }

      const response = await axios.get(existingRepository.bannerUrl, {
        responseType: 'arraybuffer',
      });
      const base64Image = Buffer.from(response.data, 'binary').toString('base64');
      return base64Image;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // Can only upload 5 images every 15 minutes
  @UseGuards(GqlThrottlerGuard)
  @Throttle(5, 60 * 15)
  @Mutation(() => AppResponse)
  async updateRepositoryBanner(
    @Context('req') req,
    @Args('updateRepositoryBannerArgs') args: UpdateRepositoryBannerArgs
  ): Promise<AppResponse> {
    try {
      const { bannerData, repositoryId, mimeType } = args;
      const { createReadStream } = await bannerData;
      /** Buffer streaming the image data and convert to base 64 */
      const readStream = createReadStream();
      const chunks = [];
      const buffer = await new Promise<Buffer>((resolve, reject) => {
        let buffer: Buffer;
        readStream.on('data', function (chunk) {
          chunks.push(chunk);
        });
        readStream.on('end', function () {
          buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        readStream.on('error', reject);
      });

      const authUser = getAuthUser(req);
      const userId = authUser.id;
      const existingRepository = await this.repositoryService.getDataById(repositoryId);

      if (!existingRepository) throw new Error('No repository found');
      /** Handle check permission */
      await this.checkRepositoryPermission(existingRepository, userId, ['repository', 'update']);

      /** Upload README to object storage */
      const bucket = storage.bucket();
      const prefixPath = `${existingRepository.workspaceId}/${existingRepository.slug}`;
      const imageName = `profile-${makeid(10)}.png`;

      /** Write file to cloud */
      const thumbFile = bucket.file(`${prefixPath}/${imageName}`);
      const writeStream = new stream.PassThrough();
      writeStream.end(buffer);
      writeStream
        .pipe(
          thumbFile.createWriteStream({
            metadata: {
              contentType: mimeType,
              metadata: {
                workspace: existingRepository.workspaceId,
                repository: repositoryId,
                repositoryName: existingRepository.name,
                uploadedAt: moment().format('DD-MM-YYYY'),
              },
            },
            public: true,
            validation: 'md5',
          })
        )
        .on('error', err => console.log('Error while saving thumbfile', err))
        .on('finish', () => console.log('Thumbfile saved.'));
      /** Get file path on cloud storage */
      const fileName = `${prefixPath}/${imageName}`;
      const url = await this.storageService.generateSignedUrl(bucket, fileName);
      await this.repositoryService.updateData(repositoryId, {
        bannerUrl: url,
      });
      return {
        message: `Successfully update repository banner ${repositoryId}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      console.log(error);
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async pinRepositoryTab(
    @Context('req') req,
    @Args('pinRepositoryTabArgs') args: PinRepositoryTabArgs
  ): Promise<AppResponse> {
    try {
      const { tabId, repositoryId } = args;
      const authUser = getAuthUser(req);
      const userId = authUser.id;
      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');

      /** Find pin from repository */
      const repository = await this.repositoryService.getDataById(repositoryId);
      const repositoryTab = repository.tabs.find(tab => tab.id === tabId);
      if (!repositoryTab) throw new Error('No tab found in the provided repository');

      await this.userService.updateData(userId, {
        pinned_tabs: currentUser.pinned_tabs.concat([repositoryTab]),
      });
      return {
        message: `Successfully pin tab ${tabId}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }

  @Mutation(() => AppResponse)
  async unpinRepositoryTab(
    @Context('req') req,
    @Args('unpinRepositoryTabArgs') args: UnpinRepositoryTabArgs
  ): Promise<AppResponse> {
    try {
      const { tabId } = args;
      const authUser = getAuthUser(req);
      const userId = authUser.id;
      /** Find current user */
      const currentUser = await this.userService.getDataById(userId);
      if (!currentUser) throw new Error('No user found');

      await this.userService.updateData(userId, {
        pinned_tabs: currentUser.pinned_tabs.filter(tab => tab.id !== tabId),
      });
      return {
        message: `Successfully unpin tab ${tabId}`,
        type: ResponseType.Success,
      };
    } catch (error: any) {
      return {
        message: error,
        type: ResponseType.Error,
      };
    }
  }
}
