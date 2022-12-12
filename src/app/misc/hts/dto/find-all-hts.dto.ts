import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export enum OrderBy {
  htsno = 'htsno',
  description = 'description',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class FindAllHtsDto {
  @IsString()
  @IsOptional()
  term?: string;

  @IsNumberString()
  @IsOptional()
  skip?: number;

  @IsNumberString()
  @IsOptional()
  take?: number;

  @IsEnum(OrderBy)
  @IsOptional()
  orderBy?: OrderBy;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;
}
