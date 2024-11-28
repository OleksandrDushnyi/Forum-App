import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  Patch,
  Get,
  Query,
  Delete,
  Req,
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

  @Get()
  async findAll(
    @Query('username') username?: string,
    @Query('email') email?: string,
  ) {
    return this.usersService.findAll({ username, email });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findUserById(parseInt(id));
  }

  @Get('profile/:id')
  async findProfile(@Param('id') id: string) {
    return this.usersService.findUserProfile(parseInt(id));
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  async remove(@Param('id') id: string, @Param('userId') userId: string) {
    console.log(id);
    return this.usersService.removeUser(id, userId);
  }
}
