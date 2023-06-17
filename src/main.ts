import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { AppModule } from './app.module';
import { MAX_FILE_SIZE } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use('/graphql', graphqlUploadExpress({ maxFileSize: MAX_FILE_SIZE }));

  const port = process.env.SERVER_PORT;
  await app.listen(port);
  console.log('Server is running on port: ', port);
}
bootstrap();
