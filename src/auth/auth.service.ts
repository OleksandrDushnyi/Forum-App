import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { SignInDto } from './dto/signin.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RoleService } from '../role/role.service';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(
    private readonly usersService: UsersService,
    private readonly roleService: RoleService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findUserByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await this.usersService.createUser(createUserDto);

    const defaultRole = await this.roleService.findRoleByName();

    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    // Assign default role to user
    await this.usersService.updateByEmail(user.email, {
      roleId: defaultRole.id,
    });

    const verifyToken = this.jwtService.sign({ email: user.email });
    const verifyUrl = `${process.env.LOCALHOST_URL}/auth/verify-email/${verifyToken}`;

    await this.sendVerificationEmail(user.email, verifyUrl);

    return {
      message: 'User registered successfully. Please verify your email.',
    };
  }

  async verifyEmail(token: string) {
    try {
      const decoded = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: { email: decoded.email },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isVerified) {
        return { message: 'Email is already verified' };
      }

      // Verify the user email
      await this.usersService.updateByEmail(user.email, { isVerified: true });

      return { message: 'Email verified successfully' };
    } catch (error) {
      console.error('Verification error:', error);
      throw new Error('Invalid or expired verification token');
    }
  }

  async signIn(loginDto: SignInDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email);

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isVerified) {
      throw new Error('Email is not verified. Please check your inbox.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = this.jwtService.sign({ email: user.email });

    return { message: 'Login successful', token };
  }

  async requestPasswordReset(email: string) {
    const user = await this.usersService.findUserByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = this.jwtService.sign(
      { email: user.email },
      { expiresIn: '1h' },
    );

    // Update user with reset token and expiration time
    await this.usersService.updateByEmail(email, {
      resetToken,
      resetTokenExpires: new Date(Date.now() + 3600 * 1000),
    });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await this.sendResetPasswordEmail(user.email, resetUrl);

    return { message: 'Password reset email sent successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const decoded = this.jwtService.verify(resetPasswordDto.token);
      const user = await this.usersService.findUserByEmail(decoded.email);

      if (!user) {
        throw new Error('User not found');
      }

      if (new Date() > new Date(user.resetTokenExpires)) {
        throw new Error('Reset token has expired');
      }

      if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await this.usersService.updatePassword(
        user.email,
        resetPasswordDto.newPassword,
      );

      // Update reset token
      await this.usersService.updateByEmail(user.email, {
        resetToken: null,
        resetTokenExpires: null,
      });

      return { message: 'Password reset successful' };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  private async sendVerificationEmail(email: string, verifyUrl: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: `${process.env.EMAIL_USER}`,
        pass: `${process.env.EMAIL_PASS}`,
      },
    });

    const mailOptions = {
      from: `${process.env.SENDER}`,
      to: email,
      subject: 'Email Verification',
      text: `Thank you for registering. Please verify your email by clicking the link below:\n\n${verifyUrl}`,
    };

    await transporter.sendMail(mailOptions);
  }

  private async sendResetPasswordEmail(email: string, resetUrl: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: `${process.env.EMAIL_USER}`,
        pass: `${process.env.EMAIL_PASS}`,
      },
    });

    const mailOptions = {
      from: `${process.env.SENDER}`,
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);
  }
}
