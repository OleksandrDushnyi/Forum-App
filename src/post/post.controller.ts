import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
    return this.postService.update(id, updatePostDto);
  }

  @Get()
  findAll(@Query() query: { page: number; sort: string; archived?: boolean }) {
    return this.postService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Patch(':id/archive')
  @UseGuards(AdminGuard)
  archive(@Param('id') id: string) {
    return this.postService.archive(id);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
