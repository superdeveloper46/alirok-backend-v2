import { shipment_statuses, subject_role_types } from '@generated/client';
import { IsOptional, IsString } from 'class-validator';

export class ListShipments {
  @IsString()
  @IsOptional()
  owner?: string;
}

export class OwnerRequest {
  user_uuid?: string;
  company_uuid?: string;
}

export class Member {
  full_name: string;
  subject_role_types: subject_role_types;
  users?: {
    photo?: string;
  };
  companies?: {
    logo?: string;
  };
}
export class ShipmentDetails {
  parcel_bookings: {
    invoice_url?: string;
    label_url?: string;
    shipment_statuses?: shipment_statuses;
    parcel_booking_uuid: string;
    p_parcel_id: string;
    parcel_member_parcel_bookings: {
      parcel_members: Member[];
    }[];
    tracking_code_id: string;
    user_uuid: string;
    estimated_date: Date;
    delivered_date: Date;
    quote: any;
  };
}
