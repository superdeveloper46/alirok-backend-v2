import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OrderBy {
  email = 'email',
  tax_id = 'tax_id',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class FindAllDto {
  @IsOptional()
  skip?: number;

  @IsOptional()
  take?: number;

  @IsEnum(OrderBy)
  @IsOptional()
  orderBy?: OrderBy;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @IsString()
  @IsOptional()
  term?: string;

  @IsString()
  @IsOptional()
  owner?: string;
}
