import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private prisma = new PrismaClient();

  async findAll() {
    return this.prisma.category.findMany();
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({ data: createCategoryDto });
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
    return { message: 'Update category successfully' };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Delete category successfully' };
  }

  async getPostsByCategory(categoryId: number) {
    return this.prisma.post.findMany({
      where: {
        postCategories: {
          some: { categoryId },
        },
      },
      include: {
        user: true,
      },
    });
  }

  async addCategoryToPost(postId: number, categoryId: number) {
    return this.prisma.postCategory.create({
      data: {
        postId,
        categoryId,
      },
    });
  }

  async removeCategoryFromPost(postId: number, categoryId: number) {
    await this.prisma.postCategory.deleteMany({
      where: {
        postId,
        categoryId,
      },
    });
    return { message: 'Delete category from post successfully' };
  }
}
