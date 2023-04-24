import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { WorkspaceResolver, WorkspaceService } from './modules';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

const graphQLConfiguration = GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
  sortSchema: true,
});

const generalConfiguration = ConfigModule.forRoot({
  envFilePath: '.env',
});

@Module({
  imports: [graphQLConfiguration, generalConfiguration],
  controllers: [AppController],
  providers: [WorkspaceResolver, WorkspaceService, AppService],
})
export class AppModule {}
