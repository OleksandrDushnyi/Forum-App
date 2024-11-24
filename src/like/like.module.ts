import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { AuthModule } from '../auth/auth.module';
import { CommentModule } from '../comment/comment.module';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  controllers: [LikeController],
  providers: [LikeService, AdminGuard, JwtService],
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class LikeModule {}
