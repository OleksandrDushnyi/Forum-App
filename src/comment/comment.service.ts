import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentService {
  private prisma = new PrismaClient();

  async create(createCommentDto: CreateCommentDto) {
    const { userId, postId, content } = createCommentDto;
    return this.prisma.comment.create({
      data: {
        content,
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
    });
  }

  async findByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: { user: true },
    });
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) throw new Error('Comment not found');

    if (comment.userId !== userId && !isAdmin) {
      throw new Error('Permission denied');
    }

    return this.prisma.comment.delete({ where: { id } });
  }
}
