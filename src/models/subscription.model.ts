import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType()
@InputType('Subscription')
export class Subscription {
  @Field(() => String)
  email: string;

  @Field(() => String)
  customerId: string;

  @Field(() => String, { defaultValue: 'starter' })
  plan: string;

  @Field({ nullable: false })
  created_date: number;

  @Field({ nullable: false })
  updated_date: number;
}
