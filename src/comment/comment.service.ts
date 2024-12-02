import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { StatisticsService } from 'src/statistics/statistics.service';

@Injectable()
export class CommentService {
  private prisma = new PrismaClient();
  constructor(private readonly statisticsService: StatisticsService) {}

  async create(createCommentDto: CreateCommentDto) {
    const { userId, postId, content } = createCommentDto;

    const comment = await this.prisma.comment.create({
      data: {
        content,
        user: { connect: { id: userId } },
        post: { connect: { id: postId } },
      },
    });

    await this.statisticsService.logAction(
      'Create',
      userId,
      'Comment',
      comment.id,
      comment,
    );

    return comment;
  }

  async findByPost(postId: string) {
    const comments = await this.prisma.comment.findMany({
      where: { postId: parseInt(postId) },
      include: { user: true },
    });

    await this.statisticsService.logAction(
      'Retrieve',
      null,
      'Post',
      parseInt(postId),
      { comments },
    );

    return comments;
  }

  async findOne(postId: string, id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: parseInt(id) },
      include: { user: true },
    });

    if (!comment || comment.postId !== parseInt(postId)) {
      throw new NotFoundException('Comment not found');
    }

    await this.statisticsService.logAction(
      'Retrieve',
      null,
      'Comment',
      comment.id,
      comment,
    );

    return comment;
  }

  async update(postId: string, id: string, updateCommentDto: UpdateCommentDto) {
    const { content } = updateCommentDto;

    const comment = await this.prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!comment || comment.postId !== parseInt(postId)) {
      throw new NotFoundException('Comment not found');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id: comment.id },
      data: { content },
    });

    await this.statisticsService.logAction(
      'Update',
      updatedComment.userId,
      'Comment',
      updatedComment.id,
      updatedComment,
    );

    return updatedComment;
  }

  async remove(id: number, userId: number, isAdmin: boolean) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) throw new Error('Comment not found');

    if (comment.userId !== userId && !isAdmin) {
      throw new Error('Permission denied');
    }

    const deletedComment = await this.prisma.comment.delete({ where: { id } });

    await this.statisticsService.logAction(
      'Delete',
      userId,
      'Comment',
      deletedComment.id,
      deletedComment,
    );

    return deletedComment;
  }
}
