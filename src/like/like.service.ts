import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikeService {
  private prisma = new PrismaClient();

  async create(createLikeDto: CreateLikeDto, ref: string, id: string) {
    const { userId } = createLikeDto;

    const existingLike = await this.prisma.like.findFirst({
      where: {
        userId,
        [ref === 'post' ? 'postId' : 'commentId']: parseInt(id),
      },
    });

    if (existingLike) {
      throw new BadRequestException(
        'Like already exists for this post/comment',
      );
    }

    const data: any = {
      user: { connect: { id: userId } },
    };

    if (ref === 'post') {
      data.post = { connect: { id: parseInt(id) } };
    } else if (ref === 'comment') {
      data.comment = { connect: { id: parseInt(id) } };
    } else {
      throw new BadRequestException(
        'Invalid reference type. Must be "post" or "comment".',
      );
    }

    return this.prisma.like.create({
      data,
    });
  }

  async remove(userId: string, ref: string, id: string) {
    const parseUserId = parseInt(userId);
    const like = await this.prisma.like.findFirst({
      where: {
        userId: parseUserId,
        [ref === 'post' ? 'postId' : 'commentId']: id,
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found for this post/comment');
    }

    if (like.userId !== parseUserId) {
      throw new ForbiddenException(
        'You do not have permission to delete this like',
      );
    }

    await this.prisma.like.deleteMany({
      where: {
        userId: parseUserId,
        [ref === 'post' ? 'postId' : 'commentId']: id,
      },
    });

    return { message: 'Like successfully deleted' };
  }
}
