import { Field, ObjectType } from '@nestjs/graphql';
import { MaxLength, IsUUID, IsEmail, ArrayNotEmpty } from 'class-validator';

import { AccessPermission, AccessVisibility } from './accessibility';
import { Directory } from './directory.model';
import { RepositoryTab } from './repository-tab.model';

@ObjectType()
export class Repository {
  @Field()
  @IsUUID('4')
  id: string;

  @Field({ nullable: false })
  created_date: number;

  @Field({ nullable: false })
  updated_date: number;

  @Field(() => String, { nullable: false })
  name: string;

  @Field(() => String, { nullable: false })
  slug: string;

  @Field(() => String, { nullable: false })
  icon: string;

  @MaxLength(200)
  @Field({ nullable: true })
  description?: string;

  @IsUUID('4')
  @IsEmail()
  @Field(() => String, { nullable: false })
  owner: string;

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  contributors: string[];

  @Field(() => [String], {
    defaultValue: [],
    description: 'List of user IDs who can access the repository shared mode',
  })
  permittedUsers: string[];

  @Field(() => AccessVisibility, { defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  favorites: string[];

  @Field(() => AccessPermission, { defaultValue: AccessPermission.OnlyPeopleWhoHasAccess })
  accessPermission: AccessPermission;

  /** About directory and tab: Store list of directories, the order of query must from the directory first then tabs */
  @ArrayNotEmpty()
  @Field(() => [RepositoryTab], { defaultValue: [], description: 'List of repository tab IDs' })
  tabs: RepositoryTab[];

  @ArrayNotEmpty()
  @Field(() => [Directory], { defaultValue: [], description: 'List of directory IDs' })
  directories: Directory[];

  @Field(() => [String], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned: string[];

  @IsUUID('4')
  @Field(() => String, { nullable: false })
  workspaceId: string;
}
