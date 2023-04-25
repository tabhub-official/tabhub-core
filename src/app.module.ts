import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import {
  RepositoryService,
  RepositoryTabService,
  UserService,
  WorkspaceResolver,
  WorkspaceService,
} from './modules';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { WindowResolver } from './modules/window';
import { PubSubModule } from './modules/_message';

const modules = [PubSubModule];

const graphQLConfiguration = GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  installSubscriptionHandlers: true,
});

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

const configurations = [graphQLConfiguration, generalConfiguration]

const resolvers = [WorkspaceResolver, WindowResolver];

const services = [
  WorkspaceService,
  RepositoryService,
  UserService,
  RepositoryTabService,
  AppService,
];

const controllers = [AppController]

@Module({
  imports: [...modules, ...configurations],
  controllers: [...controllers],
  providers: [...resolvers, ...services],
})
export class AppModule {}
