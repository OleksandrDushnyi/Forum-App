import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from 'src/users/users.service';
import { ImgurService } from './imgure.service';
import { StatisticsService } from 'src/statistics/statistics.service';

@Injectable()
export class PostService {
  private prisma = new PrismaClient();

  constructor(
    private readonly usersService: UsersService,
    private readonly imgurService: ImgurService,
    private readonly statisticsService: StatisticsService,
  ) {}

  async create(createPostDto: CreatePostDto, image?: Express.Multer.File) {
    const { userId, ...data } = createPostDto;
    let imageUrl = null;

    if (image) {
      imageUrl = await this.imgurService.uploadImage(image.buffer);
    } else if (createPostDto.image) {
      imageUrl = createPostDto.image;
    }

    const post = await this.prisma.post.create({
      data: {
        ...data,
        user: { connect: { id: parseInt(userId) } },
        image: imageUrl,
      },
    });

    await this.statisticsService.logAction(
      'Create',
      parseInt(userId),
      'Post',
      post.id,
      post,
    );

    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    image?: Express.Multer.File,
  ) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    let imageUrl = post.image;
    if (updatePostDto.image) {
      imageUrl = updatePostDto.image;
    } else if (image.buffer) {
      imageUrl = await this.imgurService.uploadImage(image.buffer);
    }

    const updatedPost = await this.prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        ...updatePostDto,
        image: imageUrl,
      },
    });

    await this.statisticsService.logAction(
      'Update',
      updatePostDto.userId,
      'Post',
      post.id,
      updatedPost,
    );

    return updatedPost;
  }

  async findAll(query: {
    page?: number;
    sort?: string;
    archived?: string;
    userId: string;
  }) {
    const { page = 1, sort = 'title', archived, userId } = query;

    const archivedBoolean =
      archived === 'true' ? true : archived === 'false' ? false : undefined;

    const isAdmin = await this.isAdmin(parseInt(userId));

    return this.prisma.post.findMany({
      where: {
        isArchived:
          archivedBoolean !== undefined
            ? archivedBoolean
            : isAdmin
              ? false
              : undefined,
        OR: isAdmin ? undefined : [{ userId: parseInt(userId) }],
      },
      orderBy: [{ [sort]: 'asc' }, { user: { name: 'asc' } }],
      skip: (page - 1) * 10,
      take: 10,
      include: {
        postCategories: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
      include: {
        postCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    await this.statisticsService.logAction(
      'Retrieve',
      null,
      'Post',
      post.id,
      post,
    );

    return post;
  }

  async archive(id: string) {
    const post = await this.prisma.post.update({
      where: { id: parseInt(id) },
      data: { isArchived: true },
    });

    await this.statisticsService.logAction(
      'Archive',
      post.userId,
      'Post',
      post.id,
      post,
    );

    return post;
  }

  async unarchive(id: string) {
    const post = await this.prisma.post.update({
      where: { id: parseInt(id) },
      data: { isArchived: false },
    });

    await this.statisticsService.logAction(
      'Unarchive',
      post.userId,
      'Post',
      post.id,
      post,
    );

    return post;
  }

  async findAllForAdminOrUser(userId: string) {
    const isAdmin = await this.isAdmin(parseInt(userId));

    return this.prisma.post.findMany({
      where: {
        isArchived: isAdmin ? undefined : false,
        userId: isAdmin ? undefined : parseInt(userId),
      },
      include: {
        postCategories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ title: 'asc' }, { user: { name: 'asc' } }],
      take: 10,
    });
  }

  async remove(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    if (post.image) {
      const imageDeleteHash = this.imgurService.extractImageDeleteHash(
        post.image,
      );
      await this.imgurService.deleteImage(imageDeleteHash);
    }

    await this.prisma.post.delete({
      where: { id: parseInt(id) },
    });

    await this.statisticsService.logAction(
      'Delete',
      post.userId,
      'Post',
      post.id,
      post,
    );

    return { message: 'Post deleted successfully' };
  }

  private async isAdmin(userId: number): Promise<boolean> {
    const user = await this.usersService.findUserById(userId);
    if (!user || !user.roleId) {
      throw new ForbiddenException('User role not found');
    }
    return user.roleId === 2;
  }
}
