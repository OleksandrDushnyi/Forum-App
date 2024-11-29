import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class FollowersService {
  private prisma = new PrismaClient();
  async followUser(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const followExists = await this.prisma.follower.findFirst({
      where: { followerId, followingId },
    });

    if (followExists) {
      throw new BadRequestException('You are already following this user');
    }

    await this.prisma.follower.create({
      data: { followerId, followingId },
    });

    return {
      message: `User with ID ${followerId} started following User with ID ${followingId} successfully!`,
    };
  }

  async unfollowUser(followerId: number, followingId: number) {
    const followExists = await this.prisma.follower.findFirst({
      where: { followerId, followingId },
    });

    if (!followExists) {
      throw new BadRequestException('You are not following this user');
    }

    await this.prisma.follower.delete({
      where: { id: followExists.id },
    });

    return {
      message: `User with ID ${followerId} started unfollowing User with ID ${followingId} successfully!`,
    };
  }

  async getFollowers(userId: number) {
    return this.prisma.follower.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });
  }

  async getFollowing(userId: number) {
    return this.prisma.follower.findMany({
      where: { followerId: userId },
      include: { following: true },
    });
  }
}
