import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';

export const PUB_SUB = 'PUB_SUB';

const RedisPubSubServer = (host: string, port: number, username: string, password: string) =>
  new RedisPubSub({
    connection: {
      host,
      port,
      username,
      password,
    },
  });

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: PUB_SUB,
      useFactory: (configService: ConfigService) =>
        RedisPubSubServer(
          configService.get('REDIS_HOST'),
          configService.get('REDIS_PORT'),
          configService.get('REDIS_USERNAME'),
          configService.get('REDIS_PASSWORD')
        ),
      inject: [ConfigService],
    },
  ],
  exports: [PUB_SUB],
})
export class PubSubModule {
  private readonly logger = new Logger(PubSubModule.name);
  onModuleInit() {
    const [port, host] = [process.env.REDIS_HOST, process.env.REDIS_PORT];
    this.logger.log(`[REDIS_PUBSUB] connect to ${port}:${host}`);
  }
}
