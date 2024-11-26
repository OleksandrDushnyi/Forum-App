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

  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;
}
