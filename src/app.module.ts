import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { auth } from './config/firebase-config';
import {
  DirectoryService,
  RepositoryService,
  RepositoryTabService,
  UserResolver,
  UserService,
  WorkspaceResolver,
  WorkspaceService,
} from './modules';
import { CrawlerService } from './modules/crawler';
import { OpenAIService } from './modules/openai';
import { RepositoryTabResolver } from './modules/repository-tab/repository-tab.resolver';
import { RepositoryResolver } from './modules/repository/repository.resolver';
import { StorageService } from './modules/storage';

const graphQLConfiguration = GraphQLModule.forRoot<ApolloDriverConfig & { uploads: boolean }>({
  driver: ApolloDriver,
  uploads: false, // disable built-in upload handling
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  context: async context => {
    let req = context.req;
    if (context.connection) {
      req = context.connection.context.req;
    }
    try {
      const regex = /Bearer (.+)/i;
      if (req.headers['authorization']) {
        const idToken = req.headers['authorization'].match(regex)?.[1];
        if (idToken) {
          const token = await auth.verifyIdToken(idToken);
          req.user = {
            id: token.uid,
            email: token.email,
            phone: token.phone_number,
            picture: token.picture,
          };
        }
      }
      return { ...context, req };
    } catch (error) {
      console.log(error);
      return { req };
    }
  },
});

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

const resolvers = [WorkspaceResolver, RepositoryResolver, RepositoryTabResolver, UserResolver];
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
  imports: [graphQLConfiguration, generalConfiguration, ThrottlerModule.forRoot()],
  controllers: [AppController],
  providers: [...services, ...resolvers],
})
export class AppModule {}
