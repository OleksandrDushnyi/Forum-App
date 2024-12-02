import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLikeDto } from './dto/create-like.dto';
import { StatisticsService } from 'src/statistics/statistics.service';

@Injectable()
export class LikeService {
  private prisma = new PrismaClient();

  constructor(private readonly statisticsService: StatisticsService) {}

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

    const like = await this.prisma.like.create({
      data,
    });

    await this.statisticsService.logAction(
      'Create',
      userId,
      'Like',
      like.id,
      like,
    );

    return like;
  }

  async remove(userId: string, ref: string, id: string) {
    const parseUserId = parseInt(userId);

    const like = await this.prisma.like.findFirst({
      where: {
        userId: parseUserId,
        [ref === 'post' ? 'postId' : 'commentId']: parseInt(id),
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
        [ref === 'post' ? 'postId' : 'commentId']: parseInt(id),
      },
    });

    await this.statisticsService.logAction(
      'Delete',
      parseUserId,
      'Like',
      like.id,
      like,
    );

    return { message: 'Like successfully deleted' };
  }
}
