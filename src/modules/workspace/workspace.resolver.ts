import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { WorkspaceService } from './workspace.service';
import { AppResponse, ResponseType, Workspace } from 'src/models';
import { ChangeWorkspaceVisibilityArgs, CreateNewWorkspaceArgs, DeleteWorkspaceArgs, GetWorkspaceByIdArgs, UpdateWorkspaceArgs } from 'src/dto/workspace';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Query(() => [Workspace])
  async getAllWorkspaces() {
    try {
      return this.workspaceService.getAllWorkspaces();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Workspace)
  async getWorkspaceById(
    @Args('getWorkspaceByIdArgs') args: GetWorkspaceByIdArgs
  ): Promise<Workspace> {
    try {
      const { id } = args;
      return this.workspaceService.getWorkspaceById(id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Mutation(() => AppResponse)
  async createNewWorkspace(
    @Args('createNewWorksapceArgs') args: CreateNewWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const { name, visibility, description } = args;
      await this.workspaceService.createNewWorkspace(name, description, visibility);
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
      await this.workspaceService.updateWorkspace(id, workspace);
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
      await this.workspaceService.updateWorkspace(id, {
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
      await this.workspaceService.deleteWorkspace(id);
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
