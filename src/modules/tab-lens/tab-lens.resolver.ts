import { Inject, Logger } from '@nestjs/common';
import { Args, Field, Mutation, ObjectType, Resolver, Subscription } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import moment from 'moment';

import { PUB_SUB } from '../pubsub';
import { PubSubEvent } from '../pubsub/pubsub.event';

@ObjectType()
export class TabLensUpdatedEvent {
  @Field()
  trigger_at: number;

  @Field()
  browser_client_id: string;

  @Field()
  data: string; // blob string
}

@Resolver(() => TabLensUpdatedEvent)
export class TabLensResolver {
  private readonly logger = new Logger(TabLensResolver.name);

  constructor(@Inject(PUB_SUB) private pubSub: RedisPubSub) {}

  @Mutation(() => TabLensUpdatedEvent)
  async triggerOnTabLensUpdatedEvent(
    @Args('browser_client_id') browser_client_id: string,
    @Args('data') data: string
  ): Promise<TabLensUpdatedEvent> {
    const topic = PubSubEvent.ON_TAB_LENS_UPDATED;
    this.logger.debug(`[SUBSCRIPTION] ${topic} from ${browser_client_id}`);
    const returnData: TabLensUpdatedEvent = {
      browser_client_id: browser_client_id,
      trigger_at: moment().unix(),
      data: data,
    };
    this.pubSub.publish(topic, { [topic]: returnData });
    return returnData;
  }

  @Subscription(() => TabLensUpdatedEvent, {
    filter: (payload, variables) =>
      payload.onTabLensUpdated.browser_client_id === variables.browser_client_id,
  })
  onTabLensUpdated(@Args('browser_client_id') browser_client_id: string) {
    const topic = PubSubEvent.ON_TAB_LENS_UPDATED;
    this.logger.debug(`-- [SUBSCRIPTION] Subscription for ${topic} from ${browser_client_id}`);
    return this.pubSub.asyncIterator(topic);
  }
}
