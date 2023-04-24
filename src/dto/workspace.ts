import { Field, InputType, PartialType } from '@nestjs/graphql';
import { IsUUID, MaxLength, MinLength } from 'class-validator';
import { AccessVisibility, Workspace } from 'src/models';

@InputType()
export class CreateNewWorkspaceArgs {
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

@InputType()
export class ChangeWorkspaceVisibilityArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field(() => AccessVisibility)
  visibility: AccessVisibility;
}

@InputType()
export class UpdateWorkspaceArgs extends PartialType(Workspace, InputType) {}

@InputType()
export class DeleteWorkspaceArgs {
  @Field()
  @IsUUID()
  id: string;
}

@InputType()
export class GetWorkspaceByIdArgs {
  @Field()
  @IsUUID()
  id: string;
}
