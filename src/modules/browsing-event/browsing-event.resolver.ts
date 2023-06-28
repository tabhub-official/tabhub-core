import { Inject, Logger } from '@nestjs/common';
import { Args, Mutation, Resolver, Subscription } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import moment from 'moment';
import { BrowsingEvent, OnBrowsingEventUpdatedArgs, TriggerBrowsingEventArgs } from 'src/models';

import { PUB_SUB } from '../pubsub';
import { PubSubEvent } from '../pubsub/pubsub.event';

const TOPIC = PubSubEvent.ON_BROWSING_EVENT_UPDATED;

@Resolver(() => BrowsingEvent)
export class BrowsingEventResolver {
  private readonly logger = new Logger(BrowsingEventResolver.name);

  constructor(@Inject(PUB_SUB) private pubSub: RedisPubSub) {}

  @Mutation(() => BrowsingEvent)
  async triggerOnBrowsingEventUpdated(
    @Args('triggerBrowsingEventArgs') args: TriggerBrowsingEventArgs
  ): Promise<BrowsingEvent> {
    const { browser_client_id, event_name, properties, user_id } = args;
    const returnData: BrowsingEvent = {
      browser_client_id,
      properties,
      user_id,
      event_name,
      trigger_at: moment().unix(),
    };
    this.logger.debug(
      `[SUBSCRIPTION] ${TOPIC} from ${browser_client_id} --- payload: ${JSON.stringify(returnData)}`
    );
    this.pubSub.publish(TOPIC, { [TOPIC]: returnData });
    return returnData;
  }

  @Subscription(() => BrowsingEvent, {
    filter: (
      payload,
      variables: { onBrowsingEventArgs: { browser_client_id: string; subscribed_events: string[] } }
    ) => {
      const sameBrowserClient =
        payload.onBrowsingEventUpdated.browser_client_id ===
        variables.onBrowsingEventArgs.browser_client_id;
      const containsEvent = variables.onBrowsingEventArgs.subscribed_events.includes(
        payload.onBrowsingEventUpdated.event_name
      );
      return sameBrowserClient && containsEvent;
    },
  })
  onBrowsingEventUpdated(@Args('onBrowsingEventArgs') args: OnBrowsingEventUpdatedArgs) {
    const { browser_client_id, subscribed_events } = args;
    this.logger.debug(
      `-- [SUBSCRIPTION] Subscription for ${TOPIC} from ${browser_client_id} | EVENTS: ${subscribed_events}`
    );
    return this.pubSub.asyncIterator(TOPIC);
  }
}
