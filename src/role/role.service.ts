import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class RoleService {
  private prisma = new PrismaClient();

  async findRoleByName() {
    return this.prisma.role.findUnique({ where: { name: 'User' } });
  }
}
