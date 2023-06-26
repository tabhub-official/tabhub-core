import { Inject } from '@nestjs/common';
import { Resolver, Mutation, Subscription, ObjectType, Field } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';

import { PUB_SUB } from '../pubsub';

@ObjectType()
export class Ping {
  @Field()
  id: string;
}

@ObjectType()
export class Pong {
  @Field()
  pingId: string;
}

const PONG_EVENT_NAME = 'pong';

@Resolver(() => Ping)
export class PingPongResolver {
  constructor(@Inject(PUB_SUB) private pubSub: RedisPubSub) {}

  @Mutation(() => Ping)
  async ping() {
    const pingId = Date.now();
    this.pubSub.publish(PONG_EVENT_NAME, { [PONG_EVENT_NAME]: { pingId } });
    return { id: pingId };
  }

  @Subscription(() => Pong)
  pong() {
    return this.pubSub.asyncIterator(PONG_EVENT_NAME);
  }
}
