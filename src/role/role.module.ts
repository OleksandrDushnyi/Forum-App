import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { JwtModule, JwtService } from '@nestjs/jwt';

@Module({
  controllers: [RoleController],
  providers: [RoleService, JwtService],
  exports: [RoleService],
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
  ],
})
export class RoleModule {}
