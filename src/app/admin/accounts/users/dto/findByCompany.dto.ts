import { IsEnum, IsNumberString, IsOptional } from 'class-validator';

export enum OrderBy {
  first_name = 'first_name',
  last_name = 'last_name',
  email = 'email',
  account_activate = 'account_activate',
  created_at = 'created_at',
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

export class FindByCompanyDto {
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
