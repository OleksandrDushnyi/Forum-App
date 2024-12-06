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
  constructor(private readonly jwtService: JwtService) {}
  private prisma = new PrismaClient();

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
      const postId = parseInt(id);

      if (isNaN(postId)) {
        throw new ForbiddenException('Invalid post ID');
      }

      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new ForbiddenException('Post not found');
      }

      if (roleId === 2 || post.userId === userId) {
        return true;
      }

      throw new ForbiddenException(
        'You can only update or delete your own posts',
      );
    } catch (error) {
      console.error('Error:', error.message);
      throw new ForbiddenException('Access denied');
    }
  }
}
