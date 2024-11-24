import {
  Controller,
  Post,
  Body,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  create(@Body() createLikeDto: CreateLikeDto) {
    return this.likeService.create(createLikeDto);
  }

  @Delete()
  @UseGuards(AdminGuard)
  remove(@Query('userId') userId: number, @Query('postId') postId: number) {
    return this.likeService.remove(userId, postId, true);
  }
}
