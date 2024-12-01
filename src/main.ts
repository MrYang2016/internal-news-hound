import * as dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

const env = process.env.NODE_ENV;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors(function (req, callback) {
    callback(null, { origin: '*' });
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Remove non-whitelisted properties
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Automatically transform incoming JSON to DTO objects
  }));

  // swagger
  if (!env || ['development', 'test', 'local'].includes(env)) {
    const options = new DocumentBuilder()
      .setTitle('News Hound API')
      .setDescription('News Hound API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);
  }

  // 添加web文件夹为静态文件夹
  app.useStaticAssets(join(__dirname, '..', 'web'), {
    prefix: '/',
  });

  await app.listen(3004);
}
bootstrap();