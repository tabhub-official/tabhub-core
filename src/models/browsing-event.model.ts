import { Field, InputType, ObjectType, PartialType } from '@nestjs/graphql';

@ObjectType()
export class BrowsingEvent {
  @Field()
  trigger_at: number;

  @Field()
  browser_client_id: string;

  @Field({ nullable: true })
  user_id?: string;

  @Field()
  event_name: string;

  @Field({ nullable: true })
  properties: string;
}

@InputType()
export class TriggerBrowsingEventArgs extends PartialType(BrowsingEvent, InputType) {}

@InputType()
export class OnBrowsingEventUpdatedArgs {
  @Field(() => String)
  browser_client_id: string;

  @Field(() => [String])
  subscribed_events: string[];
}
