import { Inject } from '@nestjs/common';
import { Resolver, Subscription } from '@nestjs/graphql';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { RepositoryTab } from 'src/models';

import { PUB_SUB } from '../pubsub';

@Resolver('TabManager')
export class TabManagerResolver {
  constructor(@Inject(PUB_SUB) private pubSub: RedisPubSub) {}

  @Subscription(() => RepositoryTab)
  commentAdded() {
    return this.pubSub.asyncIterator('commentAdded');
  }
}
