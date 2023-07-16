import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';

import { AppModule } from './app.module';
import { MAX_FILE_SIZE } from './config';
import { isEnv } from './utils';

const CHROME_EXTENSION_ID = 'lmofhhaibahhojhinmpgmifdmennlcjn';
const EXTENSION_URL = `chrome-extension://${CHROME_EXTENSION_ID}`;

async function bootstrap() {
  const generalLogLevels: LogLevel[] = ['log', 'error'];
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_DEBUG === 'true' ? ['debug', ...generalLogLevels] : generalLogLevels,
  });

  app.enableCors({
    origin: isEnv('DEVELOPMENT') ? '*' : ['https://app.tabhub.io', EXTENSION_URL],
  });
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use('/graphql', graphqlUploadExpress({ maxFileSize: MAX_FILE_SIZE }));

  const port = process.env.SERVER_PORT;
  await app.listen(port);
  console.log(`DEBUG: ${process.env.NODE_DEBUG}`);
  console.log(`ENV: ${process.env.NODE_ENV}`);
  console.log('Server is running on port: ', port);
}
bootstrap();
