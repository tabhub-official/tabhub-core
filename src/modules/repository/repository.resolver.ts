import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { RepositoryService } from './repository.service';
import { AppResponse, Repository, ResponseType } from 'src/models';
import {
  CreateNewRepositoryArgs,
  DeleteRepositoryArgs,
  GetRepositoryByIdArgs,
  UpdateRepositoryArgs,
} from 'src/dto';
import { getAuthUser } from 'src/utils';
import { WorkspaceService } from '../workspace';

@Resolver(() => Repository)
export class RepositoryResolver {
  constructor(
    private repositoryService: RepositoryService,
    private workspaceService: WorkspaceService
  ) {}

  @Query(() => [Repository])
  async getWorkspaceRepositories(
    @Context('req') req,
    @Args('getRepositoryById') args: GetRepositoryByIdArgs
  ) {
    try {
      const authUser = getAuthUser(req);
      const { id: workspaceId } = args;
      const workspace = await this.workspaceService.getDataById(workspaceId);
      if (!workspace.members.some(member => member === authUser.id))
        throw new Error('Not workspace member');
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
    try {
      const authUser = getAuthUser(req);
      const { name, tabs, workspaceId, description, visibility } = args;

      const workspace = await this.workspaceService.getDataById(workspaceId);
      if (!workspace.members.some(member => member === authUser.id))
        throw new Error('Not workspace member');

      await this.repositoryService.createNewRepository(name, tabs, authUser.id, workspaceId, visibility, description);
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
  async updateRepository(
    @Context('req') req,
    @Args('updateRepositoryArgs') args: UpdateRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id, ...repository } = args;
      const _repository = await this.repositoryService.getDataById(id);
      // if (_repository.owner !== authUser.id) throw new Error('Not repository owner');

      const workspace = await this.workspaceService.getDataById(_repository.workspaceId);
      if (!workspace.members.some(member => member === authUser.id))
        throw new Error('Not workspace member');

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
}
