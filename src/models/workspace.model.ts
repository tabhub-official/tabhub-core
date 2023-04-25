import { Field, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';
import { AccessVisibility } from './accessibility';
import { MaxLength, MinLength, IsUUID, ArrayNotEmpty } from 'class-validator';

@ObjectType()
export class Workspace {
  @Field()
  @IsUUID('4')
  id: string;

  @Field({ nullable: false, defaultValue: moment().unix() })
  created_date: number;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;

  @MinLength(1)
  @MaxLength(40)
  @Field({ nullable: false })
  name: string;

  @Field()
  @IsUUID('4')
  owner: string;

  @MaxLength(500)
  @Field({ nullable: true, defaultValue: '' })
  description?: string;

  @Field(() => AccessVisibility, { defaultValue: AccessVisibility.Private })
  visibility: AccessVisibility;

  @ArrayNotEmpty()
  @Field(() => [String], { defaultValue: [] })
  members: string[];

  @Field(() => [String], { defaultValue: [] })
  repositories: string[];
}
