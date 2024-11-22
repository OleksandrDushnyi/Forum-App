import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  private prisma = new PrismaClient();

  async create(createPostDto: CreatePostDto) {
    const { userId, ...data } = createPostDto;
    return this.prisma.post.create({
      data: {
        ...data,
        user: { connect: { id: userId } },
        image: data.image || null,
      },
    });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    return this.prisma.post.update({
      where: { id: parseInt(id) },
      data: updatePostDto,
    });
  }

  async findAll(query: { page: number; sort: string; archived?: boolean }) {
    const { page, sort, archived } = query;
    return this.prisma.post.findMany({
      where: { isArchived: archived || false },
      orderBy: [{ [sort]: 'asc' }, { user: { name: 'asc' } }],
      skip: (page - 1) * 10,
      take: 10,
    });
  }

  async findOne(id: string) {
    return this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });
  }

  async archive(id: string) {
    return this.prisma.post.update({
      where: { id: parseInt(id) },
      data: { isArchived: true },
    });
  }

  async remove(id: string) {
    return this.prisma.post.delete({
      where: { id: parseInt(id) },
    });
  }
}
