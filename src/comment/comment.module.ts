import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AuthModule } from '../auth/auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { StatisticsModule } from 'src/statistics/statistics.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService, AdminGuard, JwtService],
  imports: [
    AuthModule,
    StatisticsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class CommentModule {}
