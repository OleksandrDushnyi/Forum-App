import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoriesGuard } from './guards/categories.guard';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Post()
  @UseGuards(CategoriesGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Patch(':id')
  @UseGuards(CategoriesGuard)
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(CategoriesGuard)
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }

  @Get(':id/posts')
  async getPostsByCategory(@Param('id') categoryId: string) {
    return this.categoriesService.getPostsByCategory(+categoryId);
  }

  @Post('/posts/:postId/categories/:categoryId')
  async addCategoryToPost(
    @Param('postId') postId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.addCategoryToPost(+postId, +categoryId);
  }

  @Delete('/posts/:postId/categories/:categoryId')
  async removeCategoryFromPost(
    @Param('postId') postId: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.categoriesService.removeCategoryFromPost(+postId, +categoryId);
  }
}
