import { BadRequestException, Injectable } from '@nestjs/common';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
  NewRateShipmentWhatsInsideDataDTO,
} from '../../dto/newCouriers.dto';
import {
  IBPSRatingPayload,
  IBPSShipmentRequest,
  IBPSShipmentRequestItem,
} from '../interface/bps.interface';
import { v4 as uuidv4 } from 'uuid';
import { UpsService } from '../../ups/ups.service';
import { FedexService } from '../../fedex/fedex.service';
import { UspsService } from '../../usps/usps.service';

@Injectable()
export class BpsHelperService {
  constructor(
    private readonly formatters: FormattersService,
    private readonly upsService: UpsService,
    private readonly fedexService: FedexService,
    private readonly uspsService: UspsService,
  ) {}

  public async servicesBps(
    courier: 'usps' | 'ups' | 'fedex',
    rateRequest: NewRateShipmentDTO,
    quoteAll: boolean,
    lastMile: boolean,
  ) {
    try {
      console.log(courier);
      const warehouseOrigin = {
        city: 'Doral',
        country: 'US',
        postal_code: '33122',
        state: 'FL',
        street: 'NW 21st St',
        streetNumber: '8351',
      };

      const warehouseDestiny = {
        city: 'Doral',
        country: 'US',
        postal_code: '33122',
        state: 'FL',
        street: 'NW 21st St',
        streetNumber: '8351',
      };

      const services: NewRateShipmentReturnServiceDTO[] = [];

      if (!lastMile) {
        rateRequest = {
          ...rateRequest,
          whereTo: {
            formattedAddress: `${warehouseOrigin.streetNumber} ${warehouseOrigin.street}, ${warehouseOrigin.city}, ${warehouseOrigin.state} ${warehouseOrigin.postal_code}, ${warehouseOrigin.country}`,
            data: {
              addressType: rateRequest?.whereTo?.data?.addressType,
              zipCode: warehouseOrigin.postal_code,
              additionalAddress: 'Airport',
              city: warehouseOrigin.city,
              country: warehouseOrigin.country,
              state: warehouseOrigin.state,
              street: warehouseOrigin.street,
              streetNumber: warehouseOrigin.streetNumber,
            },
          },
        };
      } else {
        rateRequest = {
          ...rateRequest,
          whereFrom: {
            formattedAddress: `${warehouseDestiny.streetNumber} ${warehouseDestiny.street}, ${warehouseDestiny.city}, ${warehouseDestiny.state} ${warehouseDestiny.postal_code}, ${warehouseDestiny.country}`,
            data: {
              addressType: rateRequest?.whereTo?.data?.addressType,
              zipCode: warehouseDestiny.postal_code,
              additionalAddress: 'Aeroporto',
              city: warehouseDestiny.city,
              country: warehouseDestiny.country,
              state: warehouseDestiny.state,
              street: warehouseDestiny.street,
              streetNumber: warehouseDestiny.streetNumber,
            },
          },
        };
      }

      if (courier === 'usps' || quoteAll) {
        try {
          const quoteUsps = await this.uspsService.rate(rateRequest, []);

          console.log('quoteUsps', quoteUsps);

          if (quoteUsps?.data) {
            const response: NewRateShipmentReturnDTO[] = quoteUsps?.data;

            const filteredResponse = response.filter(
              (i) => i.service_code === '77',
            )[0];

            const items: NewRateShipmentReturnServiceServiceItemDTO[] =
              filteredResponse.services.map((i, index) => {
                return {
                  name: lastMile ? 'Last Mile' : 'First Mile',
                  description: lastMile ? 'Last Mile' : 'First Mile',
                  price: i.items[0].price,
                  drop_off: filteredResponse?.company?.drop_off,
                  required: false,
                };
              });

            const company: NewRateShipmentReturnDeliveryCarrierDTO = {
              logo_url: response[0]?.company?.logo_url,
              rating: 0,
              name: 'USPS',
              drop_off: filteredResponse?.company?.drop_off,
            };

            const service: NewRateShipmentReturnServiceDTO = {
              company,
              name: 'Pick-up',
              items: items.reverse(),
            };

            services.push(service);
          }
        } catch (error) {
          console.log(error);
        }
      }

      if (courier === 'ups' || quoteAll) {
        try {
          const quoteUps = await this.upsService.rate(rateRequest, []);

          if (quoteUps?.data) {
            const response: NewRateShipmentReturnDTO[] = quoteUps?.data;

            const filteredRate = response.filter(
              (i) => i.service_code === (lastMile ? '65' : '03'),
            )[0];

            if (filteredRate) {
              const items: NewRateShipmentReturnServiceServiceItemDTO[] =
                filteredRate.services.map((i, index) => {
                  return {
                    productName: filteredRate?.rate_type,
                    name:
                      i.items[0].name === 'Parcel Freight'
                        ? 'First Mile'
                        : i.items[0].name,
                    description:
                      i.items[0].name === 'Parcel Freight'
                        ? 'First Mile'
                        : i.items[0].name,
                    price: i.items[0].price,
                    drop_off: filteredRate?.company?.drop_off,
                    required: false,
                  };
                });

              const company: NewRateShipmentReturnDeliveryCarrierDTO = {
                logo_url: filteredRate?.company?.logo_url,
                rating: 0,
                name: 'UPS',
                drop_off: filteredRate?.company?.drop_off,
              };

              const service: NewRateShipmentReturnServiceDTO = {
                company,
                name: 'Pick-up',
                items: items.reverse(),
              };

              services.push(service);
            }
          }
        } catch (error) {}
      }

      if (courier === 'fedex' || quoteAll) {
        try {
          const quoteFedex = await this.fedexService.rateFedexRest(
            rateRequest,
            [],
          );

          if (quoteFedex?.data) {
            const response: NewRateShipmentReturnDTO[] = quoteFedex?.data;

            const filteredRate = response.filter(
              (i) => i.service_code === 'FEDEX_GROUND',
            )[0];

            if (filteredRate) {
              const items: NewRateShipmentReturnServiceServiceItemDTO[] =
                filteredRate.services.map((i, index) => {
                  return {
                    name: lastMile ? 'Last Mile' : 'First Mile',
                    description: lastMile ? 'Last Mile' : 'First Mile',
                    price: i.items[0].price,
                    drop_off: filteredRate?.company?.drop_off,
                    required: false,
                  };
                });

              const company: NewRateShipmentReturnDeliveryCarrierDTO = {
                logo_url: filteredRate?.company?.logo_url,
                rating: 0,
                name: 'FEDEX',
                drop_off: filteredRate?.company?.drop_off,
              };

              const service: NewRateShipmentReturnServiceDTO = {
                company,
                name: 'Pick-up',
                items: items.reverse(),
              };

              services.push(service);
            }
          }
        } catch (error) {}
      }

      return { services };
    } catch (error) {}
  }

  packetStandardMx(shipment: NewRateShipmentWhatsInsideDataDTO): number {
    let price = 0;

    const packageUnit = shipment?.weight?.unit;
    const packageWeight =
      packageUnit === 'lb'
        ? shipment?.weight?.value
        : this.formatters.convertKgsToLbs(shipment?.weight?.value);

    if (packageWeight > 1 && packageWeight <= 2) {
      price = 14.82;
    }
    if (packageWeight > 2 && packageWeight <= 3) {
      price = 16.55;
    }
    if (packageWeight > 3 && packageWeight <= 4) {
      price = 18.27;
    }
    if (packageWeight > 4 && packageWeight <= 5) {
      price = 20.0;
    }
    if (packageWeight > 5 && packageWeight <= 6) {
      price = 21.72;
    }
    if (packageWeight > 6 && packageWeight <= 7) {
      price = 23.45;
    }
    if (packageWeight > 7 && packageWeight <= 8) {
      price = 25.17;
    }
    if (packageWeight > 8 && packageWeight <= 9) {
      price = 26.9;
    }
    if (packageWeight > 9 && packageWeight <= 10) {
      price = 28.62;
    }
    if (packageWeight > 10 && packageWeight <= 11) {
      price = 30.35;
    }
    if (packageWeight > 11 && packageWeight <= 12) {
      price = 32.07;
    }
    if (packageWeight > 12 && packageWeight <= 13) {
      price = 33.8;
    }
    if (packageWeight > 13 && packageWeight <= 14) {
      price = 35.52;
    }
    if (packageWeight > 14 && packageWeight <= 15) {
      price = 37.25;
    }
    if (packageWeight > 15 && packageWeight <= 16) {
      price = 38.97;
    }
    if (packageWeight > 16 && packageWeight <= 17) {
      price = 40.7;
    }
    if (packageWeight > 17 && packageWeight <= 18) {
      price = 42.42;
    }
    if (packageWeight > 18 && packageWeight <= 19) {
      price = 44.15;
    }
    if (packageWeight > 19 && packageWeight <= 20) {
      price = 45.87;
    }
    if (packageWeight > 20 && packageWeight <= 21) {
      price = 47.6;
    }
    if (packageWeight > 21 && packageWeight <= 22) {
      price = 49.32;
    }
    if (packageWeight > 22 && packageWeight <= 23) {
      price = 51.05;
    }
    if (packageWeight > 23 && packageWeight <= 24) {
      price = 52.77;
    }
    if (packageWeight > 24 && packageWeight <= 25) {
      price = 54.5;
    }
    if (packageWeight > 25 && packageWeight <= 26) {
      price = 56.22;
    }
    if (packageWeight > 26 && packageWeight <= 27) {
      price = 57.95;
    }
    if (packageWeight > 27 && packageWeight <= 28) {
      price = 59.67;
    }
    if (packageWeight > 28 && packageWeight <= 29) {
      price = 61.4;
    }
    if (packageWeight > 29 && packageWeight <= 30) {
      price = 63.12;
    }
    if (packageWeight > 30 && packageWeight <= 31) {
      price = 64.85;
    }
    if (packageWeight > 31 && packageWeight <= 32) {
      price = 66.57;
    }
    if (packageWeight > 32 && packageWeight <= 33) {
      price = 68.3;
    }
    if (packageWeight > 33 && packageWeight <= 34) {
      price = 70.02;
    }
    if (packageWeight > 34 && packageWeight <= 35) {
      price = 71.75;
    }
    if (packageWeight > 35 && packageWeight <= 36) {
      price = 73.47;
    }
    if (packageWeight > 36 && packageWeight <= 37) {
      price = 75.2;
    }
    if (packageWeight > 37 && packageWeight <= 38) {
      price = 76.92;
    }
    if (packageWeight > 38 && packageWeight <= 39) {
      price = 78.65;
    }
    if (packageWeight > 39 && packageWeight <= 40) {
      price = 80.37;
    }
    if (packageWeight > 40 && packageWeight <= 41) {
      price = 82.1;
    }
    if (packageWeight > 41 && packageWeight <= 42) {
      price = 83.82;
    }
    if (packageWeight > 42 && packageWeight <= 43) {
      price = 85.55;
    }
    if (packageWeight > 43 && packageWeight <= 44) {
      price = 87.27;
    }
    if (packageWeight > 44 && packageWeight <= 45) {
      price = 89;
    }
    if (packageWeight > 45 && packageWeight <= 46) {
      price = 90.72;
    }
    if (packageWeight > 46 && packageWeight <= 47) {
      price = 92.45;
    }
    if (packageWeight > 47 && packageWeight <= 48) {
      price = 94.17;
    }
    if (packageWeight > 48 && packageWeight <= 49) {
      price = 95.9;
    }
    if (packageWeight > 49 && packageWeight <= 50) {
      price = 97.62;
    }
    if (packageWeight > 50 && packageWeight <= 51) {
      price = 99.35;
    }
    if (packageWeight > 51 && packageWeight <= 52) {
      price = 101.07;
    }
    if (packageWeight > 52 && packageWeight <= 53) {
      price = 102.8;
    }
    if (packageWeight > 53 && packageWeight <= 54) {
      price = 104.52;
    }
    if (packageWeight > 54 && packageWeight <= 55) {
      price = 106.25;
    }
    if (packageWeight > 55 && packageWeight <= 56) {
      price = 107.97;
    }
    if (packageWeight > 56 && packageWeight <= 57) {
      price = 109.7;
    }
    if (packageWeight > 57 && packageWeight <= 58) {
      price = 111.42;
    }
    if (packageWeight > 58 && packageWeight <= 59) {
      price = 113.15;
    }
    if (packageWeight > 59 && packageWeight <= 60) {
      price = 114.87;
    }
    if (packageWeight > 60 && packageWeight <= 61) {
      price = 116.6;
    }
    if (packageWeight > 61 && packageWeight <= 62) {
      price = 118.32;
    }
    if (packageWeight > 62 && packageWeight <= 63) {
      price = 120.05;
    }
    if (packageWeight > 63 && packageWeight <= 64) {
      price = 121.77;
    }
    if (packageWeight > 64 && packageWeight <= 65) {
      price = 123.5;
    }
    if (packageWeight > 65 && packageWeight <= 66) {
      price = 125.22;
    }
    if (packageWeight > 66 && packageWeight <= 67) {
      price = 126.95;
    }
    if (packageWeight > 67 && packageWeight <= 68) {
      price = 128.67;
    }
    if (packageWeight > 68 && packageWeight <= 69) {
      price = 130.4;
    }
    if (packageWeight > 69 && packageWeight <= 70) {
      price = 132.12;
    }
    if (packageWeight > 70 && packageWeight <= 71) {
      price = 133.85;
    }
    if (packageWeight > 71 && packageWeight <= 72) {
      price = 135.57;
    }
    if (packageWeight > 72 && packageWeight <= 73) {
      price = 137.3;
    }
    if (packageWeight > 73 && packageWeight <= 74) {
      price = 139.02;
    }
    if (packageWeight > 74 && packageWeight <= 75) {
      price = 140.75;
    }
    if (packageWeight > 75 && packageWeight <= 76) {
      price = 142.47;
    }
    if (packageWeight > 76 && packageWeight <= 77) {
      price = 144.2;
    }
    if (packageWeight > 77 && packageWeight <= 78) {
      price = 145.92;
    }
    if (packageWeight > 78 && packageWeight <= 79) {
      price = 147.65;
    }
    if (packageWeight > 79 && packageWeight <= 80) {
      price = 149.37;
    }
    if (packageWeight > 80 && packageWeight <= 81) {
      price = 151.1;
    }
    if (packageWeight > 81 && packageWeight <= 82) {
      price = 152.82;
    }
    if (packageWeight > 82 && packageWeight <= 83) {
      price = 154.55;
    }
    if (packageWeight > 83 && packageWeight <= 84) {
      price = 156.27;
    }
    if (packageWeight > 84 && packageWeight <= 85) {
      price = 158;
    }
    if (packageWeight > 85 && packageWeight <= 86) {
      price = 159.72;
    }
    if (packageWeight > 86 && packageWeight <= 87) {
      price = 161.45;
    }
    if (packageWeight > 87 && packageWeight <= 88) {
      price = 163.17;
    }
    if (packageWeight > 88 && packageWeight <= 89) {
      price = 164.9;
    }
    if (packageWeight > 89 && packageWeight <= 90) {
      price = 166.62;
    }
    if (packageWeight > 90 && packageWeight <= 91) {
      price = 168.35;
    }
    if (packageWeight > 91 && packageWeight <= 92) {
      price = 170.07;
    }
    if (packageWeight > 92 && packageWeight <= 93) {
      price = 171.8;
    }
    if (packageWeight > 93 && packageWeight <= 94) {
      price = 173.52;
    }
    if (packageWeight > 94 && packageWeight <= 95) {
      price = 175.25;
    }
    if (packageWeight > 95 && packageWeight <= 96) {
      price = 176.97;
    }
    if (packageWeight > 96 && packageWeight <= 97) {
      price = 178.7;
    }
    if (packageWeight > 97 && packageWeight <= 98) {
      price = 180.42;
    }
    if (packageWeight > 98 && packageWeight <= 99) {
      price = 182.15;
    }
    if (packageWeight > 99 && packageWeight <= 100) {
      price = 183.87;
    }
    if (packageWeight > 100 && packageWeight <= 101) {
      price = 185.6;
    }
    if (packageWeight > 101 && packageWeight <= 102) {
      price = 187.32;
    }
    if (packageWeight > 102 && packageWeight <= 103) {
      price = 189.05;
    }
    if (packageWeight > 103 && packageWeight <= 104) {
      price = 190.77;
    }
    if (packageWeight > 104 && packageWeight <= 105) {
      price = 192.5;
    }
    if (packageWeight > 105 && packageWeight <= 106) {
      price = 194.22;
    }
    if (packageWeight > 106 && packageWeight <= 107) {
      price = 195.95;
    }
    if (packageWeight > 107 && packageWeight <= 108) {
      price = 197.67;
    }
    if (packageWeight > 108 && packageWeight <= 109) {
      price = 199.4;
    }
    if (packageWeight > 109 && packageWeight <= 110) {
      price = 201.12;
    }
    if (packageWeight > 110 && packageWeight <= 111) {
      price = 202.85;
    }
    if (packageWeight > 111 && packageWeight <= 112) {
      price = 204.57;
    }
    if (packageWeight > 112 && packageWeight <= 113) {
      price = 206.3;
    }
    if (packageWeight > 113 && packageWeight <= 114) {
      price = 208.02;
    }
    if (packageWeight > 114 && packageWeight <= 115) {
      price = 209.75;
    }
    if (packageWeight > 115 && packageWeight <= 116) {
      price = 211.47;
    }
    if (packageWeight > 116 && packageWeight <= 117) {
      price = 213.2;
    }
    if (packageWeight > 117 && packageWeight <= 118) {
      price = 214.92;
    }
    if (packageWeight > 118 && packageWeight <= 119) {
      price = 216.65;
    }
    if (packageWeight > 119 && packageWeight <= 120) {
      price = 218.37;
    }
    if (packageWeight > 120 && packageWeight <= 121) {
      price = 220.1;
    }
    if (packageWeight > 121 && packageWeight <= 122) {
      price = 221.82;
    }
    if (packageWeight > 122 && packageWeight <= 123) {
      price = 223.55;
    }
    if (packageWeight > 123 && packageWeight <= 124) {
      price = 225.27;
    }
    if (packageWeight > 124 && packageWeight <= 125) {
      price = 227;
    }
    if (packageWeight > 125 && packageWeight <= 126) {
      price = 228.72;
    }
    if (packageWeight > 126 && packageWeight <= 127) {
      price = 230.45;
    }
    if (packageWeight > 127 && packageWeight <= 128) {
      price = 232.17;
    }
    if (packageWeight > 128 && packageWeight <= 129) {
      price = 233.9;
    }
    if (packageWeight > 129 && packageWeight <= 130) {
      price = 235.62;
    }
    if (packageWeight > 130 && packageWeight <= 131) {
      price = 237.35;
    }
    if (packageWeight > 131 && packageWeight <= 132) {
      price = 239.07;
    }
    if (packageWeight > 132 && packageWeight <= 133) {
      price = 240.8;
    }
    if (packageWeight > 133 && packageWeight <= 134) {
      price = 242.52;
    }
    if (packageWeight > 134 && packageWeight <= 135) {
      price = 244.25;
    }
    if (packageWeight > 135 && packageWeight <= 136) {
      price = 245.97;
    }
    if (packageWeight > 136 && packageWeight <= 137) {
      price = 247.7;
    }
    if (packageWeight > 137 && packageWeight <= 138) {
      price = 249.42;
    }
    if (packageWeight > 138 && packageWeight <= 139) {
      price = 251.15;
    }
    if (packageWeight > 139 && packageWeight <= 140) {
      price = 252.87;
    }
    if (packageWeight > 140 && packageWeight <= 141) {
      price = 254.6;
    }
    if (packageWeight > 141 && packageWeight <= 142) {
      price = 256.32;
    }
    if (packageWeight > 142 && packageWeight <= 143) {
      price = 258.05;
    }
    if (packageWeight > 143 && packageWeight <= 144) {
      price = 259.77;
    }
    if (packageWeight > 144 && packageWeight <= 145) {
      price = 261.5;
    }
    if (packageWeight > 145 && packageWeight <= 146) {
      price = 263.22;
    }
    if (packageWeight > 146 && packageWeight <= 147) {
      price = 264.95;
    }
    if (packageWeight > 147 && packageWeight <= 148) {
      price = 266.67;
    }
    if (packageWeight > 148 && packageWeight <= 149) {
      price = 268.4;
    }
    if (packageWeight > 149 && packageWeight <= 150) {
      price = 270.12;
    }

    return price;
  }

  packetStandard(shipment: NewRateShipmentWhatsInsideDataDTO): number {
    let price = 0;

    const packageUnit = shipment?.weight?.unit;
    const packageWeight =
      packageUnit === 'lb'
        ? shipment?.weight?.value
        : this.formatters.convertKgsToLbs(shipment?.weight?.value);

    if (packageWeight > 0.25 && packageWeight <= 0.5) {
      price = 6.96;
    }
    if (packageWeight > 0.5 && packageWeight <= 0.75) {
      price = 7.54;
    }
    if (packageWeight > 0.75 && packageWeight <= 1) {
      price = 8.11;
    }
    if (packageWeight > 1 && packageWeight <= 1.25) {
      price = 8.69;
    }
    if (packageWeight > 1.25 && packageWeight <= 1.5) {
      price = 10.62;
    }
    if (packageWeight > 1.5 && packageWeight <= 1.75) {
      price = 11.2;
    }
    if (packageWeight > 1.75 && packageWeight <= 2) {
      price = 11.77;
    }
    if (packageWeight > 2 && packageWeight <= 2.25) {
      price = 13.68;
    }
    if (packageWeight > 2.25 && packageWeight <= 2.5) {
      price = 14.28;
    }
    if (packageWeight > 2.5 && packageWeight <= 2.75) {
      price = 14.88;
    }
    if (packageWeight > 2.75 && packageWeight <= 3) {
      price = 15.48;
    }
    if (packageWeight > 3 && packageWeight <= 3.25) {
      price = 16.08;
    }
    if (packageWeight > 3.25 && packageWeight <= 3.5) {
      price = 17.49;
    }
    if (packageWeight > 3.5 && packageWeight <= 3.75) {
      price = 18.09;
    }
    if (packageWeight > 3.75 && packageWeight <= 4) {
      price = 18.69;
    }
    if (packageWeight > 4 && packageWeight <= 5) {
      price = 23.66;
    }
    if (packageWeight > 5 && packageWeight <= 6) {
      price = 27.13;
    }
    if (packageWeight > 6 && packageWeight <= 7) {
      price = 30.6;
    }
    if (packageWeight > 7 && packageWeight <= 8) {
      price = 34.07;
    }
    if (packageWeight > 8 && packageWeight <= 9) {
      price = 37.54;
    }
    if (packageWeight > 9 && packageWeight <= 10) {
      price = 41.01;
    }
    if (packageWeight > 10 && packageWeight <= 11) {
      price = 43.6;
    }
    if (packageWeight > 11 && packageWeight <= 12) {
      price = 46.99;
    }
    if (packageWeight > 12 && packageWeight <= 13) {
      price = 50.38;
    }
    if (packageWeight > 13 && packageWeight <= 14) {
      price = 53.77;
    }
    if (packageWeight > 14 && packageWeight <= 15) {
      price = 57.16;
    }
    if (packageWeight > 15 && packageWeight <= 16) {
      price = 60.55;
    }
    if (packageWeight > 16 && packageWeight <= 17) {
      price = 63.94;
    }
    if (packageWeight > 17 && packageWeight <= 18) {
      price = 67.33;
    }
    if (packageWeight > 18 && packageWeight <= 19) {
      price = 70.72;
    }
    if (packageWeight > 19 && packageWeight <= 20) {
      price = 74.11;
    }
    if (packageWeight > 20 && packageWeight <= 21) {
      price = 77.51;
    }
    if (packageWeight > 21 && packageWeight <= 22) {
      price = 80.9;
    }
    if (packageWeight > 22 && packageWeight <= 23) {
      price = 84.29;
    }
    if (packageWeight > 23 && packageWeight <= 24) {
      price = 87.68;
    }
    if (packageWeight > 24 && packageWeight <= 25) {
      price = 91.07;
    }
    if (packageWeight > 25 && packageWeight <= 26) {
      price = 94.46;
    }
    if (packageWeight > 26 && packageWeight <= 27) {
      price = 97.85;
    }
    if (packageWeight > 27 && packageWeight <= 28) {
      price = 101.24;
    }
    if (packageWeight > 28 && packageWeight <= 29) {
      price = 104.63;
    }
    if (packageWeight > 29 && packageWeight <= 30) {
      price = 108.02;
    }
    if (packageWeight > 30 && packageWeight <= 31) {
      price = 111.41;
    }
    if (packageWeight > 31 && packageWeight <= 32) {
      price = 114.8;
    }
    if (packageWeight > 32 && packageWeight <= 33) {
      price = 118.19;
    }
    if (packageWeight > 33 && packageWeight <= 34) {
      price = 121.58;
    }
    if (packageWeight > 34 && packageWeight <= 35) {
      price = 124.97;
    }
    if (packageWeight > 35 && packageWeight <= 36) {
      price = 128.36;
    }
    if (packageWeight > 36 && packageWeight <= 37) {
      price = 131.75;
    }
    if (packageWeight > 37 && packageWeight <= 38) {
      price = 135.14;
    }
    if (packageWeight > 38 && packageWeight <= 39) {
      price = 138.53;
    }
    if (packageWeight > 39 && packageWeight <= 40) {
      price = 141.92;
    }
    if (packageWeight > 40 && packageWeight <= 41) {
      price = 145.31;
    }
    if (packageWeight > 41 && packageWeight <= 42) {
      price = 148.7;
    }
    if (packageWeight > 42 && packageWeight <= 43) {
      price = 152.09;
    }
    if (packageWeight > 43 && packageWeight <= 44) {
      price = 155.48;
    }
    if (packageWeight > 44 && packageWeight <= 45) {
      price = 158.87;
    }
    if (packageWeight > 45 && packageWeight <= 46) {
      price = 162.26;
    }
    if (packageWeight > 46 && packageWeight <= 47) {
      price = 165.65;
    }
    if (packageWeight > 47 && packageWeight <= 48) {
      price = 169.04;
    }
    if (packageWeight > 48 && packageWeight <= 49) {
      price = 172.43;
    }
    if (packageWeight > 49 && packageWeight <= 50) {
      price = 175.83;
    }
    if (packageWeight > 50 && packageWeight <= 51) {
      price = 179.22;
    }
    if (packageWeight > 51 && packageWeight <= 52) {
      price = 182.61;
    }
    if (packageWeight > 52 && packageWeight <= 53) {
      price = 186.0;
    }
    if (packageWeight > 53 && packageWeight <= 54) {
      price = 189.39;
    }
    if (packageWeight > 54 && packageWeight <= 55) {
      price = 192.78;
    }
    if (packageWeight > 55 && packageWeight <= 56) {
      price = 196.17;
    }
    if (packageWeight > 56 && packageWeight <= 57) {
      price = 199.56;
    }
    if (packageWeight > 57 && packageWeight <= 58) {
      price = 202.95;
    }
    if (packageWeight > 58 && packageWeight <= 59) {
      price = 206.34;
    }
    if (packageWeight > 59 && packageWeight <= 60) {
      price = 209.73;
    }
    if (packageWeight > 60 && packageWeight <= 61) {
      price = 213.12;
    }
    if (packageWeight > 61 && packageWeight <= 62) {
      price = 216.51;
    }
    if (packageWeight > 62 && packageWeight <= 64) {
      price = 219.9;
    }
    if (packageWeight > 63 && packageWeight <= 64) {
      price = 223.29;
    }
    if (packageWeight > 64 && packageWeight <= 65) {
      price = 226.68;
    }
    if (packageWeight > 65 && packageWeight <= 66) {
      price = 230.07;
    }

    return price;
  }
  packetExpress(shipment: NewRateShipmentWhatsInsideDataDTO): number {
    let price = 0;

    const packageUnit = shipment?.weight?.unit;
    const packageWeight =
      packageUnit === 'lb'
        ? shipment?.weight?.value
        : this.formatters.convertKgsToLbs(shipment?.weight?.value);

    if (packageWeight > 0.25 && packageWeight <= 0.5) {
      price = 10.88;
    }
    if (packageWeight > 0.5 && packageWeight <= 0.75) {
      price = 11.6;
    }
    if (packageWeight > 0.75 && packageWeight <= 1) {
      price = 12.76;
    }
    if (packageWeight > 1 && packageWeight <= 1.25) {
      price = 13.48;
    }
    if (packageWeight > 1.25 && packageWeight <= 1.5) {
      price = 17.36;
    }
    if (packageWeight > 1.5 && packageWeight <= 1.75) {
      price = 18.18;
    }
    if (packageWeight > 1.75 && packageWeight <= 2) {
      price = 18.99;
    }
    if (packageWeight > 2 && packageWeight <= 2.25) {
      price = 19.81;
    }
    if (packageWeight > 2.25 && packageWeight <= 2.5) {
      price = 21.84;
    }
    if (packageWeight > 2.5 && packageWeight <= 2.75) {
      price = 24.04;
    }
    if (packageWeight > 2.75 && packageWeight <= 3) {
      price = 24.9;
    }
    if (packageWeight > 3 && packageWeight <= 3.25) {
      price = 25.77;
    }
    if (packageWeight > 3.25 && packageWeight <= 3.5) {
      price = 28.11;
    }
    if (packageWeight > 3.5 && packageWeight <= 3.75) {
      price = 29.02;
    }
    if (packageWeight > 3.75 && packageWeight <= 4) {
      price = 31.35;
    }
    if (packageWeight > 4 && packageWeight <= 5) {
      price = 32.26;
    }
    if (packageWeight > 5 && packageWeight <= 6) {
      price = 44.41;
    }
    if (packageWeight > 6 && packageWeight <= 7) {
      price = 50.67;
    }
    if (packageWeight > 7 && packageWeight <= 8) {
      price = 55.18;
    }
    if (packageWeight > 8 && packageWeight <= 9) {
      price = 61.44;
    }
    if (packageWeight > 9 && packageWeight <= 10) {
      price = 67.7;
    }
    if (packageWeight > 10 && packageWeight <= 11) {
      price = 73.96;
    }
    if (packageWeight > 11 && packageWeight <= 12) {
      price = 80.22;
    }
    if (packageWeight > 12 && packageWeight <= 13) {
      price = 84.74;
    }
    if (packageWeight > 13 && packageWeight <= 14) {
      price = 94.17;
    }
    if (packageWeight > 14 && packageWeight <= 15) {
      price = 100.26;
    }
    if (packageWeight > 15 && packageWeight <= 16) {
      price = 106.36;
    }
    if (packageWeight > 16 && packageWeight <= 17) {
      price = 112.46;
    }
    if (packageWeight > 17 && packageWeight <= 18) {
      price = 118.56;
    }
    if (packageWeight > 18 && packageWeight <= 19) {
      price = 124.65;
    }
    if (packageWeight > 19 && packageWeight <= 20) {
      price = 130.75;
    }
    if (packageWeight > 20 && packageWeight <= 21) {
      price = 136.85;
    }
    if (packageWeight > 21 && packageWeight <= 22) {
      price = 142.95;
    }
    if (packageWeight > 22 && packageWeight <= 23) {
      price = 149.04;
    }
    if (packageWeight > 23 && packageWeight <= 24) {
      price = 155.14;
    }
    if (packageWeight > 24 && packageWeight <= 25) {
      price = 161.24;
    }
    if (packageWeight > 25 && packageWeight <= 26) {
      price = 167.34;
    }
    if (packageWeight > 26 && packageWeight <= 27) {
      price = 173.44;
    }
    if (packageWeight > 27 && packageWeight <= 28) {
      price = 179.53;
    }
    if (packageWeight > 28 && packageWeight <= 29) {
      price = 185.63;
    }
    if (packageWeight > 29 && packageWeight <= 30) {
      price = 190.5;
    }
    if (packageWeight > 30 && packageWeight <= 31) {
      price = 197.83;
    }
    if (packageWeight > 31 && packageWeight <= 32) {
      price = 203.92;
    }
    if (packageWeight > 32 && packageWeight <= 33) {
      price = 210.02;
    }
    if (packageWeight > 33 && packageWeight <= 34) {
      price = 216.12;
    }
    if (packageWeight > 34 && packageWeight <= 35) {
      price = 222.22;
    }
    if (packageWeight > 35 && packageWeight <= 36) {
      price = 228.31;
    }
    if (packageWeight > 36 && packageWeight <= 37) {
      price = 234.41;
    }
    if (packageWeight > 37 && packageWeight <= 38) {
      price = 240.51;
    }
    if (packageWeight > 38 && packageWeight <= 39) {
      price = 246.61;
    }
    if (packageWeight > 39 && packageWeight <= 40) {
      price = 252.7;
    }
    if (packageWeight > 40 && packageWeight <= 41) {
      price = 258.8;
    }
    if (packageWeight > 41 && packageWeight <= 42) {
      price = 264.9;
    }
    if (packageWeight > 42 && packageWeight <= 43) {
      price = 271.0;
    }
    if (packageWeight > 43 && packageWeight <= 44) {
      price = 277.09;
    }
    if (packageWeight > 44 && packageWeight <= 45) {
      price = 283.19;
    }
    if (packageWeight > 45 && packageWeight <= 46) {
      price = 289.29;
    }
    if (packageWeight > 46 && packageWeight <= 47) {
      price = 295.39;
    }
    if (packageWeight > 47 && packageWeight <= 48) {
      price = 301.48;
    }
    if (packageWeight > 48 && packageWeight <= 49) {
      price = 307.58;
    }
    if (packageWeight > 49 && packageWeight <= 50) {
      price = 313.68;
    }
    if (packageWeight > 50 && packageWeight <= 51) {
      price = 319.78;
    }
    if (packageWeight > 51 && packageWeight <= 52) {
      price = 325.88;
    }
    if (packageWeight > 52 && packageWeight <= 53) {
      price = 331.97;
    }
    if (packageWeight > 53 && packageWeight <= 54) {
      price = 338.07;
    }
    if (packageWeight > 54 && packageWeight <= 55) {
      price = 344.17;
    }
    if (packageWeight > 55 && packageWeight <= 56) {
      price = 350.27;
    }
    if (packageWeight > 56 && packageWeight <= 57) {
      price = 356.36;
    }
    if (packageWeight > 57 && packageWeight <= 58) {
      price = 362.46;
    }
    if (packageWeight > 58 && packageWeight <= 59) {
      price = 368.56;
    }
    if (packageWeight > 59 && packageWeight <= 60) {
      price = 374.66;
    }
    if (packageWeight > 60 && packageWeight <= 61) {
      price = 380.75;
    }
    if (packageWeight > 61 && packageWeight <= 62) {
      price = 386.85;
    }
    if (packageWeight > 62 && packageWeight <= 64) {
      price = 392.95;
    }
    if (packageWeight > 63 && packageWeight <= 64) {
      price = 399.05;
    }
    if (packageWeight > 64 && packageWeight <= 65) {
      price = 405.14;
    }
    if (packageWeight > 65 && packageWeight <= 66) {
      price = 411.24;
    }

    return price;
  }

  getBpsRatingTypes(country: string) {
    if (country === 'BR') {
      return [
        {
          name: 'Packet Standard',
          description: 'Packet Standard',
          productName: 'Packet Standard',
          rateType: 'Packet Standard',
          serviceCode: 'standard',
          daysInTransit: 16,
        },
        {
          name: 'Packet Express',
          description: 'Packet Express',
          productName: 'Packet Express',
          rateType: 'Packet Express',
          serviceCode: 'express',
          daysInTransit: 12,
        },
      ];
    }

    if (country === 'MX') {
      return [
        {
          name: 'Packet Standard',
          description: 'Packet Standard',
          productName: 'Packet Standard',
          rateType: 'Packet Standard',
          serviceCode: 'standard',
          daysInTransit: 10,
        },
      ];
    }
  }

  getBpsPriceRating(
    rateData: NewRateShipmentDTO,
    service: 'express' | 'standard',
  ) {
    let packages: any = rateData.whatsInside.data.map((i, index: number) => {
      const weightIsLbs = i.weight.unit === 'lb';

      const sizeInInches = i.dimensions.unit === 'in';
      return Array(Number(i.pieces)).fill({
        dimensions: {
          height: Number(
            sizeInInches
              ? this.formatters.convertInchesInCM(i.dimensions.height)
              : i.dimensions.height,
          ),
          length: Number(
            sizeInInches
              ? this.formatters.convertInchesInCM(i.dimensions.length)
              : i.dimensions.length,
          ),
          width: Number(
            sizeInInches
              ? this.formatters.convertInchesInCM(i.dimensions.width)
              : i.dimensions.width,
          ),
        },
        weight: {
          unit: 'kg',
          value: Number(
            weightIsLbs
              ? this.formatters.convertLbsToKgs(i.weight.value)
              : i.weight.value,
          ),
        },
      });
    });

    packages = [].concat(...packages.map((i: any) => i));

    let totalAmount = 0;

    const destinyCountry = rateData.whereTo.data.country;

    packages.forEach((i) => {
      if (destinyCountry === 'BR') {
        if (service === 'standard') {
          totalAmount += this.packetStandard(i);
        }
        if (service === 'express') {
          totalAmount += this.packetExpress(i);
        }
      }

      if (destinyCountry === 'MX') {
        if (service === 'standard') {
          totalAmount += this.packetStandard(i);
        }
      }
    });

    return totalAmount;
  }

  public staticBpsParcelFreight(
    rateData: NewRateShipmentDTO,
    data: {
      name: string;
      description: string;
      productName: string;
      rateType: string;
      serviceCode: string;
    }[],
  ): NewRateShipmentReturnDTO[] {
    try {
      const packagesToMetric =
        this.formatters.convertPackagesToMetric(rateData);

      if (packagesToMetric[0].weight.value >= 30) {
        throw new BadRequestException('Weight is above 30kgs limit for BPS!');
      }

      const responses: NewRateShipmentReturnDTO[] = [];

      const courierName = 'BPS';

      const company: NewRateShipmentReturnServiceDTO['company'] = {
        logo_url: 'https://static.alirok.io/collections/logos/bps_logo.png',
        name: courierName,
        rating: 0,
        drop_off: [
          {
            company_name: 'BPS - Bringer Parcel Service',
            phone_number: 'not available',
            address: {
              street: '8351 NW 21st St',
              city: 'Doral',
              state: 'FL',
              postal_code: '33122',
              country: 'BR',
            },
          },
        ],
      };

      for (const iterator of data) {
        const amount = this.getBpsPriceRating(
          rateData,
          iterator?.serviceCode as any,
        );

        if (amount < 1 || !amount) {
          throw new BadRequestException(
            'BPS freight amount cannot be less than one!',
          );
        }

        const bpsParcelFreight: NewRateShipmentReturnServiceDTO['items'] = [
          {
            description: iterator?.productName,
            name: iterator?.productName,
            price: {
              currency: 'USD',
              value: amount,
            },
            required: true,
            productName: iterator?.productName,
            selected: false,
            service_code: iterator?.serviceCode,
            drop_off: [
              {
                company_name: 'BPS - Bringer Parcel Service',
                phone_number: 'not available',
                address: {
                  street: '8351 NW 21st St',
                  city: 'Doral',
                  state: 'FL',
                  postal_code: '33122',
                  country: 'BR',
                },
              },
            ],
          },
        ];

        const filledService: NewRateShipmentReturnServiceDTO = {
          company,
          items: bpsParcelFreight,
          name: 'Parcel Freight',
        };

        const quoteOptions: NewRateShipmentReturnDTO = {
          company,
          delivery: {
            date: null,
            days_in_transit: 13,
          },
          price: {
            currency: 'USD',
            value: amount,
          },
          rate_type: iterator.rateType,
          service_code: iterator.rateType,
          services: [filledService],
          category: rateData.category,
        };

        responses.push(quoteOptions);
      }

      return responses;
    } catch (error) {
      throw error;
    }
  }

  public buildRatingPayload(
    rateData: NewRateShipmentDTO,
    serviceId: string,
  ): IBPSRatingPayload {
    const whereFrom = rateData.whereFrom;
    const whereTo = rateData.whereTo;

    const from: IBPSRatingPayload['from'] = {
      city: whereFrom?.data?.city,
      country: { isoCode: whereFrom?.data?.country },
      postalCode: whereFrom?.data?.zipCode,
      state: whereFrom?.data?.state,
    };

    const to: IBPSRatingPayload['to'] = {
      city: whereTo?.data?.city,
      country: { isoCode: whereTo?.data?.country },
      postalCode: whereTo?.data?.zipCode,
      state: whereTo?.data?.state,
    };

    const service: IBPSRatingPayload['service'] = {
      code: serviceId,
    };

    const packagesRaw: any = rateData.whatsInside.data.map(
      (i, index: number) => {
        const weightIsLbs = i.weight.unit === 'lb';

        const sizeInInches = i.dimensions.unit === 'in';
        return Array(Number(i.pieces)).fill({
          harmonized_code: i?.items[0]?.hts_code,
          description: i?.items[0]?.description,
          weight: i.weight.value,
          width: i.dimensions.width,
          height: i.dimensions.height,
          length: i.dimensions.length,
          quantity: i.items[0]?.quantity,
          value: i.items[0]?.price,
          insurance_value: 0,
        });
      },
    );

    const packages: any = [].concat(...packagesRaw.map((i: any) => i));

    const payload: IBPSRatingPayload = {
      declaredValue: 0,
      from,
      packages,
      service,
      shippingDate: rateData?.shipDate?.data?.date,
      to,
    };

    return payload;
  }

  public buildShippingPayload(
    sender: CheckoutParcelMember,
    receiver: CheckoutParcelMember,
    quote: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
  ): IBPSShipmentRequest {
    const whatsInside = quote.whatsInside.data[0];
    const origin = quote.whereFrom.data;
    const destiny = quote.whereTo.data;

    const freightValue = order.services
      .find((i) => i.name === 'Parcel Freight')
      .items.find((b) => b.name === order.rate_type).price.value;

    const items: IBPSShipmentRequestItem[] = whatsInside.items.map((i) => ({
      description: i.description,
      item_details: {
        contains_battery: false,
        contains_flammable_liquid: false,
        contains_perfume: false,
      },
      quantity: i.quantity,
      sh_code: String(parseInt(i.hts_code.replace('.', ''))),
      value: this.formatters.roundAmount(i.price.value / i.quantity),
    }));

    const parcelDetails: IBPSShipmentRequest['parcel_details'] = {
      apply_min_dimension_override: false,
      destination_country_iso: quote.whereFrom.data.country,
      freight_value: Number(freightValue),
      height: whatsInside.dimensions.height,
      width: whatsInside.dimensions.width,
      length: whatsInside.dimensions.length,
      measurement_unit: whatsInside.dimensions.unit === 'cm' ? 'cm' : 'inches',
      weight_unit: whatsInside.weight.unit === 'kg' ? 'kilogram' : 'pound',
      value: items.reduce((acc, curr) => (acc = acc + curr.value), 0),
      weight: whatsInside.weight.value,
      service_code: this.formatStaticServiceCode(
        order.service_code as string,
        quote.whereTo.data.country,
      ),
      parcel_type: 'box',
      tax_modality: quote.whereFrom.data.country === 'BR' ? 'ddu' : 'ddu',
      domestic_required: false,
      insurance_value: 0,
    };

    const consignee: IBPSShipmentRequest['sender'] = {
      address: {
        address_line_1: `${origin.streetNumber} ${origin.street}`,
        city: origin.city,
        country: origin.country,
        number: origin.streetNumber,
        postal_code: origin.zipCode,
        state: origin.state,
      },
      company_name: sender.full_name,
      first_name: sender.first_name,
      last_name: sender.last_name,
      email: sender.email,
      phone: `+${sender.phone.number}`,
      tax_id: sender.tax_id,
      type: sender.company_name ? 'business' : 'individual',
      website: 'https://alirok.com',
    };

    console.log(receiver.phone.number);

    const recipient: IBPSShipmentRequest['recipient'] = {
      address: {
        address_line_1: `${destiny.streetNumber} ${destiny.street}`,
        city: destiny.city,
        country: destiny.country,
        number: destiny.streetNumber,
        postal_code: destiny.zipCode,
        state: destiny.state,
      },
      first_name: receiver.first_name,
      last_name: receiver.last_name,
      phone: `+${receiver.phone.number}`,
      tax_id: receiver.tax_id,
      type: receiver.company_name ? 'business' : 'individual',
    };

    const payload: IBPSShipmentRequest = {
      external_customer_id: uuidv4(),
      external_reference_code: uuidv4(),
      is_humanitarian: false,
      items,
      parcel_details: parcelDetails,
      recipient,
      sender: consignee,
    };

    return payload;
  }

  public formatStaticServiceCode(serviceCode: string, country: string): string {
    if (country === 'BR') {
      switch (serviceCode) {
        case 'Packet Standard':
          return 'BPS-01';
          break;
        case 'Packet Express':
          return 'BPS-07';
          break;

        default:
          break;
      }
    }

    if (country === 'MX') {
      switch (serviceCode) {
        case 'Packet Standard':
          return 'BPS-06';
          break;

        default:
          break;
      }
    }
  }
}
