import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class AssignUserRoleDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  roleName: string;
}
