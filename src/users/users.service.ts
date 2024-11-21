import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { RoleService } from '../role/role.service';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  constructor(private readonly roleService: RoleService) {}

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const defaultRole = await this.roleService.findRoleByName();

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

  async updateByEmail(
    email: string,
    updateData: Partial<{
      resetToken: string | null;
      resetTokenExpires: Date | null;
      roleId: number;
      password: string;
      isVerified: true;
    }>,
  ) {
    return this.prisma.user.update({
      where: { email },
      data: updateData,
    });
  }
}
