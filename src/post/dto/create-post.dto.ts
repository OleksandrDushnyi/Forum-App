import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
