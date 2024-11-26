import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateLikeDto } from './dto/create-like.dto';

@Injectable()
export class LikeService {
  private prisma = new PrismaClient();

  async create(createLikeDto: CreateLikeDto) {
    const { userId, postId } = createLikeDto;

    const existingLike = await this.prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });

    if (existingLike) {
      throw new Error('Like already exists');
    }

    return this.prisma.like.create({
      data: {
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
    });
  }

  async remove(userId: number, postId: number, isAdmin: boolean) {
    const like = await this.prisma.like.findFirst({
      where: {
        userId,
        postId,
      },
    });

    if (!like) throw new Error('Like not found');

    if (like.userId !== userId && !isAdmin) {
      throw new Error('Permission denied');
    }

    return this.prisma.like.deleteMany({
      where: {
        userId,
        postId,
      },
    });
  }
}
