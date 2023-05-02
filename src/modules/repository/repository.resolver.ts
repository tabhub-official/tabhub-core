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

@Resolver(() => Repository)
export class RepositoryResolver {
  constructor(private repositoryService: RepositoryService) {}

  @Query(() => [Repository])
  async getAllRepositories() {
    try {
      return this.repositoryService.getAllData();
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
      getAuthUser(req);
      const { name, tabs, workspaceId, description } = args;
      await this.repositoryService.createNewRepository(name, tabs, '', description, workspaceId);
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
      if (_repository.owner !== authUser.id) throw new Error("Not repository owner");
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
      if (_repository.owner !== authUser.id) throw new Error('Not repository owner');
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
