import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LikeOwnershipGuard implements CanActivate {
  private prisma = new PrismaClient();

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('Access denied');
    }

    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = decoded.userId;
      const roleId = decoded.roleId;

      const { id } = request.params;

      const like = await this.prisma.like.findUnique({
        where: { id: parseInt(id) },
      });

      if (!like) {
        throw new ForbiddenException('Like not found');
      }

      if (roleId === 2 || like.userId === userId) {
        return true;
      }

      throw new ForbiddenException(`You can't delete this like`);
    } catch (error) {
      throw new ForbiddenException('Access denied');
    }
  }
}
