import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { WorkspaceService } from './workspace.service';
import { AccessVisibility, AppResponse, ResponseType, Workspace } from 'src/models';
import { MaxLength, MinLength } from 'class-validator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
class CreateNewWorkspaceArgs {
  @Field()
  @MinLength(3)
  @MaxLength(20)
  name: string;

  @Field({ nullable: true })
  @MaxLength(500)
  description?: string;

  @Field({ defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;
}

@Resolver(() => Workspace)
export class WorkspaceResolver {
  constructor(private workspaceService: WorkspaceService) {}

  @Query(() => [Workspace])
  async getAllWorkspaces() {
    return this.workspaceService.getAllWorkspaces();
  }

  @Mutation(() => AppResponse)
  async createNewWorkspace(
    @Args('createNewWorksapceArgs') args: CreateNewWorkspaceArgs
  ): Promise<AppResponse> {
    try {
      const { name, visibility, description } = args;
      await this.workspaceService.createNewWorkspace(name, description, visibility);
      return {
        message: `Successfully created workspace ${name}`,
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
