import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { RoleService } from '../role/role.service';
import { ImgurService } from './imgure.service';

@Injectable()
export class UsersService {
  private prisma = new PrismaClient();

  constructor(
    private readonly roleService: RoleService,
    private readonly imgurService: ImgurService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const defaultRole = await this.roleService.findRoleByName();

    if (!defaultRole) {
      throw new InternalServerErrorException('Role "User" not found');
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

  async uploadAvatar(userId: string, avatar: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(userId) },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.avatar) {
      const imageDeleteHash = this.imgurService.extractImageDeleteHash(
        user.avatar,
      );
      await this.imgurService.deleteImage(imageDeleteHash);
    }

    const avatarUrl = await this.imgurService.uploadImage(avatar.buffer);

    return this.prisma.user.update({
      where: { id: parseInt(userId) },
      data: { avatar: avatarUrl },
    });
  }

  async updateUser(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUserId: number,
    avatar?: Express.Multer.File,
  ) {
    if (id !== currentUserId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const updateData: any = { ...updateUserDto };

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    if (avatar) {
      if (user.avatar) {
        const imageDeleteHash = this.imgurService.extractImageDeleteHash(
          user.avatar,
        );
        await this.imgurService.deleteImage(imageDeleteHash);
      }

      const avatarUrl = await this.imgurService.uploadImage(avatar.buffer);
      updateData.avatar = avatarUrl;
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

  async findUserById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
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

  async findAll(filters: { username?: string; email?: string }) {
    const where: any = {};
    if (filters.username) {
      where.name = { contains: filters.username };
    }
    if (filters.email) {
      where.email = { contains: filters.email };
    }

    return this.prisma.user.findMany({ where });
  }

  async removeUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    const parseId = parseInt(id);

    if (user.roleId !== 2 && parseId !== user.id) {
      throw new ForbiddenException('You can only delete your own account');
    }

    if (user.roleId === 2 && user.roleId !== 2) {
      throw new ForbiddenException('Admins cannot delete other admin accounts');
    }

    await this.prisma.user.delete({ where: { id: parseInt(id) } });
    return { message: 'User deleted successfully' };
  }

  async findUserProfile(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user;
  }
}
