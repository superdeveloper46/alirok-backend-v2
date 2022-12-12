import { enum_parcel_member_type } from '@generated/client';
import { IsOptional, IsString } from 'class-validator';

export interface FormattedMember {
  parcel_member_uuid: string;
  full_name: string;
  first_name: string;
  last_name: string;
  company_name: string;
  tax_id: string;
  email: string;
  phone: any;
  type: enum_parcel_member_type;
  category: string;
  subject_role_type_uuid: string;
  isAddressComplete: boolean;
  member_image: string;
  address: {
    address_type: string;
    complement: string;
    street_number: string;
    postal_code: string;
    city: string;
    street: string;
    state: string;
    country: string;
  };
}

export class FindAllOwnerMembersDto {
  @IsString()
  @IsOptional()
  owner?: string;
}
