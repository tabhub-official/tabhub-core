import { Field, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';
import { MinLength, MaxLength, IsUUID, IsEmail } from 'class-validator';

@ObjectType()
export class User {
  @Field()
  @IsUUID('4')
  id: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  created_date: number;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;

  @MinLength(1) r;
  @MaxLength(25)
  @Field({ nullable: false })
  username: string;

  @MaxLength(100)
  @Field({ nullable: true })
  full_name?: string;

  @IsEmail()
  @Field({ nullable: false })
  email: string;

  @IsEmail()
  @Field({ defaultValue: 'UNKNOWN' })
  provider: string;

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  followers: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  following: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of workspace IDs' })
  workspaces: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of repositories IDs' })
  pinned_repositories: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned_tabs: string[];

  /** If selected_workspace == null => Default set to local workspace */
  @Field({ nullable: true, description: 'ID of selected workspace' })
  selected_workspace?: string;
}
