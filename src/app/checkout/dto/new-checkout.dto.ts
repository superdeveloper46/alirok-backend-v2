import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class NewCheckoutParcelBookingDTO {
  @IsNotEmpty()
  @IsString()
  parcelBookingId: string;

  @IsOptional()
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  paymentId: string;
}
