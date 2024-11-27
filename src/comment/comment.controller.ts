import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  Query,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentOwnershipGuard } from './guards/commentOwnership.guard';
import { UpdateCommentDto } from './dto/update-comment.dto';

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
  @UseGuards(CommentOwnershipGuard)
  remove(@Param('id') id: number, @Query('userId') userId: number) {
    return this.commentService.remove(id, userId, true);
  }

  @Get(':postId/:id')
  findOne(@Param('postId') postId: string, @Param('id') id: string) {
    return this.commentService.findOne(postId, id);
  }

  @Patch(':postId/:id')
  @UseGuards(CommentOwnershipGuard)
  update(
    @Param('postId') postId: string,
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentService.update(postId, id, updateCommentDto);
  }
}
