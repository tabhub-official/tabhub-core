import { Field, ObjectType } from '@nestjs/graphql';
import { MinLength, MaxLength, IsUUID, IsEmail, ArrayNotEmpty } from 'class-validator';
import * as moment from 'moment';

import { AccessVisibility } from './accessibility';
import { Directory } from './directory.model';
import { RepositoryTab } from './repository-tab.model';

@ObjectType()
export class Repository {
  @Field()
  @IsUUID('4')
  id: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  created_date: number;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;

  @MinLength(1)
  @MaxLength(40)
  @Field(() => String, { nullable: false })
  name: string;

  @MaxLength(200)
  @Field({ nullable: true })
  description?: string;

  @IsUUID('4')
  @IsEmail()
  @Field(() => String, { nullable: false })
  owner: string;

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  contributors: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  favorites: string[];

  @Field(() => AccessVisibility, { defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;

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
