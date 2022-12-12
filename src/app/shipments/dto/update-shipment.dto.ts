import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateDataDto {
  @IsString()
  @IsNotEmpty()
  parcel_booking_uuid: string;

  @IsString()
  @IsNotEmpty()
  next_status: string;
}
