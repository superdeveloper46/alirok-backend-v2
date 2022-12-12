import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateFeedbackDTO {
  @IsString()
  @IsOptional()
  message?: string;

  @IsNumber()
  @IsIn([1, 2, 3, 4, 5])
  rating: number;

  @IsString()
  @IsNotEmpty()
  tracking_code: string;

  @IsUUID()
  @IsNotEmpty()
  parcel_rate_source_uuid: string;

  @IsString()
  @IsNotEmpty()
  service_code: string;

  user_uuid: string;
}
