import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { WorkspaceService } from './workspace.service';
import { AppResponse, ResponseType, Workspace } from 'src/models';
import {
  ChangeWorkspaceVisibilityArgs,
  CreateNewWorkspaceArgs,
  DeleteWorkspaceArgs,
  GetWorkspaceByIdArgs,
  UpdateWorkspaceArgs,
} from 'src/dto/workspace';
import { getAuthUser } from 'src/utils';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Query(() => [Workspace])
  async getAllWorkspaces() {
    try {
      return this.workspaceService.getAllData();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Workspace])
  async getMyWorkspaces(@Context("req") req) {
    try {
      const authUser = getAuthUser(req);
      return this.workspaceService.getUserWorkspaces(authUser.id);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Workspace, {nullable: true})
  async getWorkspaceById(
    @Args('getWorkspaceByIdArgs') args: GetWorkspaceByIdArgs
  ): Promise<Workspace> {
    try {
      const { id } = args;
      return this.workspaceService.getDataById(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async createNewWorkspace(
    @Context("req") req,
    @Args('createNewWorksapceArgs') args: CreateNewWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { name, visibility, description } = args;
      await this.workspaceService.createNewWorkspace(authUser.id, name, description, authUser.id, visibility);
      return {
        message: `Successfully create new workspace ${name}`,
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
  async updateWorkspace(
    @Args('updateWorkspaceArgs') args: UpdateWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const { id, ...workspace } = args;
      await this.workspaceService.updateData(id, workspace);
      return {
        message: `Successfully update workspace ${id}`,
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
  async changeWorkspaceVisibility(
    @Args('changeWorkspaceVisibilityArgs') args: ChangeWorkspaceVisibilityArgs
  ): Promise<AppResponse> {
    try {
      const { visibility, id } = args;
      await this.workspaceService.updateData(id, {
        visibility,
      });
      return {
        message: `Successfully change workspace visibility ${id}`,
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
  async deleteWorksace(
    @Args('deleteWorkspaceArgs') args: DeleteWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const { id } = args;
      await this.workspaceService.deleteData(id);
      return {
        message: `Successfully delete workspace ${id}`,
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
