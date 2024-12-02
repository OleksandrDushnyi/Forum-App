import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RoleModule } from './role/role.module';
import { PostModule } from './post/post.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { CategoriesModule } from './categories/categories.module';
import { FollowersModule } from './followers/followers.module';

@Module({
  imports: [UsersModule, AuthModule, RoleModule, PostModule, LikeModule, CommentModule, CategoriesModule, FollowersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
