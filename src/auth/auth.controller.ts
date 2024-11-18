import {
  Controller,
  Post,
  Body,
  Patch,
  BadRequestException,
  Get,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signUp')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Post('signIn')
  async login(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is missing');
    }

    return await this.authService.verifyEmail(token);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.requestPasswordReset(email);
  }

  @Patch('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
