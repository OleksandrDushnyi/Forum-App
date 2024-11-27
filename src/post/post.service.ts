import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UsersService } from 'src/users/users.service';
import { ImgurService } from './imgure.service';

@Injectable()
export class PostService {
  private prisma = new PrismaClient();
  constructor(
    private readonly usersService: UsersService,
    private readonly imgurService: ImgurService,
  ) {}

  async create(createPostDto: CreatePostDto, image?: Express.Multer.File) {
    const { userId, ...data } = createPostDto;

    let imageUrl = null;

    if (image) {
      imageUrl = await this.imgurService.uploadImage(image.buffer);
    } else if (createPostDto.image) {
      imageUrl = createPostDto.image;
    }

    return this.prisma.post.create({
      data: {
        ...data,
        user: { connect: { id: parseInt(userId) } },
        image: imageUrl,
      },
    });
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

    const isAdmin = await this.isAdmin(updatePostDto.userId);
    if (!isAdmin && post.userId !== updatePostDto.userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    let imageUrl = post.image;
    if (updatePostDto.image) {
      imageUrl = updatePostDto.image;
    } else if (image.buffer) {
      imageUrl = await this.imgurService.uploadImage(image.buffer);
    }

    return this.prisma.post.update({
      where: { id: parseInt(id) },
      data: {
        ...updatePostDto,
        image: imageUrl,
      },
    });
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
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    return post;
  }

  async archive(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    return this.prisma.post.update({
      where: { id: parseInt(id) },
      data: { isArchived: true },
    });
  }

  async unarchive(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    return this.prisma.post.update({
      where: { id: parseInt(id) },
      data: { isArchived: false },
    });
  }

  async findAllForAdminOrUser(userId: string) {
    const isAdmin = await this.isAdmin(parseInt(userId));

    return this.prisma.post.findMany({
      where: {
        isArchived: isAdmin ? undefined : false,
        userId: isAdmin ? undefined : parseInt(userId),
      },
      orderBy: [{ title: 'asc' }, { user: { name: 'asc' } }],
      take: 10,
    });
  }

  async remove(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: parseInt(id) },
    });

    if (post.image) {
      const imageDeleteHash = this.imgurService.extractImageDeleteHash(
        post.image,
      );
      await this.imgurService.deleteImage(imageDeleteHash);
    }

    return this.prisma.post.delete({
      where: { id: parseInt(id) },
    });
  }

  private async isAdmin(userId: number): Promise<boolean> {
    const user = await this.usersService.findUserById(userId);
    if (!user || !user.roleId) {
      throw new ForbiddenException('User role not found');
    }
    return user.roleId === 2;
  }
}
