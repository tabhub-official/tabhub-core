import { Resolver, Subscription } from '@nestjs/graphql';
import { WindowService } from './window.service';
import { Inject } from '@nestjs/common';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { PUB_SUB } from '../_message/pubsub.module';
import { LocalWindow } from 'src/models/window.model';

const WINDOW_ADDED_EVENT = 'windowAdded';

@Resolver(() => LocalWindow)
export class WindowResolver {
  constructor(private windowService: WindowService, @Inject(PUB_SUB) private pubSub: RedisPubSub) {}

  @Subscription(() => LocalWindow)
  windowAdded() {
    return this.pubSub.asyncIterator(WINDOW_ADDED_EVENT);
  }
}
