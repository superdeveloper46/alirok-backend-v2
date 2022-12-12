import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';

export enum OrderBy {
  first_name = 'first_name',
  last_name = 'last_name',
  email = 'email',
  tax_id = 'tax_id',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class FindAllDto {
  // @IsNumberString()
  @IsOptional()
  skip?: number;

  // @IsNumberString()
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
}

export class FindUniqueDto {
  @IsString()
  uuid: string;
}
