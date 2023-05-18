import { Field, InputType } from '@nestjs/graphql';
import { ArrayNotEmpty } from 'class-validator';

import { RepositoryTabAsInput } from './repository';

@InputType()
export class SmartTabGroupingArgs {
  @ArrayNotEmpty()
  @Field(() => [RepositoryTabAsInput])
  tabs: RepositoryTabAsInput[];
}
