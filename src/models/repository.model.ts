import { Field, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';
import { MinLength, MaxLength, IsUUID, IsEmail, ArrayNotEmpty } from 'class-validator';
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

  @ArrayNotEmpty()
  @Field(() => [RepositoryTab], { defaultValue: [], description: 'List of repository tab IDs' })
  tabs: RepositoryTab[];

  @Field(() => [String], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned: string[];

  @IsUUID('4')
  @Field(() => String, { nullable: false })
  workspaceId: string;
}
