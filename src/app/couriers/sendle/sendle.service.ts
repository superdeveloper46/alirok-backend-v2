import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parcel_bookings } from '@generated/client';
import { lastValueFrom } from 'rxjs';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnDeliveryDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnPriceDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentReturnDropOffLocationDTO,
  NewRateShipmentReturnAddressDTO
} from '../dto/newCouriers.dto';
import { basicDTO } from './dto/api.dto'
import {
  SENDLEQuoteRequestDomesticBody,
  SENDLEQuoteRequestInternationalBody,
  SENDLEDomesticORInternationalObject,
  SENDLERateRequestProductsReturn
} from '../sendle/interface/sendle.interface'

@Injectable()

export class SendleService {
    private baseUrl: string;
    private header;

    constructor(
        private readonly configService: ConfigService,
        private readonly http: HttpService
    ) {
        this.baseUrl = configService.get('SENDLE_API_URL');
        this.header = {
            Authorization: `Basic ${Buffer.from(
                `${configService.get('SENDLE_ID')}:${configService.get('SENDLE_API_KEY',
                )}`,
            ).toString('base64')}`,
        }
    }
   
    public async rate(rateData: NewRateShipmentDTO) {
      try{
          const reqQuery = {
            sender_address_line1: rateData.whereFrom?.data?.street,
            sender_address_line2: rateData.whereFrom?.data?.streetNumber,
            sender_suburb: rateData.whereFrom?.data?.city,
            sender_postcode: rateData.whereFrom?.data?.zipCode,
            sender_country: rateData.whereFrom?.data?.country,
            receiver_address_line1: rateData.whereTo?.data?.street,
            receiver_address_line2: rateData.whereTo?.data?.streetNumber,
            receiver_suburb: rateData.whereTo?.data?.city,
            receiver_postcode: rateData.whereTo?.data?.zipCode,
            receiver_country: rateData.whereTo?.data?.country,
            weight_value: rateData.whatsInside?.data[0]?.weight?.value.toString(),
            weight_units: rateData.whatsInside?.data[0]?.weight?.unit,
            length_value: rateData.whatsInside?.data[0]?.dimensions?.length.toString(),
            width_value: rateData.whatsInside?.data[0]?.dimensions?.width.toString(),
            height_value: rateData.whatsInside?.data[0]?.dimensions?.height.toString(),
            dimension_units: rateData.whatsInside?.data[0]?.dimensions?.unit
          };

          const queryString = new URLSearchParams(reqQuery).toString();
          const { data } = await lastValueFrom(
            this.http.get(
              `${this.baseUrl}/api/products?${queryString}`,
              {
                headers: this.header
              }
            )
          )

          const quotes = data.map((product) => 
            this.formatSENDLEQuoteResponse(
              rateData,
              product
            ))
          return { data: quotes };

      } catch (error) {
          console.log("Sandle Request Error", error.message);
          return error.message;
      }
    }
    public async rateWithType(
      rateData: NewRateShipmentDTO,
      serviceCode?: string,
    ): Promise<number> {
      try {
        const reqQuery = {
          sender_address_line1: rateData.whereFrom?.data?.street,
          sender_address_line2: rateData.whereFrom?.data?.streetNumber,
          sender_suburb: rateData.whereFrom?.data?.city,
          sender_postcode: rateData.whereFrom?.data?.zipCode,
          sender_country: rateData.whereFrom?.data?.country,
          receiver_address_line1: rateData.whereTo?.data?.street,
          receiver_address_line2: rateData.whereTo?.data?.streetNumber,
          receiver_suburb: rateData.whereTo?.data?.city,
          receiver_postcode: rateData.whereTo?.data?.zipCode,
          receiver_country: rateData.whereTo?.data?.country,
          weight_value: rateData.whatsInside?.data[0]?.weight?.value.toString(),
          weight_units: rateData.whatsInside?.data[0]?.weight?.unit,
          length_value: rateData.whatsInside?.data[0]?.dimensions?.length.toString(),
          width_value: rateData.whatsInside?.data[0]?.dimensions?.width.toString(),
          height_value: rateData.whatsInside?.data[0]?.dimensions?.height.toString(),
          dimension_units: rateData.whatsInside?.data[0]?.dimensions?.unit
        };
  
        console.timeLog("create parcel booking", "sendle")
  
        const queryString = new URLSearchParams(reqQuery).toString();
        const { data } = await lastValueFrom(
          this.http.get(
            `${this.baseUrl}/api/products?${queryString}`,
            {
              headers: this.header
            }
          )
        );
        const singleProduct = data.find(
          (i) => i.product.code === serviceCode,
        );
  
        if (!singleProduct) throw new BadRequestException('Quote Fails');
  
        let currencyPrice = singleProduct.quote.gross.amount;
        return Number(currencyPrice.toFixed(2));
      } catch (error) {
        console.log("Sandle Request Error", error);  
        return error;
      }
    } 
 

    public formatSENDLEQuoteResponse(
      quote: NewRateShipmentDTO,
      product: SENDLERateRequestProductsReturn,
    ) : NewRateShipmentReturnDTO {
      let currencyPrice = product.quote?.gross;

      const delivery: NewRateShipmentReturnDeliveryDTO = {
        date: product.eta?.date_range[1],
        days_in_transit: product.eta?.days_range[1],
      }

      const company: NewRateShipmentReturnDeliveryCarrierDTO = {
        logo_url: `https://api-doc.sendle.com/images/logo.png`,
        name: 'SENDLE',
        rating: 1,
        drop_off: this.makeFakeDropOffLocation() as NewRateShipmentReturnDropOffLocationDTO[],
      }

      const price: NewRateShipmentReturnPriceDTO = {
        currency: 'USD',
        value: Number(currencyPrice.amount.toFixed(2)),
      }

      const rate_type = product.product.name;

      const service_code = product.product.code;

      return {
        category: quote?.category,
        company,
        delivery,
        price,
        rate_type,
        service_code,
        services: this.makeSENDLEServices(
          quote?.whereFrom?.data?.country,
          product,
          company,
          price,
        )
      }
    }
    
    public makeSENDLEServices(
      origin: string,
      product: SENDLERateRequestProductsReturn,
      company: NewRateShipmentReturnDeliveryCarrierDTO,
      freightPrice: NewRateShipmentReturnPriceDTO,
    ) {
      const services: NewRateShipmentReturnServiceDTO[] = [
        {
          company,
          items: [
            {
              description: product.route?.descrition,
              name: product.product.first_mile_option == "pickup"?'Pick-up':product.product.first_mile_option,
              price: freightPrice,
              required: true,
            }
          ],
          name: product.product.first_mile_option == "pickup"?'Pick-up':product.product.first_mile_option,
        },
      ];

      return services
    }

    private makeFakeDropOffLocation() {
      return [
        {
          company_name: 'Test address. This feature only works in production.',
          phone_number: '+1-202-555-0148',
          address: {
            street: `ROK STREET, ${new Date().getFullYear()}`,
            city: 'STARTUP WAY',
            state: 'ST',
            postal_code: '00000',
            country: 'US',
          } as NewRateShipmentReturnAddressDTO,
        },
      ];
    }
}