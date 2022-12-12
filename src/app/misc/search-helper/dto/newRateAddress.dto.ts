import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class NewRateShipmentAddressDataDTO {
  @IsNotEmpty()
  @IsIn(['residential', 'commercial'])
  addressType: 'residential' | 'commercial';

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsNotEmpty()
  @IsString()
  zipCode: string;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  streetNumber: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  additionalAddress?: string;
}
