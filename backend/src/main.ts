import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {bodyParser: false });
  
  app.setGlobalPrefix('api');

  app.use(require('express').json({ limit: '10mb'}));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));
  
  // cho phép tất cả localhost port
  app.enableCors({
    origin: [
      'http://localhost:3002',
      'https://chillwithmusic.vercel.app',
    ],
    credentials: true,
  });

  await app.listen(3001);
}
bootstrap();