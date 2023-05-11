import { Field, InputType } from '@nestjs/graphql';
import { IsUUID, MaxLength, MinLength } from 'class-validator';
import * as moment from 'moment';
import { AccessVisibility } from 'src/models';

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

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class UpdateWorkspaceArgs {
  @Field()
  @IsUUID('4')
  id: string;

  @Field(() => AccessVisibility)
  visibility: AccessVisibility;

  @MinLength(1)
  @MaxLength(40)
  @Field({ nullable: false })
  name: string;

  @MaxLength(500)
  @Field({ nullable: true, defaultValue: '' })
  description?: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class DeleteWorkspaceArgs {
  @Field()
  @IsUUID()
  id: string;
}

@InputType()
export class AddNewMemberArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field()
  member_email: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class RemoveMemberArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field()
  member_email: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class SelectQuickAccessWorkspaceArgs {
  @Field({ nullable: true })
  @IsUUID()
  id?: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class GetWorkspaceByNameArgs {
  @Field()
  @IsUUID()
  userId: string;

  @Field()
  workspace_name: string;
}

@InputType()
export class GetWorkspaceByIdArgs {
  @Field()
  @IsUUID()
  id: string;
}

@InputType()
export class GetUserWorkspacesArgs {
  @Field()
  @IsUUID()
  userId: string;
}
