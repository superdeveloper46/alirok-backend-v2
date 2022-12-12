import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class CustomerDto {
  @IsUUID()
  parcel_route_uuid: string;

  @IsUUID()
  company_uuid: string;
}

export class CreateCustomerDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CustomerDto)
  customerData: CustomerDto[];
}
