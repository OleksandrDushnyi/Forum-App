import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { AuthGuard } from './auth/guards/auth.guard';
import { JwtService } from '@nestjs/jwt';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  app.useGlobalGuards(new AuthGuard(jwtService, reflector));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
