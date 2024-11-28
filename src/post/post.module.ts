import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { RoleModule } from 'src/role/role.module';
import { ImgurService } from './imgure.service';

@Module({
  controllers: [PostController],
  providers: [PostService, AdminGuard, JwtService, ImgurService],
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
    RoleModule,
  ],
})
export class PostModule {}
