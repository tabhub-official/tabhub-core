import { Field, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';
import { MinLength, MaxLength, IsUUID, IsEmail, ArrayNotEmpty } from 'class-validator';

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

  @IsEmail()
  @Field(() => String, { nullable: false })
  owner: string;

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  contributors: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of user IDs' })
  favorites: string[];

  @ArrayNotEmpty()
  @Field(() => [String], { defaultValue: [], description: 'List of repository tab IDs' })
  tabs: string[];

  @Field(() => [String], { defaultValue: [], description: 'List of repository tabs IDs' })
  pinned: string[];
}
