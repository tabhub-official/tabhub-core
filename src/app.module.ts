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
import { auth } from './config/firebase-config';

const graphQLConfiguration = GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
  context: async context => {
    let req = context.req;
    if (context.connection) {
      req = context.connection.context.req;
    }
    try {
      const regex = /Bearer (.+)/i;
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
      return { req };
    } catch (error) {
      console.log(error);
      return { req };
    }
  },
});

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

const resolvers = [WorkspaceResolver, RepositoryResolver, UserResolver];
const services = [
  RepositoryService,
  RepositoryTabService,
  WorkspaceService,
  UserService,
  AppService,
];

@Module({
  imports: [graphQLConfiguration, generalConfiguration],
  controllers: [AppController],
  providers: [...resolvers, ...services],
})
export class AppModule {}
