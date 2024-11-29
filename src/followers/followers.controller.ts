import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { FollowersService } from './followers.service';
import { CreateFollowerDto } from './dto/create-follower.dto';

@Controller('followers')
export class FollowersController {
  constructor(private readonly followersService: FollowersService) {}

  @Post('/following')
  async follow(@Body() createFollowerDto: CreateFollowerDto) {
    return this.followersService.followUser(
      createFollowerDto.followerId,
      createFollowerDto.followingId,
    );
  }

  @Delete('/following')
  async unfollow(@Body() createFollowerDto: CreateFollowerDto) {
    return this.followersService.unfollowUser(
      createFollowerDto.followerId,
      createFollowerDto.followingId,
    );
  }

  @Get('/followers/:userId')
  async getFollowers(@Param('userId') userId: string) {
    return this.followersService.getFollowers(+userId);
  }

  @Get('/following/:userId')
  async getFollowing(@Param('userId') userId: string) {
    return this.followersService.getFollowing(+userId);
  }
}
