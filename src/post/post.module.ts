import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { AuthModule } from '../auth/auth.module';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';
import { RoleModule } from 'src/role/role.module';

@Module({
  controllers: [PostController],
  providers: [PostService, AdminGuard, JwtService],
  imports: [
    AuthModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
    RoleModule,
  ],
})
export class PostModule {}
