import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  isString,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IFeedbackPayload } from 'src/app/feedback/dto/getFeedbacksByCompanyAndService.dto';

export class NewRateShipmentShipDateDataDTO {
  @IsNotEmpty()
  @IsIn(['dropOff', 'pickUp'])
  type: 'dropOff' | 'pickUp';

  @IsNotEmpty()
  date: string;
}

export class NewRateShipmentShipDateDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentShipDateDataDTO)
  data: NewRateShipmentShipDateDataDTO;
}

export class NewRateShipmentWhatsInsideDataItemsPriceDTO {
  @IsNotEmpty()
  @IsNumber()
  value: number;
}

export class NewRateShipmentWhatsInsideDataItemsDTO {
  @IsOptional()
  @IsString()
  hts_code: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsNumber()
  quantity: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDataItemsPriceDTO)
  price: NewRateShipmentWhatsInsideDataItemsPriceDTO;
}

export class NewRateShipmentWhatsInsideDataWeightDTO {
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @IsNotEmpty()
  @IsIn(['kg', 'lb'])
  unit: 'kg' | 'lb';
}

export class NewRateShipmentWhatsInsideDataDimensionsDTO {
  @IsNotEmpty()
  @IsNumber()
  length: number;

  @IsNotEmpty()
  @IsNumber()
  width: number;

  @IsNotEmpty()
  @IsNumber()
  height: number;

  @IsNotEmpty()
  @IsIn(['cm', 'in'])
  unit: 'cm' | 'in';
}

export class NewRateShipmentWhatsInsideDataDTO {
  @IsNotEmpty()
  @IsNumber()
  pieces: number;

  @IsOptional()
  @IsString()
  type: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDataDimensionsDTO)
  dimensions: NewRateShipmentWhatsInsideDataDimensionsDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDataWeightDTO)
  weight: NewRateShipmentWhatsInsideDataWeightDTO;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDataItemsDTO)
  items: NewRateShipmentWhatsInsideDataItemsDTO[];
}

export class NewRateShipmentWhatsInsideDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDataDTO)
  data: NewRateShipmentWhatsInsideDataDTO[];
}

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

  @IsOptional()
  @IsString()
  zipCode4?: string;

  @IsOptional()
  @IsString()
  addressLine?: string;

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

export class NewRateShipmentWhereToDTO {
  @IsOptional()
  @IsString()
  formattedAddress?: string;

  @ValidateIf((o) => o.toogle === 'byAddress')
  @IsOptional()
  @ValidateNested()
  @Type(() => NewRateShipmentAddressDataDTO)
  data?: NewRateShipmentAddressDataDTO;
}

export class NewRateShipmentWhereFromDTO {
  @IsOptional()
  @IsString()
  formattedAddress?: string;

  @ValidateIf((o) => o.toogle === 'byAddress')
  @IsOptional()
  @ValidateNested()
  @Type(() => NewRateShipmentAddressDataDTO)
  data?: NewRateShipmentAddressDataDTO;
}

export class NewRateShipmentFiltersDTO {
  @IsOptional()
  @IsIn(['pickUp', 'insurance', 'duties', 'signature', 'liftgatePickUp', 'insideDelivery', 'liftgateDelivery', 'limitedAccessPickUp', 'limitedAccessDelivery', 'callBeforeDelivery', 'origin', 'customs', 'destination'])
  services: Array<'pickUp' | 'insurance' | 'duties' | 'signature' | 'liftgatePickUp' | 'insideDelivery' | 'liftgateDelivery' | 'limitedAccessPickUp' | 'limitedAccessDelivery' | 'callBeforeDelivery' | 'origin' | 'customs' | 'destination'>;
}

export class NewRateShipmentDescriptionDTO {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDataItemsPriceDTO)
  price?: NewRateShipmentWhatsInsideDataItemsPriceDTO;
}
export class NewRateShipmentDTO {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentWhereFromDTO)
  whereFrom: NewRateShipmentWhereFromDTO;

  @IsOptional()
  @IsIn(['land', 'parcel', 'air'])
  category: 'land' | 'parcel' | 'air';

  @IsNotEmpty()
  @IsIn(['price', 'carrier', 'transitTime'])
  sortBy: 'price' | 'carrier' | 'transitTime';

  @IsOptional()
  @Type(() => NewRateShipmentFiltersDTO)
  filters: NewRateShipmentFiltersDTO;

  @IsOptional()
  couriers: [string];

  @IsNotEmpty()
  @IsIn(['package', 'document', 'landCargo'])
  type: 'package' | 'document' | 'landCargo';

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentWhereToDTO)
  whereTo: NewRateShipmentWhereToDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentWhatsInsideDTO)
  whatsInside: NewRateShipmentWhatsInsideDTO;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => NewRateShipmentShipDateDTO)
  shipDate: NewRateShipmentShipDateDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => NewRateShipmentDescriptionDTO)
  description: NewRateShipmentDescriptionDTO;

  @IsNotEmpty()
  @IsString()
  currency: string;
}

export class NewRateShipmentCouriersQueryParamsDTO {
  @IsOptional()
  couriers: string[];
}

export type NewRateShipmentReturnAddressDTO = {
  postal_code: string;
  street: string;
  city: string;
  state: string;
  country: string;
};

export type NewRateShipmentReturnDropOffLocationDTO = {
  company_name: string;
  phone_number: string;
  address: NewRateShipmentReturnAddressDTO;
};

export type NewRateShipmentReturnDeliveryCarrierDTO = {
  name: string;
  logo_url: string;
  drop_off?: NewRateShipmentReturnDropOffLocationDTO[];
  rating: number;
};

export type NewRateShipmentReturnDeliveryDTO = {
  date: string;
  days_in_transit: number;
};

export type NewRateShipmentReturnPriceDTO = {
  value: number;
  currency: string;
  tmpValue?: number;
};

export type NewRateShipmentReturnServiceServiceItemDTO = {
  productName?: string;
  name: string;
  description: string;
  price: NewRateShipmentReturnPriceDTO;
  drop_off?: NewRateShipmentReturnDropOffLocationDTO[];
  required: boolean;
  service_code?: string;
  selected?: boolean;
};

export type NewRateShipmentReturnServiceDTO = {
  name: string;
  company: NewRateShipmentReturnDeliveryCarrierDTO;
  items: NewRateShipmentReturnServiceServiceItemDTO[];
};

export type NewRateShipmentReturnEstimatedDeliveryDateDTO = {
  minDeliveryDate: string;
  maxDeliveryDate: string;
};

export class NewRateShipmentReturnDTO {
  company: NewRateShipmentReturnDeliveryCarrierDTO;
  delivery: NewRateShipmentReturnDeliveryDTO;
  price: NewRateShipmentReturnPriceDTO;
  services: NewRateShipmentReturnServiceDTO[];
  rate_type: string;
  category?: 'land' | 'parcel' | 'air';
  service_code: string | number | any;
  reviews?: IFeedbackPayload[];
  estimatedDeliveryDates?: NewRateShipmentReturnEstimatedDeliveryDateDTO;
}
