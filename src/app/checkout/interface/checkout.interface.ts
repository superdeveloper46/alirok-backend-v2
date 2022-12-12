export interface CheckoutParcelMember {
  type: 'INDIVIDUAL' | 'CORPORATION';
  pre_filled: 'ADDRESS' | 'USER' | 'MEMBER' | 'COMPANY';
  parcel_member_uuid: string;
  is_residential_address: boolean;
  phone: { countryCode: string; number: string };
  firstName: string;
  lastName: string;
  full_name: string;
  first_name: string;
  last_name: string;
  company_name: string;
  tax_id: string;
  email: string;
  location_uuid: string;
  subject_role_type_uuid: string;
  user_uuid: any;
  company_uuid: any;
  subject_role_types: {
    subject_role_type_uuid: string;
    name: string;
  };
  locations: {
    location_uuid: string;
    street_number: string;
    complement: string;
    postal_code_uuid: string;
    location_administrative_divisions: [any];
  };
}
