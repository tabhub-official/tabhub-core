import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import { WorkspaceService } from './workspace.service';
import { AppResponse, ResponseType, Workspace } from 'src/models';
import {
  AddNewMemberArgs,
  ChangeWorkspaceVisibilityArgs,
  CreateNewWorkspaceArgs,
  DeleteWorkspaceArgs,
  GetWorkspaceByIdArgs,
  RemoveMemberArgs,
  UpdateWorkspaceArgs,
} from 'src/dto/workspace';
import { getAuthUser } from 'src/utils';
import { UserService } from '../user';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService, private userService: UserService) {}

  @Query(() => [Workspace])
  async getAllWorkspaces() {
    try {
      return this.workspaceService.getAllData();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Workspace])
  async getMyWorkspaces(@Context('req') req) {
    try {
      const authUser = getAuthUser(req);
      return this.workspaceService.getUserWorkspaces(authUser.id);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Workspace, { nullable: true })
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
    @Context('req') req,
    @Args('createNewWorksapceArgs') args: CreateNewWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { name, visibility, description } = args;
      await this.workspaceService.createNewWorkspace(
        authUser.id,
        name,
        description,
        authUser.id,
        visibility
      );
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
    @Context('req') req,
    @Args('updateWorkspaceArgs') args: UpdateWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const { id, ...workspace } = args;
      const authUser = getAuthUser(req);
      const _workspace = await this.workspaceService.getDataById(id);
      if (_workspace.owner !== authUser.id) throw new Error('Not workspace owner');
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
  async addWorkspaceMember(
    @Context('req') req,
    @Args('addWorkspaceMemberArgs') args: AddNewMemberArgs
  ): Promise<AppResponse> {
    try {
      const { id, ...workspace } = args;
      const authUser = getAuthUser(req);
      const _workspace = await this.workspaceService.getDataById(id);
      if (_workspace.owner !== authUser.id) throw new Error('Not workspace owner');

      const user = await this.userService.getUserByEmail(workspace.member_email);
      if (!user) throw new Error('Member email is not valid');

      if (_workspace.members.some(member => member === user.id))
        throw new Error('Member is added already');

      await this.workspaceService.updateData(id, {
        ..._workspace,
        updated_date: workspace.updated_date,
        members: _workspace.members.concat([user.id]),
      });
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
  async removeWorkspaceMember(
    @Context('req') req,
    @Args('removeWorkspaceMemberArgs') args: RemoveMemberArgs
  ): Promise<AppResponse> {
    try {
      const { id, ...workspace } = args;
      const authUser = getAuthUser(req);

      const _workspace = await this.workspaceService.getDataById(id);
      if (_workspace.owner !== authUser.id) throw new Error('Not workspace owner');

      const user = await this.userService.getUserByEmail(workspace.member_email);
      if (!user) throw new Error('Member email is not valid');

      if (!_workspace.members.some(member => member === user.id))
        throw new Error('Not a member of a workspace');

      await this.workspaceService.updateData(id, {
        ..._workspace,
        updated_date: workspace.updated_date,
        members: _workspace.members.filter(member => member !== user.id),
      });
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
    @Context('req') req,
    @Args('changeWorkspaceVisibilityArgs') args: ChangeWorkspaceVisibilityArgs
  ): Promise<AppResponse> {
    try {
      const { visibility, id, updated_date } = args;
      const authUser = getAuthUser(req);
      const _workspace = await this.workspaceService.getDataById(id);
      if (_workspace.owner !== authUser.id) throw new Error('Not workspace owner');
      await this.workspaceService.updateData(id, {
        ..._workspace,
        updated_date: updated_date,
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
  async deleteWorkspace(
    @Context('req') req,
    @Args('deleteWorkspaceArgs') args: DeleteWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const { id } = args;
      const authUser = getAuthUser(req);
      const _workspace = await this.workspaceService.getDataById(id);
      if (_workspace.owner !== authUser.id) throw new Error('Not workspace owner');
      for (const member of _workspace.members) {
        await this.userService.removeWorkspace(id, member);
      }
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
