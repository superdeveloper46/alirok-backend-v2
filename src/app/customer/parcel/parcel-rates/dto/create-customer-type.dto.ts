import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';

export class CustomerTypeDto {
  @IsUUID()
  parcel_route_uuid: string;

  @IsUUID()
  company_type_uuid: string;
}

export class CreateCustomerTypeDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => CustomerTypeDto)
  customerData: CustomerTypeDto[];
}
