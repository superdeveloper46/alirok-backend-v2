import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsBoolean,
  IsEnum,
  IsArray,
  ArrayMinSize,
  IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RateShipmentPackagesItemCommotidyValueFootnotesDTO {
  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsArray()
  columns?: string[];

  @IsOptional()
  @IsString()
  type?: string;
}

export class RateShipmentPackagesItemCommotidyValueDTO {
  @IsOptional()
  @IsString()
  other?: string;

  @IsOptional()
  @IsString()
  superior?: string;

  @IsOptional()
  @IsString()
  indent?: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  statisticalSuffix?: string;

  @IsOptional()
  @IsString()
  score?: string;

  @IsOptional()
  @IsString()
  special?: string;

  @IsNotEmpty()
  @IsString()
  htsno: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => RateShipmentPackagesItemCommotidyValueFootnotesDTO)
  footnotes?: RateShipmentPackagesItemCommotidyValueFootnotesDTO;

  @IsOptional()
  @IsString()
  general?: string;

  @IsOptional()
  @IsArray()
  units?: string[];
}

export class RateShipmentPackagesItemCommotidyDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentPackagesItemCommotidyValueDTO)
  value: RateShipmentPackagesItemCommotidyValueDTO;

  @IsOptional()
  @IsString()
  label?: string;
}

export class RateShipmentPackagesItemDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentPackagesItemCommotidyDTO)
  commodity: RateShipmentPackagesItemCommotidyDTO;

  @IsOptional()
  @IsString()
  unit_price?: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

export class RateShipmentPackagesContainsDTO {
  @IsBoolean()
  battery: boolean;

  @IsBoolean()
  perfume: boolean;
}

export class RateShipmentPackagesDTO {
  @IsNotEmpty()
  @IsNumberString()
  weight: string;

  @IsNotEmpty()
  @IsNumberString()
  width: string;

  @IsNotEmpty()
  @IsNumberString()
  height: string;

  @IsNotEmpty()
  @IsNumberString()
  length: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => RateShipmentPackagesItemDTO)
  items: RateShipmentPackagesItemDTO[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentPackagesContainsDTO)
  contains: RateShipmentPackagesContainsDTO;
}

export class RateShipmentPackageMetaCurrencyDTO {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  symbol: string;
}

export class RateShipmentPackageMetaDTO {
  @IsNotEmpty()
  @IsEnum(['box', 'envelope'])
  type: 'box' | 'envelope';

  @IsNotEmpty()
  @IsNumber()
  package_quantity: number;

  @IsNotEmpty()
  @IsNumber()
  weight_total: number;

  @IsNotEmpty()
  @IsEnum(['KGS', 'LBS'])
  weight_unit: 'KGS' | 'LBS';

  @IsNotEmpty()
  @IsEnum(['CM', 'IN'])
  measure_unit: 'CM' | 'IN';

  @IsNotEmpty()
  @IsNumber()
  cargo_value: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentPackageMetaCurrencyDTO)
  currency: RateShipmentPackageMetaCurrencyDTO;

  @IsBoolean()
  has_perfume: boolean;

  @IsBoolean()
  has_battery: boolean;
}

export class RateShipmentDestinationDTO {
  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  street_number: string;

  @IsBoolean()
  @IsOptional()
  is_residential_address: boolean;

  @IsOptional()
  @IsString()
  complement_address?: string;
}

export class RateShipmentOriginDTO {
  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  street_number: string;

  @IsBoolean()
  @IsOptional()
  is_residential_address: boolean;

  @IsOptional()
  @IsString()
  complement_address?: string;
}

export class RateShipmentDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentOriginDTO)
  origin: RateShipmentOriginDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentDestinationDTO)
  destination: RateShipmentDestinationDTO;

  @IsNotEmpty()
  @IsString()
  ship_date: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentPackagesDTO)
  packages: RateShipmentPackagesDTO[];

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RateShipmentPackageMetaDTO)
  packages_meta: RateShipmentPackageMetaDTO;
}

export class RateShipmentReturnCompanyDTO {
  logo: string;
  legal_name: string;
  fantasy_name: string;
}

export class RateShipmentReturnCarrierDTO {
  logo: string;
  legal_name: string;
  fantasy_name: string;
}

export class RateShipmentReturnDeliveryDTO {
  days_in_transit: number;
  time: string;
  date: string;
  day_of_week: string;
}

export class RateShipmentReturnDTO {
  company: RateShipmentReturnCompanyDTO;
  carrier: RateShipmentReturnCarrierDTO;
  service_code: string;
  rate_type: string;
  price: number;
  delivery: RateShipmentReturnDeliveryDTO;
  duties: any;
  integration_object?: any;
}

export class FindDropoffsDTO {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  postal_code: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsBoolean()
  @IsOptional()
  is_residential_address: boolean;

  @IsOptional()
  @IsString()
  street_number?: string;
}

export class FindDropoffsReturnAddressDTO {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export class FindDropoffsReturnDTO {
  company_name: string;
  phone_number: string;
  address: FindDropoffsReturnAddressDTO;
}
