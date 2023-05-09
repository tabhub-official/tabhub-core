import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { RepositoryService } from './repository.service';
import { AccessVisibility, AppResponse, Repository, ResponseType } from 'src/models';
import {
  AddContributorArgs,
  CreateNewRepositoryArgs,
  DeleteRepositoryArgs,
  GetRepositoryByIdArgs,
  GetRepositoryByNameArgs,
  PinRepositoryArgs,
  RemoveContributorArgs,
  RemoveTabsFromRepositoryArgs,
  UpdateRepositoryArgs,
} from 'src/dto';
import { getAuthUser } from 'src/utils';
import { WorkspaceService } from '../workspace';
import { RepositoryTabService } from '../repository-tab';
import { UserService } from '../user';

@Resolver(() => Repository)
export class RepositoryResolver {
  constructor(
    private repositoryService: RepositoryService,
    private workspaceService: WorkspaceService,
    private repositoryTabService: RepositoryTabService,
    private userService: UserService
  ) {}

  @Query(() => [Repository])
  async getWorkspaceRepositories(
    @Context('req') req,
    @Args('getRepositoryById') args: GetRepositoryByIdArgs
  ) {
    try {
      const authUser = getAuthUser(req);
      const { id: workspaceId } = args;
      const isMember = await this.workspaceService.isWorkspaceMember(workspaceId, authUser.id);
      if (!isMember) throw new Error('Not workspace member');
      return this.repositoryService.getWorkspaceRepositories(workspaceId);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Repository])
  async getAllPublicRepositories() {
    try {
      return this.repositoryService.getAllPublicRepositories();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Repository)
  async getRepositoryByName(
    @Args('getRepositoryBName') args: GetRepositoryByNameArgs
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
    @Args('getRepositoryById') args: GetRepositoryByIdArgs
  ): Promise<Repository> {
    try {
      const { id } = args;
      return this.repositoryService.getDataById(id);
    } catch (error) {
      throw new Error(error);
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
      const { name, tabs, workspaceId, description, visibility } = args;

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
          message: `Successfully create new repository ${name}`,
          type: ResponseType.Success,
        };
      } else {
        /** Create new repository if not exist */
        await this.repositoryService.createNewRepository(
          name,
          tabs,
          authUser.id,
          workspaceId,
          visibility,
          description
        );
        return {
          message: `Successfully update repository ${name}`,
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
      if (!isMember) throw new Error('Not workspace member');

      /** Add tabs to existing repository if existed */
      await this.repositoryService.updateData(existingRepository.id, {
        tabs: existingRepository.tabs.filter(
          tab => !tabs.some(removedTab => removedTab === tab.id)
        ),
      });
      return {
        message: `Successfully create new repository ${name}`,
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
      const { id, ...workspace } = args;
      const authUser = getAuthUser(req);
      const _repository = await this.repositoryService.getDataById(id);

      const isWorkspaceMember = await this.workspaceService.isWorkspaceMember(
        _repository.workspaceId,
        authUser.id
      );
      if (!isWorkspaceMember) throw new Error('Not workspace member');

      const isRepositoryContributor = await this.repositoryService.isRepositoryContributor(
        id,
        authUser.id
      );
      const user = await this.userService.getUserByEmail(workspace.member_email);
      if (!user) throw new Error('Contributor email is not valid');

      if (isRepositoryContributor) throw new Error('Contributor is added already');

      await this.repositoryService.updateData(id, {
        ..._repository,
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
      const { id, ...workspace } = args;
      const authUser = getAuthUser(req);
      const _repository = await this.repositoryService.getDataById(id);

      const isWorkspaceMember = await this.workspaceService.isWorkspaceMember(
        _repository.workspaceId,
        authUser.id
      );
      if (!isWorkspaceMember) throw new Error('Not workspace member');

      const isRepositoryContributor = await this.repositoryService.isRepositoryContributor(
        id,
        authUser.id
      );
      const user = await this.userService.getUserByEmail(workspace.member_email);
      if (!user) throw new Error('Contributor email is not valid');

      if (!isRepositoryContributor) throw new Error('Not a repository contributor');

      await this.repositoryService.updateData(id, {
        ..._repository,
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
  async updateRepository(
    @Context('req') req,
    @Args('updateRepositoryArgs') args: UpdateRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id, ...repository } = args;
      const _repository = await this.repositoryService.getDataById(id);
      // if (_repository.owner !== authUser.id) throw new Error('Not repository owner');

      const isMember = await this.workspaceService.isWorkspaceMember(
        _repository.workspaceId,
        authUser.id
      );
      if (!isMember) throw new Error('Not workspace member');

      await this.repositoryService.updateData(id, repository);
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

      const _repository = await this.repositoryService.getDataById(id);
      if (_repository.visibility === AccessVisibility.Private) {
        const isMember = await this.workspaceService.isWorkspaceMember(
          _repository.workspaceId,
          authUser.id
        );
        if (!isMember) throw new Error('Not workspace member');
      }

      if (!this.repositoryService.hasUserPinned(_repository, authUser.id)) {
        await this.repositoryService.updateData(id, {
          pinned: _repository.pinned.concat(authUser.id),
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

      const _repository = await this.repositoryService.getDataById(id);
      if (_repository.visibility === AccessVisibility.Private) {
        const isMember = await this.workspaceService.isWorkspaceMember(
          _repository.workspaceId,
          authUser.id
        );
        if (!isMember) throw new Error('Not workspace member');
      }

      if (this.repositoryService.hasUserPinned(_repository, authUser.id)) {
        await this.repositoryService.updateData(id, {
          pinned: _repository.pinned.filter(userWhoPin => userWhoPin !== authUser.id),
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
}
