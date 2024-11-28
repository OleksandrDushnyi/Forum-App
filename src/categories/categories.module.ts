import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, JwtService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class CategoriesModule {}
