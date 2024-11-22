import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { RoleModule } from '../role/role.module';
import { AdminGuard } from '../auth/guards/admin.guard';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AdminGuard],
  exports: [UsersService],
  imports: [
    RoleModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class UsersModule {}
