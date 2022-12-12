import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  IsPositive,
} from 'class-validator';

export class FindAllDimensionsDTO {
  @IsOptional()
  @IsString()
  search?: string;
}

export class FindAllCommonDimensionsDTO {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID(4)
  user_company_uuid?: string;
}

export class CreateDimensionsDTO {
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  value?: number;

  @IsOptional()
  @IsString()
  @IsUUID(4)
  user_company_uuid?: string;
}

export class UpdateDimensionsDTO extends CreateDimensionsDTO {
  @IsOptional()
  @IsString()
  @IsUUID(4)
  dimensional_factor_uuid?: string;
}

export class DeleteDimensionsDTO {
  @IsOptional()
  @IsString()
  @IsUUID(4)
  dimensional_factor_uuid?: string;

  @IsOptional()
  @IsString()
  @IsUUID(4)
  user_company_uuid?: string;
}
