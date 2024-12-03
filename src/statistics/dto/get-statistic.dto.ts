// import {
//   IsArray,
//   IsDateString,
//   IsEnum,
//   IsInt,
//   IsOptional,
//   IsString,
//   ValidateIf,
// } from 'class-validator';

// export class GetStatisticsDto {
//   @IsOptional()
//   @IsInt()
//   userId?: number;

//   @IsOptional()
//   @IsDateString()
//   startDate?: string;

//   @IsOptional()
//   @IsDateString()
//   endDate?: string;

//   @IsOptional()
//   @IsArray()
//   @IsString({ each: true })
//   entityTypes?: string[];

//   @IsOptional()
//   @IsEnum(['daily', 'weekly', 'monthly', 'total'])
//   interval?: 'daily' | 'weekly' | 'monthly' | 'total';
// }
