import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { WorkspaceResolver, WorkspaceService } from './workspace';
import { FirebaseService } from './firebase/firebase.service';
import { ConfigModule } from '@nestjs/config';

const graphQLConfiguration = GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: true,
});

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

@Module({
  imports: [graphQLConfiguration, generalConfiguration],
  controllers: [AppController],
  providers: [WorkspaceResolver, WorkspaceService, AppService, FirebaseService],
})
export class AppModule {}
