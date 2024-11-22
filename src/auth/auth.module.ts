import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { RoleModule } from '../role/role.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtService],
  imports: [
    RoleModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [JwtService],
})
export class AuthModule {}
