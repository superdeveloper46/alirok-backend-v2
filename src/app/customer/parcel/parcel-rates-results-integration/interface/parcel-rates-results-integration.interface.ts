import { NewRateShipmentAddressDataDTO } from 'src/app/misc/search-helper/dto/newRateAddress.dto';

export interface ParcelRatesIntegrationResults {
  originDropoff: NewRateShipmentAddressDataDTO;
  destinyAddress: NewRateShipmentAddressDataDTO;
  productName: string;
  courierName: string;
  minProfit: number;
  minCost: number;
  profitpercentage: number;
  minWeight: number;
  maxWeight: number;
  profitType: 'fixed' | 'percentage';
  transitTimeFrom: number;
  transitTimeTo: number;
  totalPrice: number;
}
