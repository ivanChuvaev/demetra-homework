import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const config = new DocumentBuilder()
    .setTitle('Demetra Homework 1')
    .setDescription('Demetra Homework 1 application API description')
    .setVersion('1.0')
    .addTag('demetra')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  app.use(
    '/api',
    apiReference({
      content: documentFactory,
      persistAuth: true,
    }),
  );

  const port = configService.getOrThrow('PORT');
  await app.listen(port);
}
await bootstrap();
