import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ToBoolean } from '../../../../../common/pipe/toBoolean.pipe';
import { ToDate } from '../../../../../common/pipe/toDate.pipe';

export class UpsertParcelRouteDto {
  @IsOptional()
  @IsUUID()
  company_uuid?: string;

  @IsOptional()
  @IsUUID()
  parcel_route_uuid?: string;

  @IsOptional()
  @IsUUID()
  carrier_company_uuid?: string;

  @IsOptional()
  @IsUUID()
  carrier_unregistered_company_uuid?: string;

  @IsOptional()
  @IsUUID()
  destination_coverage_uuid?: string;

  @IsOptional()
  @IsUUID()
  origin_coverage_uuid?: string;

  @IsOptional()
  @IsUUID()
  vendor_company_uuid?: string;

  @IsOptional()
  // @IsNumberString()
  transit_time_to?: number;

  @IsOptional()
  // @IsNumberString()
  transit_time_from?: number;

  @IsOptional()
  @IsUUID()
  parcel_mass_measure_uuid?: string;

  @IsOptional()
  @IsUUID()
  currency_uuid?: string;

  @IsOptional()
  @IsString()
  restrictions?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  dimensional_factor_uuid?: string;

  @IsOptional()
  @IsNumber()
  currency_rate?: number;

  @IsOptional()
  @IsString()
  currency_rate_meta?: string;

  @IsOptional()
  @IsString()
  length_measure_uuid?: string;

  @IsOptional()
  @ToBoolean()
  published?: boolean;

  @IsOptional()
  @ToBoolean()
  public?: boolean;

  @ToDate()
  effective_on?: string;

  @ToDate()
  expires_on?: string;

  @IsOptional()
  @IsString()
  action_type?: string;

  @IsOptional()
  @IsString()
  insurance_fee_type?: string;

  @IsOptional()
  @IsNumber()
  insurance_fee_percentage?: number;

  @IsOptional()
  @IsNumber()
  insurance_fee_minimum?: number;

  @IsOptional()
  @IsString()
  duties_taxes_type?: string;

  @IsOptional()
  @IsNumber()
  duties_taxes_percentage?: number;

  @IsOptional()
  @IsNumber()
  duties_taxes_exemption?: number;

  @IsOptional()
  @IsBoolean()
  duties_taxes_ddp?: boolean;

  @IsOptional()
  @IsString()
  signature_description?: string;

  @IsOptional()
  @IsNumber()
  signature_service_fee?: number;
}
