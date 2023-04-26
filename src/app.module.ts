import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import {
  RepositoryService,
  RepositoryTabService,
  UserResolver,
  UserService,
  WorkspaceResolver,
  WorkspaceService,
} from './modules';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { RepositoryResolver } from './modules/repository/repository.resolver';

const graphQLConfiguration = GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  context: context => {
    let req = context.req;
    const token = req.headers.authorization || "";
    console.log(token);
    if (context.connection) {
      req = context.connection.context.req;
    }
    return { req };
  },
});

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

const resolvers = [WorkspaceResolver, RepositoryResolver, UserResolver];
const services = [
  WorkspaceService,
  RepositoryService,
  RepositoryTabService,
  UserService,
  AppService,
];

@Module({
  imports: [graphQLConfiguration, generalConfiguration],
  controllers: [AppController],
  providers: [...resolvers, ...services],
})
export class AppModule {}
