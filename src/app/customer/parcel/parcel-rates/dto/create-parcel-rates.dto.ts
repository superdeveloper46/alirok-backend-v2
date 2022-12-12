import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
  Min,
} from 'class-validator';

export enum RulesType {
  MINIMUM = 'MINIMUM',
  MAXIMUM = 'MAXIMUM',
}

export enum LengthMeasure {
  IN = 'IN',
  CM = 'CM',
}

export enum WeightMeasure {
  KG = 'KG',
  LB = 'LB',
}

export enum Coin {
  USD = 'USD',
}

class ParcelRouteRulesDto {
  @IsEnum(RulesType)
  type: RulesType;

  // @IsUUID()
  // parcel_rate_uuid: string;

  @IsUUID()
  parcel_route_uuid: string;

  @IsInt()
  pieces: number;

  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsEnum(LengthMeasure)
  length_measure: LengthMeasure;

  @IsNumber()
  weight: number;

  @IsEnum(WeightMeasure)
  weight_measure: WeightMeasure;

  @IsNumber()
  value: number;

  coin: string;
}

class ParcelRatesAutoWeightBreakDto {
  @IsNumber()
  weight: number;

  @IsEnum(WeightMeasure)
  weight_measure: WeightMeasure;

  @IsNumber()
  value: number;

  coin: string;

  @IsNumber()
  max_weight: number;

  @IsEnum(WeightMeasure)
  max_weight_measure: WeightMeasure;
}

class ParcelRateCustomFieldColumnsDto {
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsUUID()
  parcel_rate_custom_field_uuid: string;
}

class ParcelRateParcelRateCustomFieldsDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  value?: string;

  @IsUUID()
  parcel_rate_custom_field_uuid: string;
}

class ParcelRateDto {
  @IsUUID()
  rate_type_uuid: string;

  @IsOptional()
  @IsNumber()
  minimum?: number;

  @IsOptional()
  @IsNumber()
  transit_time_from?: number;

  @IsOptional()
  @IsNumber()
  transit_time_to?: number;

  @IsOptional()
  @IsNumber()
  maximum_weight?: number;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsNumber()
  profit?: number;

  @IsOptional()
  @IsString()
  profit_type?: string;

  @IsOptional()
  @IsNumber()
  minimum_profit?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ParcelRatesAutoWeightBreakDto)
  parcel_rates_auto_weight_break?: ParcelRatesAutoWeightBreakDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ParcelRouteRulesDto)
  parcel_route_rules?: ParcelRouteRulesDto;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ParcelRateParcelRateCustomFieldsDto)
  parcel_rate_parcel_rate_custom_fields: ParcelRateParcelRateCustomFieldsDto[];
}

export class CreateParcelRatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ParcelRateDto)
  parcel_rates: ParcelRateDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => ParcelRateCustomFieldColumnsDto)
  custom_field_columns: ParcelRateCustomFieldColumnsDto[];

  @IsUUID()
  company_uuid?: string;

  @IsUUID()
  parcel_route_uuid: string;
}

export class FindDropOffLocationDTO {
  company_uuid?: string;
}
