import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();
  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const defaultRole = await this.prisma.role.findUnique({
      where: { name: 'User' },
    });

    if (!defaultRole) {
      throw new Error('Role "User" not found');
    }
    return this.prisma.user.create({
      data: {
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        avatar: createUserDto.avatar,
        roleId: defaultRole.id,
      },
    });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserId: number,
  ) {
    if (id !== currentUserId) {
      throw new Error('You can only update your own profile');
    }

    const updateData = { ...updateUserDto };
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updatePassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  async verifyUserEmail(email: string): Promise<void> {
    await this.prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });
  }

  async updateResetToken(email: string, resetToken: string) {
    return this.prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpires: new Date(Date.now() + 3600 * 1000),
      },
    });
  }

  async assignRoleToUserByEmail(email: string, roleId: number) {
    return this.prisma.user.update({
      where: { email },
      data: { roleId },
    });
  }
}
