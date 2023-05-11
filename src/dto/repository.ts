import { Field, InputType, PartialType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';
import * as moment from 'moment';
import { AccessVisibility, Repository } from 'src/models';

@InputType()
export class RepositoryTabAsInput {
  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  favIconUrl?: string;

  @Field(() => String, { nullable: true })
  title?: string;
}

@InputType()
export class CreateNewRepositoryArgs {
  @Field()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @MaxLength(200)
  @Field({ nullable: false })
  description?: string;

  @ArrayNotEmpty()
  @Field(() => [RepositoryTabAsInput])
  tabs: RepositoryTabAsInput[];

  @IsUUID('4')
  @Field(() => String, { nullable: false })
  workspaceId: string;

  @Field(() => AccessVisibility, { defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;
}

@InputType()
export class RemoveTabsFromRepositoryArgs {
  @Field()
  @IsUUID('4')
  id: string;

  @ArrayNotEmpty()
  @Field(() => [String])
  tabs: string[];
}

@InputType()
export class AddContributorArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field()
  member_email: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class RemoveContributorArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field()
  member_email: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;
}

@InputType()
export class UpdateRepositoryArgs extends PartialType(Repository, InputType) {}

@InputType()
export class DeleteRepositoryArgs {
  @Field()
  @IsUUID('4')
  id: string;
}

@InputType()
export class PinRepositoryArgs {
  @Field()
  @IsUUID('4')
  id: string;
}

@InputType()
export class GetRepositoryByIdArgs {
  @Field()
  @IsUUID('4')
  id: string;
}

@InputType()
export class GetUserRepositoriesArgs {
  @Field()
  @IsUUID('4')
  userId: string;
}

@InputType()
export class GetWorkspaceRepositoriesArgs {
  @Field()
  @IsUUID('4')
  workspaceId: string;
}

@InputType()
export class GetRepositoryByNameArgs {
  @Field()
  @IsUUID('4')
  workspaceId: string;

  @Field()
  name: string;
}
