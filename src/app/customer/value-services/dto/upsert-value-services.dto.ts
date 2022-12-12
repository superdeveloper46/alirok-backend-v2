import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ToBoolean } from '../../../../common/pipe/toBoolean.pipe';
import { ToDate } from '../../../../common/pipe/toDate.pipe';

export enum ConditionRate {
  IS = 'IS',
  NOT = 'IS_NOT',
}

export enum RateType {
  POSTAL = 'POSTAL',
  ECONOMY = 'ECONOMY',
  EXPRESS = 'EXPRESS',
}

export enum ConditionParcel {
  IS = 'IS',
  NOT = 'IS_NOT',
}

export enum ParcelType {
  DOCUMENTS = 'DOCUMENTS',
  PACKAGE = 'PACKAGE',
}

export enum ConditionUser {
  IS = 'IS',
  NOT = 'IS_NOT',
}

export enum UserType {
  INDIVIDUAL = 'INDIVIDUAL',
  CORPORATION = 'CORPORATION',
}

export enum AddressType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
}

export enum ConditionAddress {
  IS = 'IS',
  NOT = 'IS_NOT',
}

export enum ConditionCif {
  IS_MORE_THAN = 'IS_MORE_THAN',
  IS_LESS_THAN = 'IS_LESS_THAN',
}

export enum Preposition {
  WHEN = 'WHEN',
  AND = 'AND',
  OR = 'OR',
}

export enum MinimumPer {
  SHIPMENT = 'SHIPMENT',
  PACKAGE = 'PACKAGE',
}

export enum Rule {
  MANDATORY = 'MANDATORY',
  OPTIONAL_SERVICE = 'OPTIONAL_SERVICE',
  NOT_VISIBLE = 'NOT_VISIBLE',
}

export enum ApplicableTo {
  CARGO_VALUE = 'CARGO_VALUE',
  GROSS_WEIGHT = 'GROSS_WEIGHT',
  CIF_VALUE = 'CIF_VALUE',
  RESIDENTIAL = 'RESIDENTIAL',
}

export enum EnumModal {
  PARCEL = 'PARCEL',
  LAND = 'LAND',
  AIR = 'AIR',
  SEA = 'SEA',
}

export enum LocationType {
  ORIGIN = 'ORIGIN',
  DESTINATION = 'DESTINATION',
}

export enum Coverage {
  NATIONWIDE = 'NATIONWIDE',
  STATEWIDE = 'STATEWIDE',
  CITY = 'CITY',
  ADDRESS = 'ADDRESS',
  AIRPORT = 'AIRPORT',
  PORT = 'PORT',
}

export enum Currency {
  USD = 'USD',
}

export enum WeightMeasure {
  LB = 'LB',
  KG = 'KG',
}

export class LocationReference {
  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional()
  @IsEnum(Coverage)
  coverage?: Coverage;
}

export class CompanyType {
  @IsUUID()
  company_type_uuid: string;
}

export class Company {
  @IsUUID()
  company_uuid: string;
}

export class CustomRuleCif {
  @IsOptional()
  @IsEnum(Preposition)
  preposition?: Preposition;

  @IsOptional()
  @IsEnum(ConditionCif)
  condition?: ConditionCif;

  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsEnum(Currency)
  coin?: Currency;
}

export class CustomRuleAddress {
  @IsOptional()
  @IsEnum(Preposition)
  preposition?: Preposition;

  @IsOptional()
  @IsEnum(ConditionAddress)
  condition?: ConditionAddress;

  @IsOptional()
  @IsEnum(AddressType)
  value?: AddressType;
}

export class CustomRuleUser {
  @IsOptional()
  @IsEnum(Preposition)
  preposition?: Preposition;

  @IsOptional()
  @IsEnum(ConditionUser)
  condition?: ConditionUser;

  @IsOptional()
  @IsEnum(UserType)
  value?: UserType;
}

export class CustomRuleParcel {
  @IsOptional()
  @IsEnum(Preposition)
  preposition?: Preposition;

  @IsOptional()
  @IsEnum(ConditionParcel)
  condition?: ConditionParcel;

  @IsOptional()
  @IsEnum(ParcelType)
  value?: ParcelType;
}

export class CustomRuleRate {
  @IsOptional()
  @IsEnum(Preposition)
  preposition?: Preposition;

  @IsOptional()
  @IsEnum(ConditionRate)
  condition?: ConditionRate;

  @IsOptional()
  @IsEnum(RateType)
  value?: RateType;
}

export class CustomRule {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CustomRuleCif)
  custom_rule_cif?: CustomRuleCif[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CustomRuleAddress)
  custom_rule_address?: CustomRuleAddress[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CustomRuleUser)
  custom_rule_user?: CustomRuleUser[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CustomRuleParcel)
  custom_rule_parcel?: CustomRuleParcel[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CustomRuleRate)
  custom_rule_rate?: CustomRuleRate[];
}

export class Service {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  payable_to_uuid?: string;

  @IsOptional()
  @IsNumber()
  cost_rate: number;

  @IsOptional()
  @IsNumber()
  cost_minimum: number;

  @IsOptional()
  @IsEnum(ApplicableTo)
  applicable_to?: ApplicableTo;

  @IsOptional()
  @IsNumber()
  profit: number;

  @IsOptional()
  @IsNumber()
  minimum_profit: number;

  @IsOptional()
  @IsEnum(MinimumPer)
  minimum_per?: MinimumPer;

  @IsOptional()
  @IsEnum(Rule)
  rule?: Rule;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => CustomRule)
  custom_rule?: CustomRule[];
}

export class Modal {
  @IsEnum(EnumModal)
  modal?: EnumModal;
}

export class UpsertValueServicesDto {
  @IsOptional()
  @IsUUID()
  value_services_uuid?: string;

  @ToDate()
  effective_on?: string;

  @ToDate()
  expires_on?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Modal)
  modals?: Modal[];

  @IsOptional()
  @IsUUID()
  carrier_uuid?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => LocationReference)
  location_references?: LocationReference[];

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsEnum(WeightMeasure)
  weight_measure?: WeightMeasure;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CompanyType)
  company_types?: CompanyType[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => Company)
  companies?: Company[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @Type(() => Service)
  services?: Service[];

  @IsOptional()
  @IsString()
  restriction?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @ToBoolean()
  is_published?: boolean;
}
