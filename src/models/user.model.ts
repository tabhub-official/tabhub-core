import { Field, ObjectType } from '@nestjs/graphql';
import { MinLength, MaxLength, IsUUID, IsEmail } from 'class-validator';

import { RepositoryTab } from './repository-tab.model';
import { TimeTrackerSession, TimeTrackerSessionSetting } from './time-tracker.model';

@ObjectType()
export class UserWhoHasAccess {
  @Field(() => String)
  @IsUUID('4')
  id: string;

  /** public | contributor */
  @Field(() => String)
  type: string;
}

@ObjectType()
export class SteinGateZeroUser {
  @Field(() => Boolean, { defaultValue: false })
  time_tracker_enabled: boolean;

  @Field(() => TimeTrackerSessionSetting, { defaultValue: null, nullable: true })
  time_tracker_setting?: TimeTrackerSessionSetting | undefined;

  @Field(() => [TimeTrackerSession], { defaultValue: [] })
  time_tracker_sessions: TimeTrackerSession[];
}

@ObjectType()
export class User extends SteinGateZeroUser {
  @Field()
  @IsUUID('4')
  id: string;

  @Field({ nullable: false })
  created_date: number;

  @Field({ nullable: false })
  updated_date: number;

  @Field({ nullable: true })
  profile_image: string;

  @MinLength(1)
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

  @Field(() => [String], { defaultValue: [] })
  favorites: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of repositories IDs' })
  pinned_repositories: string[];

  @Field(() => [RepositoryTab], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned_tabs: RepositoryTab[];

  /** If selected_workspace == null => Default set to local workspace */
  @Field({ nullable: true, description: 'ID of selected workspace' })
  selected_workspace?: string;
}
