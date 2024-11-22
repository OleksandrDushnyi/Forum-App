import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  controllers: [PostController],
  providers: [PostService, AdminGuard],
  imports: [AuthModule],
})
export class PostModule {}
