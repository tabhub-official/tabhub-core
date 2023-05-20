import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import * as moment from 'moment';
import {
  AddContributorArgs,
  CreateNewRepositoryArgs,
  DeleteRepositoryArgs,
  GetRepositoryByIdArgs,
  GetRepositoryByNameArgs,
  GetUserRepositoriesArgs,
  GetWorkspaceRepositoriesArgs,
  ToggleLikeRepositoryArgs,
  PinRepositoryArgs,
  RemoveContributorArgs,
  RemoveTabsFromRepositoryArgs,
  SetRepositoryTabsArgs,
  UpdateRepositoryArgs,
} from 'src/dto';
import { AccessVisibility, AppResponse, Repository, ResponseType } from 'src/models';
import { getAuthUser, getUnsafeAuthUser } from 'src/utils';

import { RepositoryTabService } from '../repository-tab';
import { UserService } from '../user';
import { WorkspaceService } from '../workspace';
import { RepositoryService } from './repository.service';

@Resolver(() => Repository)
export class RepositoryResolver {
  constructor(
    private repositoryService: RepositoryService,
    private workspaceService: WorkspaceService,
    private repositoryTabService: RepositoryTabService,
    private userService: UserService
  ) {}

  @Query(() => [Repository])
  async getUserRepositories(
    @Context('req') req,
    @Args('getUserRepositoriesArgs') args: GetUserRepositoriesArgs
  ) {
    try {
      const { userId } = args;
      const authUser = getUnsafeAuthUser(req);
      if (authUser && authUser.id === userId) {
        return this.repositoryService.getAuthUserRepositories(userId);
      }
      return this.repositoryService.getUserRepositories(userId);
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
      if (authUser) {
        const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, authUser.id);
        if (isMember) return this.repositoryService.getWorkspaceRepositories(workspaceId);
      }
      return this.repositoryService.getWorkspacePublicRepositories(workspaceId);
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
        const workspaceRepositories = await this.repositoryService.getWorkspaceRepositories(
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
  async getRepositoryByName(
    @Args('getRepositoryByNameArgs') args: GetRepositoryByNameArgs
  ): Promise<Repository> {
    try {
      const { name, workspaceId } = args;
      return this.repositoryService.getRepositoryByName(workspaceId, name);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => Repository)
  async getRepositoryById(
    @Args('getRepositoryByIdArgs') args: GetRepositoryByIdArgs
  ): Promise<Repository> {
    try {
      const { id } = args;
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
      /** Must be a workspace member to create a repository */
      const isMember = await this.workspaceService.isWorkspaceMember(
        existingRepository.workspaceId,
        authUser.id
      );
      const isContributor = await this.repositoryService.isRepositoryContributor(
        repositoryId,
        authUser.id
      );
      if (!isMember || !isContributor) throw new Error('No editting permission');

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
      const { name, tabs, workspaceId, description, visibility, directories } = args;

      /** Must be a workspace member to create a repository */
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, authUser.id);
      if (!isMember) throw new Error('Not workspace member');

      const existingRepository = await this.repositoryService.getRepositoryByName(
        workspaceId,
        name
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
        const workspace = await this.workspaceService.getDataById(workspaceId);
        /** Create new repository if not exist */
        await this.repositoryService.createNewRepository(
          name,
          tabs,
          authUser.id,
          workspaceId,
          visibility,
          workspace.members,
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

      const isMember = await this.workspaceService.isWorkspaceMember(
        existingRepository.workspaceId,
        authUser.id
      );
      const isContributor = await this.repositoryService.isRepositoryContributor(id, authUser.id);
      if (!isMember || !isContributor) throw new Error('No editting permission');

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
  async updateRepositoryInfo(
    @Context('req') req,
    @Args('updateRepositoryInfoArgs') args: UpdateRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id, name, visibility, description } = args;
      const _repository = await this.repositoryService.getDataById(id);

      const isMember = await this.workspaceService.isWorkspaceMember(
        _repository.workspaceId,
        authUser.id
      );
      const isContributor = await this.repositoryService.isRepositoryContributor(id, authUser.id);
      if (!isMember || !isContributor) throw new Error('No editting permission');
      await this.repositoryService.updateData(id, {
        name,
        visibility,
        description,
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
  async deleteRepository(
    @Context('req') req,
    @Args('deleteRepositoryArgs') args: DeleteRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id } = args;

      const _repository = await this.repositoryService.getDataById(id);
      // if (_repository.owner !== authUser.id) throw new Error('Not repository owner');

      const workspace = await this.workspaceService.getDataById(_repository.workspaceId);
      if (!workspace.members.some(member => member === authUser.id))
        throw new Error('Not workspace member');
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

      const _repository = await this.repositoryService.getDataById(id);
      /** Check permission of user if the repository is private */
      if (_repository.visibility === AccessVisibility.Private) {
        const isMember = await this.workspaceService.isWorkspaceMember(
          _repository.workspaceId,
          authUser.id
        );
        if (!isMember) throw new Error('Not workspace member');
      }

      if (!this.repositoryService.hasUserPinned(_repository, authUser.id)) {
        /** Add user id to the list of pinned in repository */
        await this.repositoryService.updateData(id, {
          pinned: _repository.pinned.concat(authUser.id),
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

      /** Check permission of user if the repository is private */
      const _repository = await this.repositoryService.getDataById(id);
      if (_repository.visibility === AccessVisibility.Private) {
        const isMember = await this.workspaceService.isWorkspaceMember(
          _repository.workspaceId,
          authUser.id
        );
        if (!isMember) throw new Error('Not workspace member');
      }

      if (this.repositoryService.hasUserPinned(_repository, authUser.id)) {
        /** Remove user id from the list of pinned in repository */
        await this.repositoryService.updateData(id, {
          pinned: _repository.pinned.filter(userWhoPin => userWhoPin !== authUser.id),
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
      const repository = await this.repositoryService.getDataById(id);
      const liked = repository.favorites.some(userId => userId === authUser.id);
      await this.repositoryService.updateData(id, {
        favorites: liked
          ? repository.favorites.filter(userId => userId !== authUser.id)
          : repository.favorites.concat([authUser.id]),
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
}
