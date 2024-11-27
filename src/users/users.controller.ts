import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Patch(':id/upload-avatar')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @Param('id') userId: string,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, avatar);
  }
}
