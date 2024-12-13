import {
  Controller,
  Post,
  Body,
  Patch,
  BadRequestException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { SignInDto } from './dto/signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signUp')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.signUp(createUserDto);
  }

  @Public()
  @Post('signIn')
  async login(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Public()
  @Get('email-confirmation-token/:token')
  async verifyEmail(@Param('token') token: string) {
    if (!token) {
      throw new BadRequestException('Token is missing');
    }

    return await this.authService.verifyEmail(token);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.requestPasswordReset(email);
  }

  @Patch('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('google')
  async googleAuth() {
    return this.authService.googleAuth();
  }

  @Get('google/redirect')
  async googleTokenVerification(@Query('code') code: string) {
    if (!code) {
      throw new BadRequestException('Google authorization code is required');
    }
    return this.authService.googleTokenVerification(code);
  }
}
