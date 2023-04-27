import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { RepositoryService } from './repository.service';
import { AppResponse, Repository, ResponseType } from 'src/models';
import {
  CreateNewRepositoryArgs,
  DeleteRepositoryArgs,
  GetRepositoryByIdArgs,
  UpdateRepositoryArgs,
} from 'src/dto';

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
    @Args('createRepositoryArgs') args: CreateNewRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const { name, tabs, workspaceId, description } = args;
      // TODO Requires auth middlware
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
    @Args('updateRepositoryArgs') args: UpdateRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const { id, ...repository } = args;
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
    @Args('deleteRepositoryArgs') args: DeleteRepositoryArgs
  ): Promise<AppResponse> {
    try {
      const { id } = args;
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
