import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PostOwnershipGuard implements CanActivate {
  private prisma = new PrismaClient();

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('Access denied');
    }

    try {
      const decoded = this.jwtService.verify(token);
      const userId = decoded.userId;
      const roleId = decoded.roleId;

      const { id } = request.params;

      const post = await this.prisma.post.findUnique({
        where: { id: parseInt(id) },
      });

      if (!post) {
        throw new ForbiddenException('Post not found');
      }

      if (roleId === 2 || post.userId === userId) {
        return true;
      }

      throw new ForbiddenException('You can only update your own posts');
    } catch (error) {
      throw new ForbiddenException('Access denied');
    }
  }
}
