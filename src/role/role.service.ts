import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  private prisma = new PrismaClient();

  async findRoleByName() {
    return this.prisma.role.findUnique({ where: { name: 'User' } });
  }

  async createRole(createRoleDto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: createRoleDto.name,
        description: createRoleDto.description,
      },
    });
  }

  async getAllRoles() {
    return this.prisma.role.findMany();
  }
}
