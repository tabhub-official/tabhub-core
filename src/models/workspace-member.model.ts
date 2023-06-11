import { Field, Int, ObjectType, PartialType } from '@nestjs/graphql';

import { User } from './user.model';

@ObjectType()
export class WorkspaceMember extends PartialType(User) {
  /** [Workspace Permission, Respository Permission, Tab Permission] */
  @Field(() => [Int])
  permision: number;

  @Field({ defaultValue: false })
  is_owner: boolean;

  @Field({ nullable: false })
  joined_date: number;
}
