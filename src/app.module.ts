import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './config';
import { contextAuthorizationMiddlware } from './middlewares';
import {
  DirectoryService,
  RepositoryService,
  RepositoryTabService,
  UserResolver,
  UserService,
  WorkspaceResolver,
  WorkspaceService,
} from './modules';
import { BrowsingEventResolver } from './modules/browsing-event';
import { CrawlerService } from './modules/crawler';
import { OpenAIService, SmartGroupService } from './modules/openai';
import { PingPongResolver } from './modules/ping';
import { PubSubModule } from './modules/pubsub';
import { RepositoryTabResolver } from './modules/repository-tab/repository-tab.resolver';
import { RepositoryResolver } from './modules/repository/repository.resolver';
import { StorageService } from './modules/storage';
import { TimeTrackerResolver, TimeTrackerSessionService } from './modules/time-tracker';

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
        'subscriptions-transport-ws': {
          onConnect: async connectionParams => {
            try {
              console.log('Connection params: ', connectionParams);
              const authToken = connectionParams.authToken;
              const token = await auth.verifyIdToken(authToken);
              if (!token) {
                throw new Error('Token is not valid');
              }
              // extract user information from token
              // return user info to add them to the context later
              return {
                user: {
                  id: token.uid,
                  email: token.email,
                  phone: token.phone_number,
                  picture: token.picture,
                },
              };
            } catch (error) {
              console.log(error.message);
              return undefined;
            }
          },
        },
      },
      sortSchema: true,
      context: contextAuthorizationMiddlware,
    };
  },
});

const resolvers = [
  TimeTrackerResolver,
  WorkspaceResolver,
  RepositoryResolver,
  RepositoryTabResolver,
  UserResolver,
  BrowsingEventResolver,
  PingPongResolver,
];

const services = [
  TimeTrackerSessionService,
  SmartGroupService,
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
