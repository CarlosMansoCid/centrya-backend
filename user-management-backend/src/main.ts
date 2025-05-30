import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Optional: automatically transform payloads to DTO instances
      // transformOptions: { enableImplicitConversion: true }, // Optional: if you want implicit conversion
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
