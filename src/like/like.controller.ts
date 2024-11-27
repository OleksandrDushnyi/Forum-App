import {
  Controller,
  Post,
  Body,
  Delete,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { LikeOwnershipGuard } from './guards/likeOwnership.guard';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post(':ref/:id')
  create(
    @Body() createLikeDto: CreateLikeDto,
    @Param('ref') ref: string,
    @Param('id') id: string,
  ) {
    return this.likeService.create(createLikeDto, ref, id);
  }

  @Delete(':ref/:id')
  @UseGuards(LikeOwnershipGuard)
  remove(
    @Param('ref') ref: string,
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.likeService.remove(userId, ref, id);
  }
}
