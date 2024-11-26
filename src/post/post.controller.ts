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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostOwnershipGuard } from './guards/postOwnership.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.postService.create(createPostDto, image);
  }

  @Patch(':id')
  @UseGuards(PostOwnershipGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.postService.update(id, updatePostDto, image);
  }

  @Get()
  findAll(
    @Query()
    query: {
      page?: number;
      sort?: string;
      archived?: string;
      userId: string;
    },
  ) {
    console.log(query.archived);
    return this.postService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postService.findOne(id);
  }

  @Patch(':id/archive')
  @UseGuards(PostOwnershipGuard)
  archive(@Param('id') id: string) {
    return this.postService.archive(id);
  }

  @Patch(':id/unarchive')
  @UseGuards(PostOwnershipGuard)
  unarchive(@Param('id') id: string) {
    return this.postService.unarchive(id);
  }

  @Get('all/:userId')
  findAllForAdminOrUser(@Param('userId') userId: string) {
    return this.postService.findAllForAdminOrUser(userId);
  }

  @Delete(':id')
  @UseGuards(PostOwnershipGuard)
  remove(@Param('id') id: string) {
    return this.postService.remove(id);
  }
}
