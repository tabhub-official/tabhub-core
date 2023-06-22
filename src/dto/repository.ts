import { Field, InputType, PartialType } from '@nestjs/graphql';
import { ArrayNotEmpty, IsUUID, MaxLength, MinLength } from 'class-validator';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.js';
import {
  AccessPermission,
  AccessVisibility,
  Directory,
  Repository,
  RepositoryTab,
} from 'src/models';

@InputType()
export class RepositoryTabAsInput {
  @Field(() => String)
  url: string;

  @Field(() => String, { nullable: true })
  customName?: string;

  @Field(() => String, { nullable: true })
  favIconUrl?: string;

  @Field(() => String, { nullable: true })
  title?: string;

  @Field({ nullable: true })
  parentDirectory?: string;
}

@InputType()
export class FullRepositoryTabAsInput extends RepositoryTab {}

@InputType()
export class SetRepositoryDirectoriesArgs {
  @Field()
  @IsUUID('4')
  id: string;

  @ArrayNotEmpty()
  @Field(() => [Directory])
  directories: Directory[];
}

@InputType()
export class CreateNewRepositoryArgs {
  @Field()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @Field(() => String)
  icon: string;

  @MaxLength(200)
  @Field({ nullable: false })
  description?: string;

  @ArrayNotEmpty()
  @Field(() => [RepositoryTabAsInput])
  tabs: RepositoryTabAsInput[];

  @ArrayNotEmpty()
  @Field(() => [Directory])
  directories: Directory[];

  @IsUUID('4')
  @Field(() => String, { nullable: false })
  workspaceId: string;

  @Field(() => AccessVisibility, { defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;
}

@InputType()
export class SetRepositoryTabsArgs {
  @Field()
  @IsUUID('4')
  id: string;

  @ArrayNotEmpty()
  @Field(() => [FullRepositoryTabAsInput])
  tabs: FullRepositoryTabAsInput[];

  @ArrayNotEmpty()
  @Field(() => [Directory])
  directories: Directory[];
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
}

@InputType()
export class RemoveContributorArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field()
  member_email: string;
}

@InputType()
export class UpdateRepositoryArgs extends PartialType(Repository, InputType) {}

@InputType()
export class UpdateRepositoryAccessArgs {
  @Field()
  @IsUUID()
  id: string;

  @Field(() => [String], {
    defaultValue: [],
  })
  permittedUsers: string[];

  @Field(() => AccessPermission, { defaultValue: AccessPermission.OnlyPeopleWhoHasAccess })
  accessPermission: AccessPermission;
}

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
export class ToggleLikeRepositoryArgs {
  @Field()
  @IsUUID('4')
  id: string;
}

@InputType()
export class UnlikeRepositoryArgs {
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
export class GetAllPublicRepositoriesArgs {
  @Field()
  limit: number;

  @Field()
  offset: number;
}

@InputType()
export class GetRepositoryBySlugArgs {
  @Field()
  @IsUUID('4')
  workspaceId: string;

  @Field()
  slug: string;
}

@InputType()
export class PinRepositoryTabArgs {
  @Field()
  @IsUUID('4')
  tabId: string;

  @Field()
  @IsUUID('4')
  repositoryId: string;
}

@InputType()
export class UpdateRepositoryBannerArgs {
  @Field()
  repositoryId: string;

  @Field(() => GraphQLUpload)
  bannerData: GraphQLUpload;

  @Field()
  mimeType: string;
}

@InputType()
export class UpdateReadmeArgs {
  @Field()
  repositoryId: string;

  @Field()
  readmeData: string;
}

@InputType()
export class ReadReadmeArgs {
  @Field()
  repositoryId: string;
}

@InputType()
export class GetRepositoryBannerArgs {
  @Field()
  repositoryId: string;
}

@InputType()
export class UnpinRepositoryTabArgs {
  @Field()
  @IsUUID('4')
  tabId: string;
}
