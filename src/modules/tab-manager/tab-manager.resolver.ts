import { Inject, Logger } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Resolver, Subscription } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import moment from 'moment';

import { PUB_SUB } from '../pubsub';
import { PubSubEvent } from '../pubsub/pubsub.event';

@ObjectType()
export class TabManagerOnUpdatedEvent {
  @Field()
  trigger_at: number;

  @Field()
  browser_client_id: string;

  @Field()
  event_name: string;
}

@Resolver(() => TabManagerOnUpdatedEvent)
export class TabManagerResolver {
  private readonly logger = new Logger(TabManagerResolver.name);

  constructor(@Inject(PUB_SUB) private pubSub: RedisPubSub) {}

  @Mutation(() => TabManagerOnUpdatedEvent)
  async triggerOnTabManagerUpdatedEvent(
    @Args('browser_client_id') browser_client_id: string,
    @Args('event_name') event_name: string
  ): Promise<TabManagerOnUpdatedEvent> {
    const topic = PubSubEvent.ON_TAB_MANAGER_UPDATED;
    this.logger.log(`[SUBSCRIPTION] ${topic} from ${browser_client_id}`);
    const returnData = {
      browser_client_id: browser_client_id,
      trigger_at: moment().unix(),
      event_name,
    };
    this.pubSub.publish(topic, { [topic]: returnData });
    return returnData;
  }

  @Subscription(() => TabManagerOnUpdatedEvent, {
    filter: (payload, variables) =>
      payload.onTabManagerUpdated.browser_client_id === variables.browser_client_id,
  })
  onTabManagerUpdated(@Args('browser_client_id') browser_client_id: string) {
    const topic = PubSubEvent.ON_TAB_MANAGER_UPDATED;
    this.logger.log(`-- [SUBSCRIPTION] Subscription for ${topic} from ${browser_client_id}`);
    return this.pubSub.asyncIterator(topic);
  }
}
