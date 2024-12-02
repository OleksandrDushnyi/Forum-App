import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateFollowerDto {
  @IsNumber()
  @IsNotEmpty()
  followerId: number;

  @IsNumber()
  @IsNotEmpty()
  followingId: number;
}
