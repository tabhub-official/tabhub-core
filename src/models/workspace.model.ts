import { Field, Int, ObjectType } from '@nestjs/graphql';
import * as moment from 'moment';
import { AccessVisibility } from './accessibility';

@ObjectType()
export class Workspace {
  @Field(() => Int)
  id: number;

  @Field({ nullable: false, defaultValue: moment().unix() })
  created_date: number;

  @Field({ nullable: false, defaultValue: moment().unix() })
  updated_date: number;

  @Field({ nullable: false })
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: AccessVisibility.Private })
  visibility: number;
}
