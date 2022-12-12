import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parcel_bookings } from '@generated/client';
import { v4 as uuidv4 } from 'uuid';
import {
  addHours,
  format,
  isSaturday,
  isToday,
  parseISO,
  startOfDay,
} from 'date-fns';
import { CheckoutParcelMember } from '../../../checkout/interface/checkout.interface';
import { FormattersService } from '../../../misc/formatters/formatters.service';
import {
  NewRateShipmentAddressDataDTO,
  NewRateShipmentDTO,
  NewRateShipmentReturnDropOffLocationDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
} from '../../dto/newCouriers.dto';
import {
  FedexDropoffLocationsReturn,
  FedexDropoffLocationsReturnRest,
  FedexPickUpAvaibilityRestReturn,
  FedexPickupRequestReturn,
  FedexRatingJson,
  FedexRatingReturnJson,
  FedexRequests,
  FedexRequestsTypes,
  FedexShipmentJson,
} from '../interface/fedex.interface';
import { parseDate } from 'pdf-lib';

const pickupSpecialServices = {
  insidePickup: 'INSIDE_PICKUP',
  insideDelivery: 'INSIDE_DELIVERY',
  liftgateDelivery: 'LIFTGATE_DELIVERY',
  liftgatePickup: 'LIFTGATE_PICKUP',
  limitedAccessDelivery: 'LIMITED_ACCESS_DELIVERY',
  limitedAccessPickup: 'LIMITED_ACCESS_PICKUP',
  saturdayDelivery: 'SATURDAY_DELIVERY',
  saturdayPickup: 'SATURDAY_PICKUP',
  residentialPickup: 'RESIDENTIAL_PICKUP',
  residentialDelivery: 'RESIDENTIAL_DELIVERY',
};

const onlyPickupSpecialServices = [
  'INSIDE_PICKUP',
  'LIFTGATE_PICKUP',
  'LIMITED_ACCESS_PICKUP',
  'RESIDENTIAL_PICKUP',
];

@Injectable()
export class FedexHelperService {
  private FEDEX_API_KEY: string;
  private FEDEX_API_PASSWORD: string;
  private FEDEX_API_ACCOUNT: string;
  private FEDEX_API_METER_NUMBER: string;
  private FEDEX_API_JSON_CLIENT_ID: string;
  private FEDEX_API_JSON_SECRET_KEY: string;
  private ENVIRONMENT: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly formatters: FormattersService,
  ) {
    this.FEDEX_API_KEY = configService.get('FEDEX_API_KEY');
    this.FEDEX_API_PASSWORD = configService.get('FEDEX_API_PASSWORD');
    this.FEDEX_API_ACCOUNT = configService.get('FEDEX_API_ACCOUNT');
    this.FEDEX_API_METER_NUMBER = configService.get('FEDEX_API_METER_NUMBER');
    this.FEDEX_API_JSON_CLIENT_ID = configService.get(
      'FEDEX_API_JSON_CLIENT_ID',
    );
    this.FEDEX_API_JSON_SECRET_KEY = configService.get(
      'FEDEX_API_JSON_SECRET_KEY',
    );
    this.ENVIRONMENT = configService.get('ENVIRONMENT');
  }

  public returnFedexJsonSecrets() {
    return {
      fedexClientId: this.FEDEX_API_JSON_CLIENT_ID,
      fedexSecretKey: this.FEDEX_API_JSON_SECRET_KEY,
    };
  }

  public fedexShipmentPayloadRest(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
    firstMile = false,
    trackingReference = '',
    firstMileCourier = '',
  ): FedexShipmentJson {
    const order: NewRateShipmentReturnDTO = shipmentBody?.metadata as any;
    const rateData: NewRateShipmentDTO = shipmentBody?.quote as any;

    const origin: NewRateShipmentAddressDataDTO = rateData?.whereFrom?.data;
    const destiny: NewRateShipmentAddressDataDTO = rateData?.whereTo?.data;

    const isDomestic = origin?.country === destiny?.country;

    const setAccountNumber: FedexRatingJson['accountNumber'] = {
      value: this.FEDEX_API_ACCOUNT,
    };

    const isPickupRequested = order.services.find((i) => i.name === 'Pick-up')
      ?.items[0]?.selected;

    const setRequestedShipmentShipper: FedexShipmentJson['requestedShipment']['shipper'] =
      {
        address: {
          countryCode: origin.country,
          postalCode: origin.zipCode,
          city: origin.city,
          stateOrProvinceCode: origin.state,
          streetLines: [
            `${origin.streetNumber} ${origin.street}`,
            `${origin.additionalAddress}`,
          ],
        },
        contact: {
          companyName: sender?.company_name ?? sender?.full_name,
          personName: sender?.full_name,
          emailAddress: sender?.email?.substring(0, 80) ?? '',
          phoneNumber:
            origin.country === 'US' || origin.country === 'CA'
              ? sender?.phone?.number?.substring(1, 11)
              : sender?.phone?.number?.substring(0, 15),
        },
        tins: [
          {
            number: sender?.tax_id ?? '',
          },
        ],
      };

    const setRequestedShipmentRecipient: FedexShipmentJson['requestedShipment']['recipients'] =
      [
        {
          address: {
            countryCode: destiny.country,
            postalCode: destiny.zipCode,
            city: destiny.city,
            stateOrProvinceCode: destiny.state,
            streetLines: [
              `${destiny.streetNumber} ${destiny.street}`,
              `${destiny.additionalAddress}`,
            ],
          },
          contact: {
            companyName:
              firstMileCourier === 'skypostal'
                ? 'SKYPOSTAL INC'
                : firstMileCourier === 'bps'
                ? 'BPS - Bringer Parcel Service'
                : recipient?.company_name ?? recipient?.full_name,
            personName: firstMile
              ? trackingReference ?? recipient?.full_name
              : recipient?.full_name,
            emailAddress: recipient?.email?.substring(0, 80) ?? '',
            phoneNumber:
              destiny.country === 'US' || destiny.country === 'CA'
                ? recipient?.phone?.number?.substring(1, 11)
                : recipient?.phone?.number?.substring(0, 15),
          },
          tins: [
            {
              number: recipient?.tax_id ?? '',
            },
          ],
        },
      ];

    const formattedDate = format(
      parseISO(rateData?.shipDate?.data?.date),
      'yyyy-MM-dd',
    );

    const formattedPackageLineItems: FedexRatingJson['requestedShipment']['requestedPackageLineItems'][][] =
      rateData.whatsInside.data.map((i, index: number) => {
        const weightIsLbs = i.weight.unit === 'lb';

        const sizeInInches = i.dimensions.unit === 'in';
        return Array(Number(i.pieces)).fill({
          groupPackageCount: index + 1,
          weight: {
            units: 'LB',
            value: weightIsLbs
              ? i.weight?.value
              : this.formatters.convertKgsToLbs(i.weight.value),
          },
          dimensions: {
            length: sizeInInches
              ? i.dimensions.length
              : this.formatters.convertCmInInches(i.dimensions.length),
            width: sizeInInches
              ? i.dimensions.width
              : this.formatters.convertCmInInches(i.dimensions.width),
            height: sizeInInches
              ? i.dimensions.height
              : this.formatters.convertCmInInches(i.dimensions.height),
            units: 'IN',
          },
        });
      });

    const setRequestedPackageLineItems: FedexRatingJson['requestedShipment']['requestedPackageLineItems'][] =
      [].concat(...formattedPackageLineItems.map((i) => i));

    const setExpressFreightDetail: FedexShipmentJson['requestedShipment']['expressFreightDetail'] =
      {
        bookingConfirmationNumber: uuidv4(),
        shippersLoadAndCount: 1,
      };

    const setLabelSpecification: FedexShipmentJson['requestedShipment']['labelSpecification'] =
      {
        imageType: 'PDF',
        labelStockType: 'PAPER_85X11_TOP_HALF_LABEL',
      };

    const setShippingChargesPayment: FedexShipmentJson['requestedShipment']['shippingChargesPayment'] =
      {
        paymentType: 'SENDER',
      };

    const specialServices = [];

    const choosedQuoteServices = order.services;

    const valueServices = choosedQuoteServices.find(
      (i) => i.name === 'Value Services',
    );

    if (valueServices && rateData.category === 'land') {
      const liftgatePicup = valueServices?.items?.find(
        (i) => i.name === 'Liftgate Service Pickup',
      );

      const limitedAccessPickup = valueServices?.items?.find(
        (i) => i.name === 'Limited Access Service Pickup',
      );

      const residentialPickup = valueServices?.items?.find(
        (i) => i.name === 'Residential Pickup',
      );

      const insidePickup = valueServices?.items?.find(
        (i) => i.name === 'Inside Pickup',
      );

      const lifgateDelivery = valueServices?.items?.find(
        (i) => i.name === 'Liftgate Service Delivery',
      );

      const limitedAccessDelivery = valueServices?.items?.find(
        (i) => i.name === 'Limited Access Service Delivery',
      );

      const residentialDelivery = valueServices?.items?.find(
        (i) => i.name === 'Residential Delivery',
      );
      const insideDelivery = valueServices?.items?.find(
        (i) => i.name === 'Inside Delivery',
      );

      insideDelivery.selected || insideDelivery.required
        ? specialServices.push(pickupSpecialServices.insideDelivery)
        : [];

      residentialDelivery.selected || residentialDelivery.required
        ? specialServices.push(pickupSpecialServices.residentialDelivery)
        : [];

      limitedAccessDelivery.selected || limitedAccessDelivery.required
        ? specialServices.push(pickupSpecialServices.limitedAccessDelivery)
        : [];

      lifgateDelivery.selected || lifgateDelivery.required
        ? specialServices.push(pickupSpecialServices.liftgateDelivery)
        : [];

      liftgatePicup.selected || liftgatePicup.required
        ? specialServices.push(pickupSpecialServices.liftgatePickup)
        : [];

      insidePickup.selected || insidePickup.required
        ? specialServices.push(pickupSpecialServices.insidePickup)
        : [];

      residentialPickup.selected || residentialPickup.required
        ? specialServices.push(pickupSpecialServices.residentialPickup)
        : [];

      limitedAccessPickup.selected || limitedAccessPickup.required
        ? specialServices.push(pickupSpecialServices.limitedAccessPickup)
        : [];
    }

    let pickupRequested = false;

    console.log('specialServices', specialServices);
    console.log('onlyPickupSpecialServices', onlyPickupSpecialServices);

    if (
      specialServices.some((i) => onlyPickupSpecialServices.includes(i)) ||
      isPickupRequested
    ) {
      pickupRequested = true;
    }
    let payload: any = {
      accountNumber: setAccountNumber,
      requestedShipment: {
        blockInsightVisibility: false,
        ...(rateData.category === 'land'
          ? { expressFreightDetail: setExpressFreightDetail }
          : {}),
        packagingType: 'YOUR_PACKAGING',
        labelSpecification: setLabelSpecification,
        pickupType: pickupRequested
          ? 'CONTACT_FEDEX_TO_SCHEDULE'
          : 'DROPOFF_AT_FEDEX_LOCATION',
        recipients: setRequestedShipmentRecipient,
        requestedPackageLineItems: setRequestedPackageLineItems,
        serviceType: firstMile ? 'FEDEX_GROUND' : order?.service_code,
        shipDatestamp: formattedDate,
        shipper: setRequestedShipmentShipper,
        shippingChargesPayment: setShippingChargesPayment,
        ...(specialServices.length
          ? {
              shipmentSpecialServices: {
                specialServiceTypes: specialServices,
              },
            }
          : {}),
      },
      labelResponseOptions: 'LABEL',
      mergeLabelDocOption: 'LABELS_ONLY',
    };

    if (!isDomestic) {
      const allItems = () => {
        let totalItems = 0;
        for (const iterator of rateData.whatsInside.data) {
          totalItems =
            totalItems +
            iterator.items.reduce(
              (acc, curr) => (acc = acc + curr.quantity * iterator.pieces),
              0,
            );
        }
        return totalItems;
      };
      const totalWeight: number = rateData.whatsInside.data
        .map((i) => {
          const weightIsLbs = i.weight.unit === 'lb';

          return {
            weight: weightIsLbs
              ? i.weight.value
              : this.formatters.roundAmount(
                  this.formatters.convertKgsToLbs(i.weight.value) * i.pieces,
                ),
          };
        })
        .reduce((acc, curr) => acc + curr.weight, 0);

      const singleItemWeight = this.formatters.roundAmount(
        totalWeight / allItems(),
      );
      const buildCommodities = rateData?.whatsInside?.data?.map((i) =>
        i.items.map((b) => {
          const commodityWeight = this.formatters.toNetWeight(
            this.formatters.roundAmount(singleItemWeight * b.quantity),
          );

          return {
            unitPrice: {
              amount: this.formatters.roundAmount(b.price?.value / b?.quantity),
              currency: 'USD',
            },
            customsValue: { amount: b.price?.value, currency: 'USD' },
            countryOfManufacture: origin?.country,
            description: b?.description ?? b?.hts_code,
            harmonizedCode: b?.hts_code,
            isDocumentOnly: false,
            quantity: b?.quantity,
            quantityUnits: 'PCS',
            weight: { value: commodityWeight, units: 'LB' },
          };
        }),
      );

      const setCommodities: any = [].concat(...buildCommodities.map((i) => i));

      const setExportDeclaration: FedexRatingJson['requestedShipment']['customsClearanceDetail'] =
        {
          dutiesPayment: {
            paymentType: 'RECIPIENT',
          },
          commodities: setCommodities,
          commercialInvoice: {
            freightCharge: {
              amount: order?.price?.value,
              currency: 'USD',
            },
          },
        };

      payload = {
        ...payload,
        requestedShipment: {
          ...payload.requestedShipment,
          customsClearanceDetail: setExportDeclaration,
          shippingDocumentSpecification: {
            shippingDocumentTypes: ['COMMERCIAL_INVOICE'],
            commercialInvoiceDetail: {
              documentFormat: {
                docType: firstMile ? 'PNG' : 'PDF',
                stockType: 'PAPER_LETTER',
              },
            },
          },
        },
      };
    }

    return payload;
  }

  public fedexQuotePayloadRest(
    serviceType: FedexRequestsTypes,
    rateData: NewRateShipmentDTO,
  ): FedexRatingJson {
    const origin = rateData?.whereFrom?.data;
    const destiny = rateData?.whereTo?.data;

    const isDomestic = origin?.country === destiny?.country;

    const setAccountNumber: FedexRatingJson['accountNumber'] = {
      value: this.FEDEX_API_ACCOUNT,
    };

    const setRequestedShipmentShipper: FedexRatingJson['requestedShipment']['shipper'] =
      {
        address: {
          countryCode: origin.country,
          postalCode: origin.zipCode,
          city: origin.city,
          stateOrProvinceCode: origin.state,
        },
      };

    const setRequestedShipmentRecipient: FedexRatingJson['requestedShipment']['recipient'] =
      {
        address: {
          countryCode: destiny.country,
          postalCode: destiny.zipCode,
          city: destiny.city,
          stateOrProvinceCode: destiny.state,
        },
      };

    const formattedDate = format(
      parseISO(rateData?.shipDate?.data?.date),
      'yyyy-MM-dd',
    );

    const formattedPackageLineItems: FedexRatingJson['requestedShipment']['requestedPackageLineItems'][][] =
      rateData.whatsInside.data.map((i, index: number) => {
        const weightIsLbs = i.weight.unit === 'lb';

        const sizeInInches = i.dimensions.unit === 'in';
        return Array(Number(i.pieces)).fill({
          groupPackageCount: index + 1,
          weight: {
            units: 'LB',
            value: weightIsLbs
              ? i.weight?.value
              : this.formatters.convertKgsToLbs(i.weight.value),
          },
          dimensions: {
            length: sizeInInches
              ? i.dimensions.length
              : this.formatters.convertCmInInches(i.dimensions.length),
            width: sizeInInches
              ? i.dimensions.width
              : this.formatters.convertCmInInches(i.dimensions.width),
            height: sizeInInches
              ? i.dimensions.height
              : this.formatters.convertCmInInches(i.dimensions.height),
            units: 'IN',
          },
        });
      });

    const setRequestedPackageLineItems: any = [].concat(
      ...formattedPackageLineItems.map((i) => i),
    );

    let payload: FedexRatingJson = {
      accountNumber: setAccountNumber,
      requestedShipment: {
        shipper: setRequestedShipmentShipper,
        recipient: setRequestedShipmentRecipient,
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        serviceType: serviceType.serviceCode,
        rateRequestType: ['PREFERRED'],
        preferredCurrency: 'USD',
        shipDateStamp: formattedDate,
        requestedPackageLineItems: setRequestedPackageLineItems,
      },
    };

    if (!isDomestic) {
      const buildCommodities = rateData?.whatsInside?.data?.map((i) =>
        i.items.map((b) => ({
          customsValue: { amount: b.price?.value, currency: 'USD' },
          description: b?.description ?? b?.hts_code,
          harmonizedCode: b?.hts_code,
          isDocumentOnly: false,
          quantity: b?.quantity,
          quantityUnits: 'PCS',
          weight: { value: 1, units: 'LB' },
        })),
      );

      const setCommodities: any = [].concat(...buildCommodities.map((i) => i));

      const setExportDeclaration: FedexRatingJson['requestedShipment']['customsClearanceDetail'] =
        {
          dutiesPayment: {
            paymentType: 'SENDER',
          },

          commodities: setCommodities,
        };

      payload = {
        ...payload,
        requestedShipment: {
          ...payload.requestedShipment,
          customsClearanceDetail: setExportDeclaration,
        },
      };
    }

    return payload;
  }

  public fedexJsonQuoteFormatted(
    fedexData: FedexRatingReturnJson,
    category: 'land' | 'parcel' | 'air',
    serviceType: FedexRequestsTypes,
    drop_off: NewRateShipmentReturnDropOffLocationDTO[],
    pickupAvailability: NewRateShipmentReturnServiceDTO[],
  ): NewRateShipmentReturnDTO {
    try {
      const fedexResponse = fedexData?.output?.rateReplyDetails[0];

      const responseDetails = fedexResponse?.ratedShipmentDetails[0];

      const currencyType = responseDetails.currency;

      if (currencyType !== 'USD') {
        return null;
      }

      const company: NewRateShipmentReturnDTO['company'] = {
        logo_url:
          'https://static.alirok.io/collections/logos/fedex_small_official_logo.png',
        name: 'Fedex',
        rating: 0,
        drop_off,
      };

      const price: NewRateShipmentReturnDTO['price'] = {
        currency: responseDetails.currency,
        value: responseDetails.totalNetCharge,
      };

      const delivery: NewRateShipmentReturnDTO['delivery'] = {
        date: null,
        days_in_transit: serviceType?.transitTime,
      };

      const services: NewRateShipmentReturnDTO['services'] = [
        {
          company,
          name: category === 'parcel' ? 'Parcel Freight' : 'Land Freight',
          items: [
            {
              price,
              drop_off,
              description:
                category === 'parcel' ? 'Parcel Freight' : 'Land Freight',
              name: category === 'parcel' ? 'Parcel Freight' : 'Land Freight',
              required: true,
              service_code: serviceType?.serviceCode,
            },
          ],
        },
      ];

      if (pickupAvailability) {
        services.push(...pickupAvailability);
      }

      return {
        company,
        category,
        price,
        delivery,
        rate_type: serviceType?.rateType,
        service_code: serviceType?.serviceCode,
        services: services.reverse(),
      };
    } catch (error) {
      return error;
    }
  }

  public fedexRequests(rateData: NewRateShipmentDTO): FedexRequests {
    try {
      const services = [];

      const convertedPackages =
        this.formatters.convertPackagesToImperial(rateData);

      const isEachPackage150LbsOrMore = () => {
        let allAboveOr150Lbs = false;

        for (const iterator of convertedPackages) {
          const packageWeight = iterator?.weight?.value;

          if (packageWeight < 150.01) {
            return (allAboveOr150Lbs = false);
          } else return (allAboveOr150Lbs = true);
        }

        return allAboveOr150Lbs;
      };

      const isDomestic =
        rateData?.whereFrom?.data?.country === rateData?.whereTo?.data?.country;

      if (rateData?.category === 'land' && isDomestic) {
        services.push(
          // {
          //   serviceCode: 'FEDEX_FIRST_FREIGHT',
          //   rateType: 'Fedex First Freight',
          //   transitTime: 2,
          // },
          {
            serviceCode: 'FEDEX_1_DAY_FREIGHT',
            rateType: 'Fedex 1 Day Freight',
            transitTime: 2,
          },
          // {
          //   serviceCode: 'FEDEX_2_DAY_FREIGHT',
          //   rateType: 'Fedex 2 Day Freight',
          //   transitTime: 3,
          // },
          // {
          //   serviceCode: 'FEDEX_3_DAY_FREIGHT',
          //   rateType: 'Fedex 3 Day Freight',
          //   transitTime: 4,
          // },
        );
      } else if (rateData?.category === 'parcel' && isDomestic) {
        services.push(
          {
            serviceCode: 'FEDEX_GROUND',
            rateType: 'Fedex Ground',
            transitTime: 5,
          },
          {
            serviceCode: 'FEDEX_2_DAY',
            rateType: 'Fedex 2 Day',
            transitTime: 3,
          },
          // {
          //   serviceCode: 'FEDEX_2_DAY_AM',
          //   rateType: 'Fedex 2 Day AM',
          //   transitTime: 2,
          // },
          // {
          //   serviceCode: 'EXPRESS_SAVER',
          //   rateType: 'Fedex Express Saver',
          //   transitTime: 4,
          // },
        );
      } else if (!isDomestic && rateData?.category === 'parcel') {
        services.push(
          {
            serviceCode: 'INTERNATIONAL_ECONOMY',
            rateType: 'Fedex International Economy',
            transitTime: 12,
          },
          {
            serviceCode: 'INTERNATIONAL_PRIORITY',
            rateType: 'Fedex International Priority',
            transitTime: 7,
          },
        );
      }

      return { services, isParcel: rateData?.category === 'parcel' };
    } catch (error) {
      return error;
    }
  }

  public makeRestDropoffPayload(
    rateData: NewRateShipmentDTO,
    { serviceCode }: FedexRequestsTypes,
  ) {
    const origin = rateData?.whereFrom?.data;

    return {
      locationsSummaryRequestControlParameters: {
        distance: {
          units: 'MI',
          value: 15,
        },
        maxResults: 1,
      },
      location: {
        address: {
          city: origin?.city,
          stateOrProvinceCode: origin?.state,
          postalCode: origin?.zipCode,
          countryCode: origin?.country,
        },
      },
      multipleMatchesAction: 'RETURN_FIRST',
      sort: {
        criteria: 'DISTANCE',
        order: 'ASCENDING',
      },
      locationCapabilities: [
        {
          // carrierCode: serviceCode === 'FEDEX_GROUND' ? 'FDXG' : 'FDXE',
          serviceType: serviceCode,
          transferOfPossessionType: 'DROPOFF',
        },
      ],
    };
  }

  public makeRestPickupRequest(
    rateData: NewRateShipmentDTO,
    { serviceCode }: FedexRequestsTypes,
  ) {
    const origin = rateData?.whereFrom?.data;

    const destination = rateData?.whereTo?.data;

    const formattedFromAddress = `${origin?.streetNumber} ${origin?.street}`;

    const isResidential = origin?.addressType === 'residential';

    const expressOrGround = serviceCode === 'FEDEX_GROUND' ? 'FDXG' : 'FDXE';

    const isInternational =
      origin?.country === destination?.country ? 'DOMESTIC' : 'INTERNATIONAL';

    const parsedISODate = parseISO(rateData?.shipDate?.data?.date);

    const isPickUpToday = isToday(parsedISODate) ? 'SAME_DAY' : 'FUTURE_DAY';

    const formattedDate = format(parsedISODate, 'yyyy-MM-dd');

    return {
      pickupAddress: {
        streetLines: [formattedFromAddress],
        city: origin.city,
        stateOrProvinceCode: origin.state,
        postalCode: origin.zipCode,
        countryCode: origin.country,
        residential: isResidential,
      },
      dispatchDate: formattedDate,
      packageReadyTime: '09:00:00',
      customerCloseTime: '18:00:00',
      pickupRequestType: [isPickUpToday],
      shipmentAttributes: {
        serviceType: serviceCode,
      },
      carriers: [expressOrGround],
      countryRelationship: isInternational,
    };
  }

  public formatDropoffAddresses(
    fdxDropoffs: FedexDropoffLocationsReturnRest,
  ): NewRateShipmentReturnDropOffLocationDTO[] {
    return fdxDropoffs?.output?.locationDetailList?.map(
      ({ contactAndAddress }) => ({
        address: {
          city: contactAndAddress?.address?.city,
          postal_code: contactAndAddress?.address?.postalCode,
          street: contactAndAddress?.address?.streetLines[0],
          country: contactAndAddress?.address?.countryCode,
          state: contactAndAddress?.address?.stateOrProvinceCode,
        },
        company_name: contactAndAddress?.contact?.companyName,
        phone_number: contactAndAddress?.contact?.phoneNumber,
      }),
    );
  }

  public formatPickupAvailabilityRest(
    serviceCode: string,
    formattedDate: string,
    rateData: NewRateShipmentDTO,
    fdxPickupAvailability: FedexPickUpAvaibilityRestReturn,
  ): NewRateShipmentReturnServiceDTO[] {
    console.log('here0');
    const options = fdxPickupAvailability?.output?.options;

    const formattedPackageLineItems: FedexRatingJson['requestedShipment']['requestedPackageLineItems'][][] =
      rateData.whatsInside.data.map((i, index: number) => {
        const weightIsLbs = i.weight.unit === 'lb';

        const sizeInInches = i.dimensions.unit === 'in';
        return Array(Number(i.pieces)).fill({
          groupPackageCount: index + 1,
          weight: {
            units: 'LB',
            value: weightIsLbs
              ? i.weight?.value
              : this.formatters.convertKgsToLbs(i.weight.value),
          },
          dimensions: {
            length: sizeInInches
              ? i.dimensions.length
              : this.formatters.convertCmInInches(i.dimensions.length),
            width: sizeInInches
              ? i.dimensions.width
              : this.formatters.convertCmInInches(i.dimensions.width),
            height: sizeInInches
              ? i.dimensions.height
              : this.formatters.convertCmInInches(i.dimensions.height),
            units: 'IN',
          },
        });
      });

    const lineItems: any = [].concat(
      ...formattedPackageLineItems.map((i) => i),
    );

    // let isPickupAvailable = false;

    // if (rateData?.whereFrom?.data?.addressType === 'residential') {
    //   isPickupAvailable = options?.some(
    //     (i) => i.pickupDate === formattedDate && i.residentialAvailable,
    //   );
    // } else {
    //   isPickupAvailable = options?.some(
    //     (i) => i.pickupDate === formattedDate && i.available,
    //   );
    // }

    const parsedDate = parseISO(rateData?.shipDate?.data?.date);

    const itIsSaturday = isSaturday(parsedDate);

    const services: NewRateShipmentReturnServiceDTO[] = [];

    if (
      serviceCode === 'FEDEX_2_DAY' ||
      serviceCode === 'INTERNATIONAL_ECONOMY' ||
      serviceCode === 'INTERNATIONAL_PRIORITY'
    ) {
      const allItems = () => {
        let totalItems = 0;
        for (const iterator of lineItems) {
          totalItems = totalItems + 1;
        }
        return totalItems;
      };
      services.push({
        company: {
          logo_url:
            'https://static.alirok.io/collections/logos/fedex_small_official_logo.png',
          name: 'Fedex',
          rating: 0,
        },
        name: 'Pick-up',
        items: [
          {
            description: 'Pick-up',
            name: 'Pick-up',
            price: {
              value: allItems() * (itIsSaturday ? 16 : 4),
              currency: 'USD',
            },
            required: false,
          },
        ],
      });
    } else if (
      serviceCode === 'FEDEX_FIRST_FREIGHT' ||
      serviceCode === 'FEDEX_1_DAY_FREIGHT' ||
      serviceCode === 'FEDEX_2_DAY_FREIGHT' ||
      serviceCode === 'FEDEX_3_DAY_FREIGHT'
    ) {
      const allWeight = () => {
        let totalWeight = 0;
        for (const iterator of lineItems) {
          totalWeight = totalWeight + iterator.weight.value;
        }

        return this.formatters.roundAmount(totalWeight);
      };

      const fullWeight = allWeight();

      const hundredweights = this.formatters.roundAmount(fullWeight / 112);

      const totalValuesForFreight = {
        liftgate: this.formatters.roundAmount(hundredweights * 9.81),
        limitedAccess: this.formatters.roundAmount(lineItems.length * 152),
        residentialPickup: this.formatters.roundAmount(lineItems.length * 144),
        insidePickup: this.formatters.roundAmount(hundredweights * 13.29),
      };

      // validate services values

      // Pick-up Services

      const serviceItems = {
        company: {
          logo_url:
            'https://static.alirok.io/collections/logos/fedex_small_official_logo.png',
          name: 'Fedex',
          rating: 0,
        },
        name: 'Value Services',
        items: [],
      };

      if (totalValuesForFreight.liftgate) {
        if (totalValuesForFreight.liftgate < 145) {
          totalValuesForFreight.liftgate = 145;
        }

        if (totalValuesForFreight.liftgate <= 478) {
          serviceItems.items.push({
            description: 'Liftgate ',
            productName: 'Pick-up',
            name: 'Liftgate Service Pickup',
            price: {
              value: totalValuesForFreight.liftgate,
              currency: 'USD',
            },
            required: false,
          });
        }
      }

      if (totalValuesForFreight.limitedAccess) {
        serviceItems.items.push({
          description: 'Limited Access Pickup',
          productName: 'Pick-up',
          name: 'Limited Access Service Pickup',
          price: {
            value: totalValuesForFreight.limitedAccess,
            currency: 'USD',
          },
          required: false,
        });
      }

      if (totalValuesForFreight.residentialPickup) {
        serviceItems.items.push({
          description: 'Residential Pickup',
          productName: 'Pick-up',
          name: 'Residential Pickup',
          price: {
            value: totalValuesForFreight.residentialPickup,
            currency: 'USD',
          },
          required: rateData?.whereFrom?.data?.addressType === 'residential',
        });
      }

      if (totalValuesForFreight.insidePickup) {
        if (totalValuesForFreight.insidePickup < 140) {
          totalValuesForFreight.insidePickup = 140;
        }

        if (totalValuesForFreight.insidePickup <= 1404) {
          serviceItems.items.push({
            description: 'Inside Pickup',
            productName: 'Pick-up',
            name: 'Inside Pickup',
            price: {
              value: totalValuesForFreight.insidePickup,
              currency: 'USD',
            },
            required: false,
          });
        }
      }

      // Delivery Services

      if (totalValuesForFreight.liftgate) {
        if (totalValuesForFreight.liftgate < 145) {
          totalValuesForFreight.liftgate = 145;
        }

        if (totalValuesForFreight.liftgate <= 478) {
          serviceItems.items.push({
            description: 'Liftgate Delivery',
            productName: 'Delivery',
            name: 'Liftgate Service Delivery',
            price: {
              value: totalValuesForFreight.liftgate,
              currency: 'USD',
            },
            required: false,
          });
        }
      }

      if (totalValuesForFreight.limitedAccess) {
        serviceItems.items.push({
          description: 'Limited Access Delivery',
          productName: 'Delivery',
          name: 'Limited Access Service Delivery',
          price: {
            value: totalValuesForFreight.limitedAccess,
            currency: 'USD',
          },
          required: false,
        });
      }

      if (totalValuesForFreight.residentialPickup) {
        serviceItems.items.push({
          description: 'Residential Delivery',
          productName: 'Delivery',
          name: 'Residential Delivery',
          price: {
            value: totalValuesForFreight.residentialPickup,
            currency: 'USD',
          },
          required: rateData?.whereFrom?.data?.addressType === 'residential',
        });
      }

      if (totalValuesForFreight.insidePickup) {
        if (totalValuesForFreight.insidePickup < 140) {
          totalValuesForFreight.insidePickup = 140;
        }

        if (totalValuesForFreight.insidePickup <= 1404) {
          serviceItems.items.push({
            description: 'Inside Delivery',
            productName: 'Delivery',
            name: 'Inside Delivery',
            price: {
              value: totalValuesForFreight.insidePickup,
              currency: 'USD',
            },
            required: false,
          });
        }
      }

      // services.push(serviceItems);
    }

    return true ? services : null;
  }

  public makeFedexCancelShipmentPayload(
    originCountry: string,
    trackingNumber: string,
  ) {
    return {
      accountNumber: {
        value: this.FEDEX_API_ACCOUNT,
      },
      senderCountryCode: originCountry,
      deletionControl: 'DELETE_ALL_PACKAGES',
      trackingNumber: trackingNumber,
    };
  }

  public makePickupRequestPayload(
    order: NewRateShipmentReturnDTO,
    quote: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    bookingNumber?: string,
  ) {
    try {
      const whereFrom = quote.whereFrom.data;
      const whatsInside = quote.whatsInside.data[0];

      const needLiftgate =
        order.services
          .find((i) => i.name === 'Value Services')
          ?.items?.find((i) => i?.name === 'Liftgate Service Pickup')
          ?.selected ||
        order.services
          .find((i) => i.name === 'Value Services')
          ?.items?.find((i) => i?.name === 'Liftgate Service Pickup')?.required;

      const readyTimeDate =
        addHours(startOfDay(parseISO(quote.shipDate.data.date)), 6)
          .toISOString()
          .split('.')[0] + 'Z';

      return {
        associatedAccountNumber: {
          value: this.FEDEX_API_ACCOUNT,
        },
        originDetail: {
          pickupLocation: {
            contact: {
              personName: sender.full_name,
              phoneNumber: sender.phone.number,
            },
            address: {
              streetLines: [`${whereFrom.streetNumber} ${whereFrom.street}`],
              city: whereFrom.city,
              stateOrProvinceCode: whereFrom.state,
              postalCode: whereFrom.zipCode,
              countryCode: whereFrom.country,
            },
          },
          pickupDateType: isToday(parseISO(quote.shipDate.data.date))
            ? 'SAME_DAY'
            : 'FUTURE_DAY',
          readyDateTimestamp: readyTimeDate,
          customerCloseTime: '17:00:00',
        },
        carrierCode: 'FDXE',
        ...(quote.category === 'land'
          ? {
              expressFreightDetail: {
                truckType: needLiftgate ? 'LIFTGATE' : 'TRACTOR_TRAILER_ACCESS',
                service: order.service_code,
                bookingNumber,
                dimensions: {
                  length: whatsInside.dimensions.length,
                  width: whatsInside.dimensions.width,
                  units: whatsInside.dimensions.unit === 'cm' ? 'CM' : 'IN',
                  height: whatsInside.dimensions.height,
                },
              },
            }
          : {}),
      };
    } catch (error) {
      throw error;
    }
  }

  public makeFedexPickUpCancelPayload(
    pickupData: FedexPickupRequestReturn,
    date: string,
  ) {
    return {
      associatedAccountNumber: {
        value: this.FEDEX_API_ACCOUNT,
      },
      pickupConfirmationCode: pickupData.output.pickupConfirmationCode,
      carrierCode: 'FDXE',
      scheduledDate: date,
      location: pickupData.output.location,
    };
  }
}
