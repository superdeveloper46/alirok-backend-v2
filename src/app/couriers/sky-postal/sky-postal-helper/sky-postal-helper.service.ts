import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parcel_bookings } from '@generated/client';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnDropOffLocationDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
} from '../../dto/newCouriers.dto';
import { UpsService } from '../../ups/ups.service';
import { UspsService } from '../../usps/usps.service';
import {
  SkypostalCSVOtherCountries,
  SkypostalCSVUruguay,
  SkyPostalGetCityCode,
  SkyPostalRateRequestReturnData,
  SkyPostalShipmentConsignee,
  SkyPostalShipmentData,
  SkyPostalShipmentOptionsRequest,
  SkyPostalShipmentRequest,
  SkyPostalShipmentShipper,
} from '../interface/sky-postal.interface';
import { v4 as uuidv4 } from 'uuid';
import { format, parseISO } from 'date-fns';
import { FormattersService } from '../../../misc/formatters/formatters.service';
import { CheckoutParcelMember } from '../../../checkout/interface/checkout.interface';
import { FedexService } from '../../fedex/fedex.service';
import { lastValueFrom } from 'rxjs';
import { parse } from 'csv-parse';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class SkyPostalHelperService {
  private SKYPOSTAL_USER_CODE: string;
  private SKYPOSTAL_APP_KEY: string;
  private SKYPOSTAL_USER_KEY: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly uspsService: UspsService,
    private readonly upsService: UpsService,
    private readonly fedexService: FedexService,
    private readonly formatter: FormattersService,
    private readonly http: HttpService,
  ) {
    this.SKYPOSTAL_USER_CODE = configService.get('SKYPOSTAL_USER_CODE');
    this.SKYPOSTAL_APP_KEY = configService.get('SKYPOSTAL_APP_KEY');
    this.SKYPOSTAL_USER_KEY = configService.get('SKYPOSTAL_USER_KEY');
  }

  public generateUserInfo() {
    return {
      user_code: this.SKYPOSTAL_USER_CODE,
      user_key: this.SKYPOSTAL_USER_KEY,
      app_key: this.SKYPOSTAL_APP_KEY,
    };
  }

  public generateBody(
    rateData: NewRateShipmentDTO,
    rateServiceCode?: number,
    incoterm?: string,
    cityCode?: number,
  ) {
    this.validateSkyPostalRating(rateData);

    const forceUnitsConversion =
      this.formatter.convertPackagesToMetric(rateData);

    const requestBody = forceUnitsConversion.map((i) => {
      return Array(Number(i.pieces)).fill({
        user_info: this.generateUserInfo(),
        weight: i.weight.value,
        weight_type: 'kg',
        merchandise_value: i.items.reduce(
          (acc, curr) => (acc = curr.price.value * curr.quantity),
          0,
        ),
        copa_id: 1360,
        country_code: this.getSkyPostalCountryCode(
          rateData?.whereFrom?.data?.country,
        ),
        city_code: cityCode,
        height_dim: i?.dimensions?.height,
        length_dim: i?.dimensions?.length,
        width_dim: i?.dimensions?.width,
        dim_type: 'cm',
        iata_code_origin: 'MIA',
        rate_service_code: rateServiceCode,
        import_service_code: incoterm,
      });
    });

    return [].concat(...requestBody.map((i) => i));
  }

  private getSkyPostalCountryCode(isoCountry: string) {
    let countryCode = 0;

    switch (isoCountry) {
      case 'MX':
        countryCode = 155;
        break;
      case 'BR':
        countryCode = 30;
        break;
      case 'CO':
        countryCode = 48;
        break;
      case 'CL':
        countryCode = 30;
        break;
      case 'CR':
        countryCode = 30;
        break;
      case 'EC':
        countryCode = 62;
        break;
      case 'PE':
        countryCode = 30;
        break;
      case 'UY':
        countryCode = 230;
        break;
      default:
        break;
    }
  }

  private validateSkyPostalRating({
    whatsInside,
    whereFrom,
    whereTo,
  }: NewRateShipmentDTO) {
    const allowedToCountries = ['BR', 'MX', 'CO', 'CL', 'CR', 'EC', 'PE', 'UY'];
    const originCountry = whereFrom?.data?.country;
    const destinyCountry = whereTo?.data?.country;

    const validatePackagesAmount =
      whatsInside.data.length > 1 || whatsInside.data[0].pieces > 1;

    if (validatePackagesAmount) {
      throw new BadRequestException(
        'No more than 1 package per shipment request is allowed on skypostal!',
      );
    }

    if (originCountry !== 'US') {
      throw new BadRequestException('SkyPostal shipping origin must be US!');
    }

    if (!allowedToCountries.includes(destinyCountry)) {
      return new BadRequestException(
        'Skypostal does not provide rates for this country!',
      );
    }

    return;
  }

  public formatSkypostalResponse(
    data: SkyPostalRateRequestReturnData[],
    rateRequest: NewRateShipmentDTO,
    services: NewRateShipmentReturnServiceDTO[],
    dropOffLocation: NewRateShipmentReturnDropOffLocationDTO[],
  ): NewRateShipmentReturnDTO[] {
    const quotes: NewRateShipmentReturnDTO[] = [];

    const destinyCountry = rateRequest?.whereTo?.data?.country;

    const mandatoryDutiesCountyes = ['MX', 'CO', 'CL', 'CR', 'EC', 'PE', 'UY'];

    for (const iterator of data) {
      const freightPrice = this.formatter.roundAmount(iterator?.total_value);

      const isBrazilMandatoryDuties =
        destinyCountry === 'BR' && iterator.rateServiceCode === 2;

      const company: NewRateShipmentReturnDeliveryCarrierDTO = {
        logo_url:
          'https://static.alirok.io/collections/logos/skypostal_small_official_logo.png',
        name: 'SkyPostal',
        rating: 0,
        drop_off: dropOffLocation,
      };

      const duties = {
        company: {
          logo_url:
            'https://static.alirok.io/collections/logos/skypostal_small_official_logo.png',
          name: 'SkyPostal',
          rating: 0,
          drop_off: dropOffLocation,
        },
        items: [
          {
            description: 'Federal Duties. ICMS NOT included',
            name: 'Duties & Taxes',
            price: { currency: 'USD', value: iterator?.total_customs },
            required:
              mandatoryDutiesCountyes.includes(destinyCountry) ||
              isBrazilMandatoryDuties,
          },
        ],
        name: 'Duties & Taxes',
      };

      const parcelFreight = {
        company: {
          logo_url:
            'https://static.alirok.io/collections/logos/skypostal_small_official_logo.png',
          name: 'SkyPostal',
          rating: 0,
          drop_off: dropOffLocation,
        },
        items: [
          {
            productName: iterator?.description,
            description: 'Parcel Freight',
            name: 'Parcel Freight',
            price: { currency: 'USD', value: freightPrice },
            required: true,
          },
        ],
        name: 'Parcel Freight',
      };

      const formatted: NewRateShipmentReturnDTO = {
        company,
        delivery: { date: null, days_in_transit: iterator?.daysInTransit + 2 },
        price: { currency: 'USD', value: freightPrice },
        service_code: iterator?.rateServiceCode,
        rate_type: iterator?.description,
        services: [...services, parcelFreight],
        category: rateRequest?.category,
      };

      if (iterator.rateServiceCode !== 301) formatted.services.push(duties);

      quotes.push(formatted);
    }
    return quotes;
  }

  public async servicesSkyPostal(
    courier: 'usps' | 'ups' | 'fedex',
    rateRequest: NewRateShipmentDTO,
    quoteAll: boolean,
  ) {
    const skyPostalAddress = {
      city: 'Doral',
      country: 'US',
      postal_code: '33126',
      state: 'FL',
      street: 'NW 15th St',
      streetNumber: '7805',
    };

    const dropOffLocation: NewRateShipmentReturnDropOffLocationDTO[] = [
      {
        address: skyPostalAddress,
        company_name: 'SkyPostal',
        phone_number: '',
      },
    ];

    const services: NewRateShipmentReturnServiceDTO[] = [];

    rateRequest = {
      ...rateRequest,
      whereTo: {
        formattedAddress: `${skyPostalAddress.streetNumber} ${skyPostalAddress.street}, ${skyPostalAddress.city}, ${skyPostalAddress.state} ${skyPostalAddress.postal_code}, ${skyPostalAddress.country}`,
        data: {
          addressType: rateRequest?.whereTo?.data?.addressType,
          zipCode: skyPostalAddress.postal_code,
          additionalAddress: '',
          city: skyPostalAddress.city,
          country: skyPostalAddress.country,
          state: skyPostalAddress.state,
          street: skyPostalAddress.street,
          streetNumber: skyPostalAddress.streetNumber,
        },
      },
    };

    if (courier === 'usps' || quoteAll) {
      console.log('quote usps');

      const quoteUsps = await this.uspsService.rate(rateRequest, []);

      if (quoteUsps?.data) {
        const response: NewRateShipmentReturnDTO[] = quoteUsps?.data;

        const filteredResponse = response.filter(
          (i) => i.service_code === '77',
        )[0];

        const items: NewRateShipmentReturnServiceServiceItemDTO[] =
          filteredResponse.services.map((i, index) => {
            return {
              name:
                i.items[0].name === 'Parcel Freight'
                  ? 'First Mile'
                  : i.items[0].name,
              description:
                i.items[0].description === 'Parcel Freight'
                  ? 'First Mile'
                  : i.items[0].description,
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
    }

    if (courier === 'ups' || quoteAll) {
      console.log('quote ups');

      const quoteUps = await this.upsService.rate(rateRequest, []);

      if (quoteUps?.data) {
        const response: NewRateShipmentReturnDTO[] = quoteUps?.data;

        const filteredRate = response.filter((i) => i.service_code === '03')[0];

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
                    ? 'Transit time 2-8 days'
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
        } else
          throw new BadRequestException('UPS parcel freight not available!');
      }
    }

    if (courier === 'fedex' || quoteAll) {
      console.log('quote fedex');
      const quoteFedex = await this.fedexService.rateFedexRest(rateRequest, []);

      if (quoteFedex?.data) {
        const response: NewRateShipmentReturnDTO[] = quoteFedex?.data;

        const filteredRate = response.filter(
          (i) => i.service_code === 'FEDEX_GROUND',
        )[0];

        if (filteredRate) {
          const items: NewRateShipmentReturnServiceServiceItemDTO[] =
            filteredRate.services.map((i, index) => {
              return {
                name:
                  i.items[0].name === 'Parcel Freight'
                    ? 'First Mile'
                    : i.items[0].name,
                description:
                  i.items[0].description === 'Parcel Freight'
                    ? 'First Mile'
                    : i.items[0].description,
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
        } else
          throw new BadRequestException('Fedex parcel freight not available!');
      }
    }

    return { services, dropOffLocation };
  }

  public skyPostalReqData(rateData: NewRateShipmentDTO) {
    const destiny = rateData?.whereTo?.data?.country;
    const packageUnit = rateData?.whatsInside?.data[0]?.weight?.unit;
    const packageWeight = this.formatter.roundAmount(
      packageUnit === 'kg'
        ? rateData?.whatsInside?.data[0]?.weight?.value
        : this.formatter.convertLbsToKgs(
            rateData?.whatsInside?.data[0]?.weight?.value,
          ),
    );

    switch (destiny) {
      case 'BR':
        return [
          {
            incoterm: 'DDU',
            rateServiceCode: 301,
            description: 'Packet Standard',
            daysInTransit: 15,
          },
          {
            incoterm: 'DDP',
            rateServiceCode: 302,
            description: 'Packet Express',
            daysInTransit: 10,
          },
        ];
        break;
      case 'MX':
        const mexicoQuotes = [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 8,
          },
        ];

        if (packageWeight > 2) {
          mexicoQuotes.push({
            incoterm: 'DDP',
            rateServiceCode: 13,
            description: 'Courier Econ',
            daysInTransit: 15,
          });
        }

        return mexicoQuotes;
        break;
      case 'CO':
        return [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 8,
          },
        ];
        break;
      case 'CL':
        return [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 8,
          },
        ];
        break;
      case 'CR':
        return [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 10,
          },
        ];
        break;
      case 'EC':
        return [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 8,
          },
        ];
        break;
      case 'PE':
        return [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 10,
          },
        ];
        break;
      case 'UY':
        return [
          {
            incoterm: 'DDP',
            rateServiceCode: 1,
            description: 'Standard',
            daysInTransit: 8,
          },
        ];
        break;

      default:
        break;
    }
  }

  public formatShipment(
    parcelBooking: parcel_bookings,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    firstMileCourier: string,
    cityCode: number,
  ): SkyPostalShipmentRequest {
    try {
      const order: NewRateShipmentReturnDTO = parcelBooking.metadata as any;
      const quote: NewRateShipmentDTO = parcelBooking.quote as any;

      const findDuties = order.services.find(
        (i) => i.name === 'Duties & Taxes',
      );
      const findPickup = order.services.find((i) => i.name === 'Pick-up');
      const findParcelFreight = order.services.find(
        (i) => i.name === 'Parcel Freight',
      );

      const whatsInside = this.formatter.convertPackagesToMetric(quote);

      const totalItemsCost = whatsInside[0].items.reduce(
        (acc, next) => acc + next.price.value,
        0,
      );

      // const merchant: SkyPostalShipmentMerchant = {};
      const senderName = sender?.full_name.split(' ');
      const senderFirstName = senderName[0];
      const senderLastName = sender?.full_name
        .substring(senderFirstName[0].length)
        .trim();

      const shipper: SkyPostalShipmentShipper = {
        name: sender.full_name,
        email: sender.email,
        address: {
          country_iso_code: quote.whereFrom.data.country,
          state_code: 0,
          state_abbreviation: quote.whereFrom.data.state,
          city_code: 0,
          zip_code: quote.whereFrom.data.zipCode,
          address_01: `${quote.whereFrom.data.streetNumber} ${quote.whereFrom.data.street}`,
          address_02: `${quote.whereFrom.data?.additionalAddress}`,
          address_03: null,
        },
        phone: [
          {
            phone_type: 2,
            phone_number: `${sender.phone.countryCode} ${sender.phone.number}`,
          },
        ],
      };

      const receiverName = recipient?.full_name.split(' ');
      const receiverFirstName = receiverName[0];
      const receiverLastName = recipient?.full_name
        .substring(receiverName[0].length)
        .trim();

      const consignee: SkyPostalShipmentConsignee = {
        first_name: receiverFirstName,
        last_name: receiverLastName,
        email: recipient.email,
        id_number: recipient?.tax_id,
        id_search_string:
          quote.whereTo.data.country === 'BR'
            ? `CPF:${recipient?.tax_id}`
            : null,
        address: {
          country_iso_code: quote.whereTo.data.country,
          state_code: 0,
          state_abbreviation: quote.whereTo.data.state,
          city_code: cityCode ?? 0,
          zip_code: quote.whereTo.data.zipCode,
          address_01: `${quote.whereTo.data.street}, ${quote.whereTo.data.streetNumber}`,
          address_02: `${quote.whereTo.data?.additionalAddress}`,
          address_03: null,
        },
        phone: [
          {
            phone_type: 2,
            phone_number: `${recipient.phone.countryCode} ${recipient.phone.number}`,
          },
        ],
      };

      const data: SkyPostalShipmentData = {
        external_tracking: uuidv4(),
        reference_date: format(
          parseISO(quote?.shipDate?.data?.date),
          'yyyy-MM-dd',
        ),
        tax: findDuties?.items[0]?.selected
          ? findDuties?.items[0]?.price?.value
          : null,
        value: totalItemsCost,
        discount: 0,
        freight: findParcelFreight.items[0].price.value,
        currency_iso_code: 'USD',
        dimension_01: whatsInside[0].dimensions.length,
        dimension_02: whatsInside[0].dimensions.width,
        dimension_03: whatsInside[0].dimensions.height,
        dimension_unit: 'CM',
        weight: whatsInside[0].weight?.value,
        weight_unit: 'KG',
        items: quote?.whatsInside?.data[0]?.items.map((i) => ({
          hs_code: i.hts_code,
          family_product: 'OTR',
          serial_number: null,
          description: i.description,
          quantity: i.quantity,
          value: i.price.value / i.quantity,
          weight: 1,
        })),
      };

      const options: SkyPostalShipmentOptionsRequest = {
        include_label_data: true,
        include_label_zpl: false,
        include_label_image: true,
        // include_label_image_format: 'PDF',
        include_label_image_format:
          firstMileCourier?.toLocaleLowerCase() &&
          firstMileCourier?.toLocaleLowerCase() !== 'fedex'
            ? 'PNG'
            : 'PDF',
        zpl_encode_base64: true,
        zpl_label_dpi: 300,
        manifest_type:
          findDuties?.items[0]?.selected || findDuties?.items[0]?.required
            ? 'DDP'
            : 'DDU',
        insurance_code: 0,
        rate_service_code: Number(order.service_code),
        generate_label_default: false,
        return_if_exists: true,
        skip_dims_limit_validation: false,
        skip_weight_limit_validation: false,
      };

      const getBoxId = (countryCode) => {
        let box_id = 967556;

        switch (countryCode) {
          case 'BR':
            return box_id;
            break;
            // case 'CA':
            //   box_id = 967557;
            break;
          case 'CL':
            box_id = 967558;
            break;
          case 'CO':
            box_id = 967559;
            break;
          case 'CR':
            box_id = 967560;
            break;
          case 'MX':
            box_id = 967561;
            break;
          case 'PE':
            box_id = 967562;
            break;

          default:
            break;
        }

        return box_id;
      };

      return {
        user_info: this.generateUserInfo(),
        shipment_info: {
          copa_id: 1360,
          box_id: getBoxId(quote?.whereTo?.data?.country),
          merchant: shipper,
          shipper,
          consignee,
          data,
          options,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async getCityCodeFromCSV(
    getData: SkyPostalGetCityCode,
    cityName?: string,
  ): Promise<string | number> {
    const isoCountry = getData.zip_code_info.country_iso_code;

    if (isoCountry === 'PE' || isoCountry === 'EC' || isoCountry === 'CO') {
      const response = await lastValueFrom(
        this.http.get(
          `https://static.alirok.io/collections/images/${isoCountry}cities.csv`,
          {
            responseType: 'arraybuffer',
          },
        ),
      );

      const csvPromise: string | number = await new Promise(
        (resolve, reject) => {
          parse(
            Buffer.from(response.data, 'binary'),
            { columns: true },
            function (err, rows: SkypostalCSVOtherCountries[]) {
              if (err) return reject(0);
              return resolve(
                rows.find(
                  (i) =>
                    String(i.CITY_NAME).toLowerCase() ===
                    String(cityName).toLowerCase(),
                )?.CITY_CODE ?? 0,
              );
            },
          );
        },
      );

      return csvPromise;
    } else if (isoCountry === 'UY') {
      const response = await lastValueFrom(
        this.http.get(
          `https://static.alirok.io/collections/images/UYcitieszipcodes.csv`,
          {
            responseType: 'arraybuffer',
          },
        ),
      );

      const csvPromise: string | number = await new Promise(
        (resolve, reject) => {
          parse(
            Buffer.from(response.data, 'binary'),
            { columns: true },
            function (err, rows: SkypostalCSVUruguay[]) {
              return resolve(
                rows.find(
                  (i) =>
                    String(i.ZIPCODE) ===
                    String(getData?.zip_code_info?.zip_code),
                )?.CITY_CODE ?? 0,
              );
            },
          );
        },
      );

      return csvPromise;
    } else return 0;
  }
}
