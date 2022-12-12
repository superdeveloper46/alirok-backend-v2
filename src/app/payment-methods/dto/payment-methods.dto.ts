import { Type } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../../../app/couriers/dto/newCouriers.dto';

export class GetPaymentMethodsDTO {
  user_uuid: string;
}
