import { BadRequestException, Injectable } from '@nestjs/common';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnDropOffLocationDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
  NewRateShipmentWhatsInsideDataDTO,
  NewRateShipmentWhatsInsideDTO,
} from '../../dto/newCouriers.dto';
import {
  CorreiosPackageCollectionRequest,
  CorreiosUnitRequest,
} from '../interface/correios.interface';
import { v4 as uuidv4 } from 'uuid';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import { UpsService } from '../../ups/ups.service';
import { FedexService } from '../../fedex/fedex.service';
import { UspsService } from '../../usps/usps.service';

@Injectable()
export class CorreiosHelperService {
  constructor(
    private readonly formatterService: FormattersService,
    private readonly upsService: UpsService,
    private readonly fedexService: FedexService,
    private readonly uspsService: UspsService,
  ) {}

  getCorreiosRatingTypes() {
    const ratingTypes = [
      // {
      //   name: 'Packet Mini',
      //   description: 'Packet Mini',
      //   productName: 'Packet Mini',
      //   rateType: 'Packet Mini',
      //   serviceCode: '33197',
      // },
      {
        name: 'Packet Standard',
        description: 'Packet Standard',
        productName: 'Packet Standard',
        rateType: 'Packet Standard',
        serviceCode: '33162',
      },
      {
        name: 'Packet Express',
        description: 'Packet Express',
        productName: 'Packet Express',
        rateType: 'Packet Express',
        serviceCode: '33170',
      },
    ];

    return ratingTypes;
  }

  packetMini(shipment: NewRateShipmentWhatsInsideDataDTO): number {
    let price = 0;

    const packageUnit = shipment?.weight?.unit;
    const packageWeight =
      packageUnit === 'kg'
        ? shipment?.weight?.value
        : this.formatterService.convertLbsToKgs(shipment?.weight?.value);

    if (packageWeight > 0 && packageWeight <= 0.3) {
      price = 18.65;
    }

    return price;
  }
  packetStandard(shipment: NewRateShipmentWhatsInsideDataDTO): number {
    let price = 0;

    const packageUnit = shipment?.weight?.unit;
    const packageWeight =
      packageUnit === 'kg'
        ? shipment?.weight?.value
        : this.formatterService.convertLbsToKgs(shipment?.weight?.value);

    if (packageWeight > 0 && packageWeight <= 0.5) {
      price = 28.6;
    }
    if (packageWeight > 0.5 && packageWeight <= 1) {
      price = 32.1;
    }
    if (packageWeight > 1 && packageWeight <= 1.5) {
      price = 35.6;
    }
    if (packageWeight > 1.5 && packageWeight <= 2) {
      price = 39.1;
    }
    if (packageWeight > 2.0 && packageWeight <= 2.5) {
      price = 42.6;
    }
    if (packageWeight > 2.5 && packageWeight <= 3.0) {
      price = 46.1;
    }
    if (packageWeight > 3.0 && packageWeight <= 3.5) {
      price = 49.6;
    }
    if (packageWeight > 3.5 && packageWeight <= 4.0) {
      price = 53.1;
    }
    if (packageWeight > 4.0 && packageWeight <= 4.5) {
      price = 56.6;
    }
    if (packageWeight > 4.5 && packageWeight <= 5.0) {
      price = 60.1;
    }

    if (packageWeight > 5) {
      const priceUntil5kg = 60.1;

      const additionalWeight = packageWeight - 5;

      const additionalWeightTax = additionalWeight / 0.5;

      const additionalAmount = additionalWeightTax * 3.5;

      price = additionalAmount + priceUntil5kg;
    }

    return price;
  }
  packetExpress(shipment: NewRateShipmentWhatsInsideDataDTO): number {
    let price = 0;

    const packageUnit = shipment?.weight?.unit;
    const packageWeight =
      packageUnit === 'kg'
        ? shipment?.weight?.value
        : this.formatterService.convertLbsToKgs(shipment?.weight?.value);

    if (packageWeight > 0 && packageWeight <= 0.3) {
      price = 36.4;
    }
    if (packageWeight > 0.3 && packageWeight <= 0.5) {
      price = 38.0;
    }
    if (packageWeight > 0.5 && packageWeight <= 1) {
      price = 42.0;
    }
    if (packageWeight > 1 && packageWeight <= 1.5) {
      price = 46.0;
    }
    if (packageWeight > 1.5 && packageWeight <= 2) {
      price = 50.0;
    }
    if (packageWeight > 2.0 && packageWeight <= 2.5) {
      price = 54.0;
    }
    if (packageWeight > 2.5 && packageWeight <= 3.0) {
      price = 58.0;
    }
    if (packageWeight > 3.0 && packageWeight <= 3.5) {
      price = 62.0;
    }
    if (packageWeight > 3.5 && packageWeight <= 4.0) {
      price = 66.0;
    }
    if (packageWeight > 4.0 && packageWeight <= 4.5) {
      price = 70.0;
    }
    if (packageWeight > 4.5 && packageWeight <= 5.0) {
      price = 74.0;
    }

    if (packageWeight > 5) {
      const priceUntil5kg = 74.0;

      const additionalWeight = packageWeight - 5;

      const additionalWeightTax = additionalWeight / 0.5;

      const additionalAmount = additionalWeightTax * 4;

      price = additionalAmount + priceUntil5kg;
    }

    return price;
  }

  getCorreiosPriceRating(
    rateData: NewRateShipmentDTO,
    service: '33197' | '33162' | '33170',
  ) {
    let packages: any = rateData.whatsInside.data.map((i, index: number) => {
      const weightIsLbs = i.weight.unit === 'lb';

      const sizeInInches = i.dimensions.unit === 'in';
      return Array(Number(i.pieces)).fill({
        dimensions: {
          height: Number(
            sizeInInches
              ? this.formatterService.convertInchesInCM(i.dimensions.height)
              : i.dimensions.height,
          ),
          length: Number(
            sizeInInches
              ? this.formatterService.convertInchesInCM(i.dimensions.length)
              : i.dimensions.length,
          ),
          width: Number(
            sizeInInches
              ? this.formatterService.convertInchesInCM(i.dimensions.width)
              : i.dimensions.width,
          ),
        },
        weight: {
          unit: 'kg',
          value: Number(
            weightIsLbs
              ? this.formatterService.convertLbsToKgs(i.weight.value)
              : i.weight.value,
          ),
        },
      });
    });

    packages = [].concat(...packages.map((i: any) => i));

    let totalAmount = 0;

    packages.forEach((i) => {
      if (service === '33197') {
        totalAmount += this.packetMini(i);
      }
      if (service === '33162') {
        totalAmount += this.packetStandard(i);
      }
      if (service === '33170') {
        totalAmount += this.packetExpress(i);
      }
    });

    return totalAmount;
  }

  public mockedCorreiosParcelFreight(
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
      const responses = [];

      const courierName = 'Correios';

      const company: NewRateShipmentReturnServiceDTO['company'] = {
        logo_url: 'https://static.alirok.io/collections/logos/correios.png',
        name: courierName,
        rating: 0,
        drop_off: [],
      };

      for (const iterator of data) {
        const amount = this.getCorreiosPriceRating(
          rateData,
          iterator?.serviceCode as any,
        );

        const correiosParcelFreight: NewRateShipmentReturnServiceDTO['items'] =
          [
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
              drop_off: [],
            },
          ];

        const filledService: NewRateShipmentReturnServiceDTO = {
          company,
          items: correiosParcelFreight,
          name: 'Parcel Freight',
        };

        const quoteOptions: NewRateShipmentReturnDTO = {
          company,
          delivery: {
            date: null,
            days_in_transit: 16,
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

  public getDistributionModality(serviceCode: string | number) {
    switch (String(serviceCode)) {
      case 'PACKET STANDARD':
        return '33162';
        break;
      case 'PACKET EXPRESS':
        return '33170';
        break;
      case 'PACKET MINI':
        return '33197';
        break;

      default:
        throw new BadRequestException(
          'Not possible to define distribution modality',
        );
        break;
    }
  }

  public correiosPackageColletionPayload(
    quote: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ): CorreiosPackageCollectionRequest {
    const senderAddress = quote?.whereFrom?.data;
    const recipientAddress = quote?.whereTo?.data;

    const packages: CorreiosPackageCollectionRequest['packageList'][][] =
      quote.whatsInside.data.map((pkg, index: number) => {
        const weightIsLbs = pkg.weight.unit === 'lb';

        const sizeInInches = pkg.dimensions.unit === 'in';

        return Array(Number(pkg.pieces)).fill({
          customerControlCode: uuidv4(),
          senderName: sender?.full_name?.substring(0, 70),
          senderAddress:
            `${senderAddress?.streetNumber} ${senderAddress?.street}`?.substring(
              0,
              140,
            ),
          senderAddressNumber: senderAddress?.streetNumber,
          senderAddressComplement: senderAddress?.additionalAddress?.substring(
            0,
            50,
          ),
          senderZipCode: senderAddress?.zipCode,
          senderCityName: senderAddress?.city,
          senderState: senderAddress?.state,
          senderCountryCode: senderAddress?.country,
          senderEmail: sender?.email,
          senderWebsite: 'https://alirok.com',
          recipientName: recipient?.full_name?.substring(0, 70),
          recipientDocumentType: recipient?.company_name ? 'CNPJ' : 'CPF',
          recipientDocumentNumber: recipient?.tax_id,
          recipientAddress:
            `${recipientAddress?.streetNumber} ${recipientAddress?.street}`?.substring(
              0,
              140,
            ),
          recipientAddressNumber: recipientAddress?.streetNumber,
          recipientAddressComplement: recipientAddress?.additionalAddress,
          recipientCityName: recipientAddress?.city,
          recipientState: recipientAddress?.state,
          recipientZipCode: recipientAddress?.zipCode,
          recipientEmail: recipient?.email,
          recipientPhoneNumber: recipient?.phone?.number,
          totalWeight: weightIsLbs
            ? this.formatterService.convertLbsToKgs(pkg.weight.value)
            : pkg.weight.value,
          packagingLength: sizeInInches
            ? this.formatterService.convertInchesInCM(pkg.dimensions.length)
            : pkg.dimensions.length,
          packagingWidth: sizeInInches
            ? this.formatterService.convertInchesInCM(pkg.dimensions.width)
            : pkg.dimensions.width,
          packagingHeight: sizeInInches
            ? this.formatterService.convertInchesInCM(pkg.dimensions.height)
            : pkg.dimensions.height,
          distributionModality: this.getDistributionModality(
            order?.service_code,
          ),
          taxPaymentMethod: 'DDU',
          currency: 'USD',
          freightPaidValue: order?.price,
          insurancePaidValue: 0,
          items: pkg?.items?.map((i) => ({
            hsCode: i.hts_code,
            description: i?.description,
            quantity: i?.quantity,
            value: i?.price,
          })),
        });
      });

    const flattenPackage = [].concat(...packages.map((i) => i));

    return {
      packageList: flattenPackage,
    };
  }

  public correiosUnitsPayload({
    originCountry,
    serviceCode,
    trackingCodes,
    unitsPayload,
  }: {
    trackingCodes: string[];
    originCountry: string;
    serviceCode: string;
    unitsPayload: CorreiosUnitRequest['unitList'];
  }): CorreiosUnitRequest {
    let serviceSubclassCode: 'NX' | 'IX' | 'XP' = 'NX';

    switch (String(serviceCode)) {
      case 'PACKET STANDARD':
        serviceSubclassCode = 'NX';
        break;
      case 'PACKET EXPRESS':
        serviceSubclassCode = 'IX';
        break;
      case 'PACKET MINI':
        serviceSubclassCode = 'XP';
        break;
    }

    return {
      dispatchNumber: this.formatterService.betweenRandomNumber(100000, 999999),
      originCountry: 'US',
      originOperatorName: 'SKYG',
      destinationOperatorName: 'SAOD',
      postalCategoryCode: 'A',
      serviceSubclassCode: serviceSubclassCode,
      unitList: unitsPayload,
    };
  }

  public async servicesCorreios(
    courier: 'usps' | 'ups' | 'fedex',
    rateRequest: NewRateShipmentDTO,
    quoteAll: boolean,
    lastMile: boolean,
  ) {
    try {
      const warehouseOrigin = {
        city: 'Miami',
        country: 'US',
        postal_code: '33142',
        state: 'FL',
        street: 'NW 42nd Ave',
        streetNumber: '2100',
      };

      const warehouseDestiny = {
        city: 'Guarulhos',
        country: 'BR',
        postal_code: '07190100',
        state: 'SP',
        street: 'Rod. Hélio Smidt',
        streetNumber: 's/nº',
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
        console.log('quote usps');

        try {
          const quoteUsps = await this.uspsService.rate(rateRequest, []);

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
        } catch (error) {}
      }

      if (courier === 'ups' || quoteAll) {
        console.log('quote ups');

        try {
          const quoteUps = await this.upsService.rate(rateRequest, []);

          console.log('quote ups', quoteUps);

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

      // if (courier === 'fedex' || quoteAll) {
      //   console.log('quote fedex');

      //   try {
      //     const quoteFedex = await this.fedexService.rateFedexRest(
      //       rateRequest,
      //       [],
      //     );

      //     console.log('quote fedex', quoteFedex);

      //     if (quoteFedex?.data) {
      //       const response: NewRateShipmentReturnDTO[] = quoteFedex?.data;

      //       const filteredRate = response.filter(
      //         (i) => i.service_code === 'FEDEX_GROUND',
      //       )[0];

      //       if (filteredRate) {
      //         const items: NewRateShipmentReturnServiceServiceItemDTO[] =
      //           filteredRate.services.map((i, index) => {
      //             return {
      //               name: lastMile ? 'Last Mile' : 'First Mile',
      //               description: lastMile ? 'Last Mile' : 'First Mile',
      //               price: i.items[0].price,
      //               drop_off: filteredRate?.company?.drop_off,
      //               required: false,
      //             };
      //           });

      //         const company: NewRateShipmentReturnDeliveryCarrierDTO = {
      //           logo_url: filteredRate?.company?.logo_url,
      //           rating: 0,
      //           name: 'FEDEX',
      //           drop_off: filteredRate?.company?.drop_off,
      //         };

      //         const service: NewRateShipmentReturnServiceDTO = {
      //           company,
      //           name: 'Pick-up',
      //           items: items.reverse(),
      //         };

      //         services.push(service);
      //       }
      //     }
      //   } catch (error) {}
      // }

      return { services };
    } catch (error) {}
  }
}
