import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';

export const PUB_SUB = 'PUB_SUB';

const RedisPubSubServer = (host: string, port: number) =>
  new RedisPubSub({
    connection: {
      host,
      port,
    },
  });

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PUB_SUB,
      useFactory: (configService: ConfigService) =>
        RedisPubSubServer(configService.get('REDIS_HOST'), configService.get('REDIS_PORT')),
      inject: [ConfigService],
    },
  ],
  exports: [PUB_SUB],
})
export class PubSubModule {}
