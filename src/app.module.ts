import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { contextAuthorizationMiddlware } from './middlewares';
import {
  DirectoryService,
  RepositoryService,
  RepositoryTabService,
  TabManagerResolver,
  UserResolver,
  UserService,
  WorkspaceResolver,
  WorkspaceService,
} from './modules';
import { CrawlerService } from './modules/crawler';
import { OpenAIService } from './modules/openai';
import { PingPongResolver } from './modules/ping';
import { PubSubModule } from './modules/pubsub';
import { RepositoryTabResolver } from './modules/repository-tab/repository-tab.resolver';
import { RepositoryResolver } from './modules/repository/repository.resolver';
import { StorageService } from './modules/storage';

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

const graphQLConfiguration = GraphQLModule.forRootAsync<ApolloDriverConfig & { uploads: boolean }>({
  driver: ApolloDriver,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory(configService: ConfigService) {
    return {
      playground: Boolean(configService.get('GRAPHQL_PLAYGROUND')),
      uploads: false, // disable built-in upload handling
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      installSubscriptionHandlers: true,
      subscriptions: {
        'subscriptions-transport-ws': true,
        'graphql-ws': true,
      },
      sortSchema: true,
      context: contextAuthorizationMiddlware,
    };
  },
});

const resolvers = [
  WorkspaceResolver,
  RepositoryResolver,
  RepositoryTabResolver,
  UserResolver,
  TabManagerResolver,
  PingPongResolver,
];
const services = [
  StorageService,
  CrawlerService,
  RepositoryService,
  DirectoryService,
  RepositoryTabService,
  WorkspaceService,
  UserService,
  OpenAIService,
  AppService,
];

@Module({
  imports: [graphQLConfiguration, generalConfiguration, ThrottlerModule.forRoot(), PubSubModule],
  controllers: [AppController],
  providers: [...services, ...resolvers],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);
  onModuleInit() {
    this.logger.log(`MODE ${[process.env.NODE_ENV]}`);
  }
}
