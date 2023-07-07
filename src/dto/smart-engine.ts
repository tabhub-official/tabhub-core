import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { ArrayNotEmpty } from 'class-validator';

import { RepositoryTabAsInput } from './repository';

@InputType()
export class SmartTabGroupingArgs {
  @ArrayNotEmpty()
  @Field(() => [RepositoryTabAsInput])
  tabs: RepositoryTabAsInput[];

  @ArrayNotEmpty()
  @Field(() => [String])
  groups: string[];
}

@ObjectType()
export class TabWithCategory {
  @Field(() => String)
  category: string;
}
