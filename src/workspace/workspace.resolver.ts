import { Resolver, Query } from '@nestjs/graphql';
import { WorkspaceService } from './workspace.service';
import { Workspace } from 'src/models';

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Query(() => [Workspace])
  async getAllWorkspaces() {
    return this.workspaceService.getAllWorkspaces();
  }
}
