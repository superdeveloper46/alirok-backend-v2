import {
  IsUUID,
  IsString,
  IsEmail,
  IsInt,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

enum ParcelRateRelationshipsStatus {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
}

export enum ConnectType {
  CONNECTED = 'CONNECTED',
  REFUSED = 'REFUSED',
}

export class ParcelRateRelationshipsDTO {
  @IsNotEmpty()
  @IsEnum(ParcelRateRelationshipsStatus)
  relationType: ParcelRateRelationshipsStatus;
}

enum InviteConnectTypeDTO {
  CONNECTED = 'connected',
  RECEIVED = 'received',
  SENT = 'sent',
}

export class FetchAllInviteByConnectTypeDTO {
  @IsNotEmpty()
  @IsEnum(InviteConnectTypeDTO)
  connectType: InviteConnectTypeDTO;

  @IsOptional()
  @IsEnum(ParcelRateRelationshipsStatus)
  relationType?: ParcelRateRelationshipsStatus;
}

export class FetchPendingInviteDTO {
  @IsNotEmpty()
  @IsEnum(ParcelRateRelationshipsStatus)
  relationType: ParcelRateRelationshipsStatus;

  @IsNotEmpty()
  @IsUUID()
  relationshipUUID: ParcelRateRelationshipsStatus;
}

export class AcceptPendingInviteDTO {
  @IsInt()
  @IsOptional()
  credit_line: number;

  @IsOptional()
  payment_term: string;

  @IsNotEmpty()
  @IsEnum(ConnectType)
  connectType: ConnectType;
}

export interface IFindAllCustomerRelationships {
  currentCompany: string;
  relationType: ParcelRateRelationshipsStatus;
  queryParams?: ParcelRateRelationshipsQueryDTO;
}

export class ParcelRateRelationshipsQueryDTO {
  @IsOptional()
  company_uuid?: string;

  @IsOptional()
  fetch_company?: string;
}

export class CreateVendorDTO {
  @IsNotEmpty()
  @IsEmail()
  contact_person: string;

  @IsNotEmpty()
  payment_term: string;

  @IsInt()
  @IsNotEmpty()
  credit_line: number;

  @IsUUID()
  @IsOptional()
  customer_company_uuid?: string;

  @IsUUID()
  @IsOptional()
  vendor_company_uuid?: string;

  @IsUUID()
  currency_uuid?: string;
}

export class SearchCompanyDTO {
  @IsString()
  @IsOptional()
  term?: string;
}

export class VerifyInvitationDTO {
  @IsNotEmpty()
  @IsUUID()
  companyRelationUUID: string;
}
