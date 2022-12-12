import { IsOptional, IsString } from 'class-validator';

export interface IFindAll {
  search?: string;
  limit?: number;
}

export class FindAllDto {
  @IsOptional()
  limit?: number;

  @IsString()
  @IsOptional()
  search?: string;
}
