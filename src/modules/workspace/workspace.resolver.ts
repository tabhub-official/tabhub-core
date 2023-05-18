import { Resolver, Query, Args, Mutation, Context } from '@nestjs/graphql';
import {
  AddNewMemberArgs,
  ChangeWorkspaceVisibilityArgs,
  CreateNewWorkspaceArgs,
  DeleteWorkspaceArgs,
  GetUserWorkspacesArgs,
  GetWorkspaceByIdArgs,
  GetWorkspaceByNameArgs,
  RemoveMemberArgs,
  SelectQuickAccessWorkspaceArgs,
  UpdateWorkspaceArgs,
} from 'src/dto/workspace';
import { AccessVisibility, AppResponse, ResponseType, Workspace } from 'src/models';
import { getAuthUser, getUnsafeAuthUser } from 'src/utils';

import { RepositoryService } from '../repository';
import { RepositoryTabService } from '../repository-tab';
import { UserService } from '../user';
import { WorkspaceService } from './workspace.service';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(
    private workspaceService: WorkspaceService,
    private userService: UserService,
    private repositoryService: RepositoryService,
    private repositoryTabService: RepositoryTabService
  ) {}

  @Query(() => [Workspace])
  async getAllWorkspaces() {
    try {
      return this.workspaceService.getPublicWorkspaces();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Workspace])
  async getMyWorkspaces(@Context('req') req) {
    try {
      const authUser = getAuthUser(req);
      return this.workspaceService.getAuthUserWorkspaces(authUser.id);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => [Workspace])
  async getUserWorkspaces(@Args('getUserWorkspacesArgs') args: GetUserWorkspacesArgs) {
    try {
      const { userId } = args;
      return this.workspaceService.getUserPublicWorkspaces(userId);
    } catch (error: any) {
      throw new Error(error);
    }
  }

  @Query(() => Workspace, { nullable: true })
  async getWorkspaceById(
    @Context('req') req,
    @Args('getWorkspaceByIdArgs') args: GetWorkspaceByIdArgs
  ): Promise<Workspace> {
    try {
      const { id } = args;
      const authUser = getUnsafeAuthUser(req);
      return this.workspaceService.getAuthWorkspaceById(authUser?.id, id);
    } catch (error) {
      throw new Error(error);
    }
  }

  @Query(() => Workspace, { nullable: true })
  async getWorkspaceByName(
    @Context('req') req,
    @Args('getWorkspaceByNameArgs') args: GetWorkspaceByNameArgs
  ): Promise<Workspace> {
    try {
      const { workspace_name } = args;
      const authUser = getUnsafeAuthUser(req);
      return this.workspaceService.getAuthUserWorkspaceByName(authUser?.id, workspace_name);
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
  async selectQuickAccessWorkspace(
    @Context('req') req,
    @Args('selectQuickAccessWorkspaceArgs') args: SelectQuickAccessWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const authUser = getAuthUser(req);
      const { id, updated_date } = args;
      /** Undefined id is suppposed to be local workspace */
      if (id) {
        const workspace = await this.workspaceService.getDataById(id);
        /** User can only select the workspace as quick access if they are member of the private workspace */
        /** For public workspace, everyone can select it as quick access */
        if (
          workspace.visibility === AccessVisibility.Private &&
          !workspace.members.includes(authUser.id)
        ) {
          throw new Error("User don't have access to the workspace");
        }
      }
      await this.userService.updateData(authUser.id, {
        selected_workspace: id,
        updated_date,
      });
      return {
        message: `Successfully select workspace ${id} as quick access`,
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
      const workspaceRepositories = await this.repositoryService.getWorkspaceRepositories(id);
      /** Cascading delete workspace -> repositories -> repository tabs */
      for (const repository of workspaceRepositories) {
        await this.repositoryService.deleteData(repository.id);
        for (const tab of repository.tabs) {
          await this.repositoryTabService.deleteData(tab.id);
        }
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
