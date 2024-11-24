import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@Body() createCommentDto: CreateCommentDto) {
    return this.commentService.create(createCommentDto);
  }

  @Get()
  findByPost(@Query('postId') postId: string) {
    return this.commentService.findByPost(postId);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: number, @Query('userId') userId: number) {
    return this.commentService.remove(id, userId, true);
  }
}
