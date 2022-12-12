import { BadRequestException, Injectable } from '@nestjs/common';
import { parseISO } from 'date-fns';
import { DocumentHelperService } from '../../../misc/document-helper/document-helper.service';
import { FormattersService } from '../../../misc/formatters/formatters.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnDeliveryDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnPriceDTO,
  NewRateShipmentReturnServiceDTO,
} from '../../dto/newCouriers.dto';
import {
  UPSDropoffReturn,
  UPSLabels,
  UPSPickup,
  UPSRateRequestQuote,
} from '../interface';

@Injectable()
export class UpsHelperService {
  constructor(
    private readonly formatter: FormattersService,
    private readonly documentHelper: DocumentHelperService,
  ) {}
  public makePackage(
    { whatsInside: { data } }: NewRateShipmentDTO,
    metric = false,
  ) {
    let upsPackages = null;

    if (!metric) {
      upsPackages = data.map((pkg, index: number) => {
        const weightIsLbs = pkg.weight.unit === 'lb';

        const sizeInInches = pkg.dimensions.unit === 'in';

        return Array(Number(pkg.pieces)).fill({
          PackagingType: {
            Code: '02',
            Description: 'Package',
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: 'IN',
            },
            Length: sizeInInches
              ? pkg.dimensions.length.toString()
              : this.formatter
                  .convertCmInInches(pkg.dimensions.length)
                  .toString(),
            Width: sizeInInches
              ? pkg.dimensions.width.toString()
              : this.formatter
                  .convertCmInInches(pkg.dimensions.width)
                  .toString(),
            Height: sizeInInches
              ? pkg.dimensions.height.toString()
              : this.formatter
                  .convertCmInInches(pkg.dimensions.height)
                  .toString(),
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'LBS',
            },
            Weight: weightIsLbs
              ? pkg.weight.value.toString()
              : this.formatter.convertKgsToLbs(pkg.weight.value).toString(),
          },
        });
      });
    } else {
      upsPackages = data.map((pkg, index: number) => {
        const weightIsLbs = pkg.weight.unit === 'lb';

        const sizeInInches = pkg.dimensions.unit === 'in';
        return Array(Number(pkg.pieces)).fill({
          PackagingType: {
            Code: '02',
            Description: 'Package',
          },
          Dimensions: {
            UnitOfMeasurement: {
              Code: 'CM',
            },
            Length: sizeInInches
              ? this.formatter
                  .convertInchesInCM(pkg.dimensions.length)
                  .toString()
              : pkg.dimensions.length.toString(),
            Width: sizeInInches
              ? this.formatter
                  .convertInchesInCM(pkg.dimensions.width)
                  .toString()
              : pkg.dimensions.width.toString(),
            Height: sizeInInches
              ? this.formatter
                  .convertInchesInCM(pkg.dimensions.height)
                  .toString()
              : pkg.dimensions.height.toString(),
          },
          PackageWeight: {
            UnitOfMeasurement: {
              Code: 'KGS',
            },
            Weight: weightIsLbs
              ? this.formatter.convertLbsToKgs(pkg.weight.value).toString()
              : pkg.weight.value.toString(),
          },
        });
      });
    }

    return [].concat(...upsPackages.map((i) => i));
  }

  public async makeUPSLabelPDFDocument(trackings: UPSLabels) {
    const trackingsArray: UPSLabels[] = Array.isArray(trackings)
      ? trackings
      : [trackings];

    const pdfDocument = this.documentHelper;

    const DOC_MARGIN_X = 8.5;
    const DOC_MARGIN_Y = 15;
    const DOC_MAX_WIDTH = 210;
    const DOC_MAX_HEIGHT = 297;

    const DOC_IMAGE_WIDTH = DOC_MAX_WIDTH - DOC_MARGIN_X * 2;
    const DOC_IMAGE_HEIGHT = (DOC_MAX_HEIGHT - DOC_MARGIN_Y * 4) / 2;

    const DOC_IMAGE_POSITIONS = {
      TOP: DOC_MARGIN_Y,
      BOTTOM: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 3,
    };

    for (const [index, tracking] of trackingsArray.entries()) {
      const label = tracking.ShippingLabel.GraphicImage;

      const currentPosition = index % 2 === 0 ? 'TOP' : 'BOTTOM';

      pdfDocument.addImage({
        imageBase64: label,
        format: 'PNG',
        startX: DOC_MARGIN_X,
        startY: DOC_IMAGE_POSITIONS[currentPosition],
        width: DOC_IMAGE_WIDTH,
        height: DOC_IMAGE_HEIGHT,
      });

      if (currentPosition === 'TOP') {
        continue;
      }

      if (currentPosition === 'BOTTOM') {
        pdfDocument.addDashedLine({
          segment: {
            width: 7,
            space: 4,
            start: 0,
          },
          position: {
            startX: DOC_MARGIN_X,
            endX: DOC_MAX_WIDTH - DOC_MARGIN_X,
            startY: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 2,
            endY: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 2,
          },
        });
      }

      if (index < trackingsArray.length - 1) {
        pdfDocument.addPage();
      }
    }

    return pdfDocument.toBase64();
  }

  public makeRateRequest(
    rateData: NewRateShipmentDTO,
    packages: any,
    metric = false,
    serviceCode?: string,
  ) {
    const whereFrom = rateData.whereFrom;
    const whereTo = rateData.whereTo;

    const UnitOfMeasurement = !metric
      ? { Code: 'LBS', Description: 'Pounds' }
      : { Code: 'KGS', Description: 'Kilograms' };

    const isDocument = rateData.type === 'document';
    const DocumentsOnlyIndicator = isDocument ? 'Document' : undefined;

    const originAndDestinationAreDifferent =
      rateData.whereFrom.data.country !== 'US' ||
      rateData.whereFrom.data.country !== rateData.whereTo.data.country;

    const whatsInsideFormatted = !metric
      ? this.formatter.convertPackagesToImperial(rateData)
      : this.formatter.convertPackagesToMetric(rateData);

    const weight = whatsInsideFormatted.reduce(
      (acc, next) => acc + next.weight.value * next.pieces,
      0,
    );

    const payload = {
      RateRequest: {
        Shipment: {
          DocumentsOnlyIndicator,
          Shipper: {
            Name: 'Alirok.com Corp',
            ShipperNumber: 'Y242R5',
            Address: {
              AddressLine: '1395 Brickell ave Ste 900',
              City: 'Miami',
              StateProvinceCode: 'Florida',
              PostalCode: '33131',
              CountryCode: 'US',
            },
          },
          ShipFrom: {
            Address: {
              AddressLine: `${whereFrom.data.street} ${whereFrom.data.streetNumber}`,
              City: whereFrom.data.city,
              StateProvinceCode: whereFrom.data.state,
              PostalCode: whereFrom.data.zipCode,
              CountryCode: whereFrom.data.country,
            },
          },
          ShipTo: {
            Address: {
              AddressLine: `${whereTo.data.street} ${whereTo.data.streetNumber}`,
              City: whereTo.data.city,
              StateProvinceCode: whereTo.data.state,
              PostalCode: whereTo.data.zipCode,
              CountryCode: whereTo.data.country,
            },
          },
          ShipmentTotalWeight: {
            UnitOfMeasurement,
            Weight: weight,
          },
          ShipmentRatingOptions: {
            NegotiatedRatesIndicator: '1',
          },
          ShipmentServiceOptions: {},
          Package: packages,
          PaymentDetails: {
            ShipmentCharge: [
              {
                Type: '01',
                BillShipper: {
                  AccountNumber: 'Y242R5',
                },
              },
              // UPS Taxes and duties
              // {
              //   Type: '02',
              //   BillShipper: {
              //     AccountNumber: 'Y242R5'
              //   }
              // }
            ],
          },
          ...(serviceCode
            ? {
                Service: {
                  Code: serviceCode,
                },
              }
            : {}),
        },
      },
    };

    if (originAndDestinationAreDifferent) {
      payload.RateRequest.Shipment.ShipmentServiceOptions = {
        ...payload.RateRequest.Shipment.ShipmentServiceOptions,
        ImportControlIndicator: 'Y',
        LabelMethod: {
          Code: '04',
          Description: 'ImportControl Electronic Label',
        },
        LabelDelivery: {
          LabelLinksIndicator: 'Y',
        },
      };
    }

    return payload;
  }

  public normalizeRatedShipmentResponse({
    item,
    timeInTransits,
    dropoffAddress,
    pickup,
  }: {
    item: UPSRateRequestQuote['RateResponse']['RatedShipment']['0'];
    timeInTransits?: any;
    dropoffAddress?: UPSDropoffReturn[];
    pickup;
  }): NewRateShipmentReturnDTO {
    const rateTypeDescription = this.getRateTypeDescription(item.Service.Code);

    const timeInTransit = timeInTransits?.find((timeInTransit) =>
      timeInTransit.serviceLevelDescription.startsWith(rateTypeDescription),
    );

    const upsMonetaryValue = Number(
      item.NegotiatedRateCharges.TotalCharge.MonetaryValue,
    );

    const upsCurrency = item.NegotiatedRateCharges.TotalCharge.CurrencyCode;

    if (upsCurrency !== 'USD') {
      throw new BadRequestException('Shipment cost must be in USD!');
    }

    const SHIPPER_PAYS_DUTY_TAX = '378';

    const itemizedCharges = item.ItemizedCharges
      ? Array.isArray(item.ItemizedCharges)
        ? item.ItemizedCharges
        : [item.ItemizedCharges]
      : [];
    const shipperPaysDutyTax = itemizedCharges.find(
      (charge: any) => charge.Code === SHIPPER_PAYS_DUTY_TAX,
    );

    const company: NewRateShipmentReturnDeliveryCarrierDTO = {
      logo_url:
        'https://static.alirok.io/collections/logos/ups_small_official_logo.png',
      name: 'UPS',
      rating: 1,
      drop_off: dropoffAddress,
    };

    const delivery: NewRateShipmentReturnDeliveryDTO = {
      date: timeInTransit?.deliveryDate ?? null,
      days_in_transit:
        item?.GuaranteedDelivery?.BusinessDaysInTransit ??
        timeInTransit?.businessTransitDays ??
        null,
    };

    const price: NewRateShipmentReturnPriceDTO = {
      currency: 'USD',
      value: Number(upsMonetaryValue.toFixed(2)),
    };

    const rate_type = rateTypeDescription;

    const service_code = item.Service.Code;

    const pickupService: NewRateShipmentReturnServiceDTO = {
      company,
      items: [
        {
          description: pickup?.rate_description,
          name: 'Pick-up',
          service_code: pickup?.rate_type,
          price: {
            value: pickup?.total,
            currency: pickup?.currency,
          },
          required: false,
        },
      ],
      name: 'Pick-up',
    };

    const parcelFreightService: NewRateShipmentReturnServiceDTO = {
      company,
      items: [
        {
          description: 'Parcel Freight',
          name: 'Parcel Freight',
          price: price,
          required: true,
        },
      ],
      name: 'Parcel Freight',
    };

    const services: NewRateShipmentReturnServiceDTO[] = [];

    if (pickup?.total) {
      services.push(pickupService);
    }

    services.push(parcelFreightService);

    return {
      company,
      delivery,
      price,
      rate_type,
      service_code,
      services,
      category: 'parcel',
    };
  }
  private getRateTypeDescription(code: string | number) {
    const rateTypesDescription: Record<string | number, string> = {
      '01': 'UPS Next Day Air',
      '02': 'UPS 2nd Day Air',
      '03': 'UPS Ground',
      '07': 'UPS Worldwide Express',
      '08': 'UPS Worldwide Expedited',
      11: 'UPS Standard',
      12: 'UPS 3 Day Select',
      13: 'UPS Next Day Air Saver',
      14: 'UPS Next Day Air Early',
      17: 'UPS® Worldwide Economy DDU',
      54: 'UPS Worldwide Express Plus',
      59: 'UPS 2nd Day Air A.M.',
      65: 'UPS Worldwide Saver',
      72: 'UPS® Worldwide Economy DDP',
      M2: 'UPS First-Class Mail',
      M3: 'UPS Priority Mail',
      M4: 'UPS Expedited Mail Innovations',
    };

    const rateType = rateTypesDescription[code] ?? 'UPS Service';
    return rateType;
  }

  public makeTimeInTransitRequest(
    {
      type,
      whatsInside,
      shipDate,
      whereFrom,
      whereTo,
      currency,
    }: NewRateShipmentDTO,
    metric?: boolean,
  ) {
    return {
      originCountryCode: whereFrom.data.country,
      originStateProvince: whereFrom.data.state,
      originCityName: whereFrom.data.city,
      originPostalCode: whereFrom.data.zipCode,

      destinationCountryCode: whereTo.data.country,
      destinationStateProvince: whereTo.data.state,
      destinationCityName: whereTo.data.city,
      destinationPostalCode: whereTo.data.zipCode,

      weight: whatsInside.data.reduce(
        (acc, next) => acc + next.weight.value * next.pieces,
        0,
      ),
      weightUnitOfMeasure: metric ? 'KGS' : 'LBS',
      shipmentContentsValue: 10,
      shipmentContentsCurrencyCode: currency,
      billType: type === 'document' ? '02' : '03',
      shipDate: this.shipDateFormat(shipDate.data.date),
      shipTime: '08:00:00',
      residentialIndicator:
        whereFrom.data.addressType === 'residential' ? '01' : '02',
      numberOfPackages: whatsInside.data.reduce(
        (acc, next) => acc + next.pieces,
        0,
      ),
      returnUnfilteredServices: false,
      returnHeavyGoodsServices: true,
      dropOffAtFacilityIndicator: 1,
      holdForPickupIndicator: 1,
    };
  }

  private shipDateFormat(date: string) {
    return date.substring(0, 10);
  }

  public makeError(errorCode: number, message: string) {
    return {
      statusCode: 400,
      body: {
        code: errorCode,
        message: message,
      },
    };
  }

  public getByStatus({ code, type }) {
    return ({ status }: any) => {
      let isCodeTrue = false;
      if (code) {
        isCodeTrue = code.some((availableCode) =>
          status.code.includes(availableCode),
        );
      }

      if (isCodeTrue) {
        return true;
      }

      return type.some((availableType) => status.type.includes(availableType));
    };
  }

  public getDeliveryDateByType({ type }, _index, array) {
    return (
      (type === 'SDD' &&
        !array.find((deliveryDate) => deliveryDate.type === 'RDD')) ||
      type === 'RDD'
    );
  }

  public invertArray(array: any[]) {
    const arrayCopy = [...array];
    return arrayCopy.reverse();
  }

  public makePickupRatePayload(body: UPSPickup) {
    return {
      ShipperAccount: {
        AccountNumber: 'Y242R5',
        AccountCountryCode: 'US',
      },
      PickupAddress: {
        AddressLine: body.address.street,
        City: body.address.city,
        StateProvince: body.address.state,
        PostalCode: body.address.postal_code,
        CountryCode: body.address.country,
        ResidentialIndicator: body.address.is_residential_address ? 'Y' : 'N',
      },
      AlternateAddressIndicator: 'Y',
      ServiceDateOption: '03',
      TaxInformationIndicator: 'Y',
      PickupDateInfo: {
        ReadyTime: '0900',
        CloseTime: '1900',
        PickupDate: this.pickupDateFormat(body.pickup_date as any),
      },
    };
  }

  public async makePickupResponseData(rate) {
    const rateDescriptionByType = {
      SD: 'Same-day Pickup',
      FD: 'Future-day Pickup',
    };

    const rateDescription =
      rateDescriptionByType[rate.RateType] ?? 'Not specified';

    const normalizeChargeDetails = Array.isArray(rate.ChargeDetail)
      ? rate.ChargeDetail.map(this.normalizeChargeDetails)
      : [this.normalizeChargeDetails(rate.ChargeDetail)];

    const taxCharges = rate.TaxCharges
      ? [
          this.normalizeChargeDetails({
            ChargeCode: rate.TaxCharges.Type,
            ChargeDescription: 'TAX CHARGES',
            ChargeAmount: rate.TaxCharges.MonetaryValue,
            TaxAmount: '0.00',
          }),
        ]
      : [];

    const chargeDetails = [...normalizeChargeDetails, ...taxCharges];

    const pickupTotal = Number(rate.GrandTotalOfAllCharge);

    if (!pickupTotal) {
      return null;
    }

    if (rate.CurrencyCode !== 'USD') {
      throw new BadRequestException('Pick-up currency must be USD!');
    }

    return {
      rate_type: rate.RateType,
      rate_description: rateDescription,
      currency: rate.CurrencyCode,
      charge_details: chargeDetails,
      total: pickupTotal,
    };
  }

  public pickupDateFormat(date: string) {
    const parsedISODate = parseISO(date);
    return parsedISODate.toISOString().substring(0, 10).replace(/-/g, '');
  }

  public normalizeChargeDetails(charge) {
    return {
      code: charge.ChargeCode,
      description: charge.ChargeDescription,
      amount: Number(charge.ChargeAmount),
      tax_amount: Number(charge.TaxAmount),
    };
  }

  public makeLocatorPayload({ street, city, state, country, postal_code }) {
    return {
      Request: {
        RequestAction: 'Locator',
        RequestOption: '1',
      },
      OriginAddress: {
        AddressKeyFormat: {
          PoliticalDivision2: city,
          PoliticalDivision1: state,
          PostcodePrimaryLow: postal_code,
          CountryCode: country,
        },
      },
      Translate: {
        LanguageCode: 'en_US',
      },
      UnitOfMeasurement: {
        Code: 'MI',
      },
      LocationSearchCriteria: {
        SearchOption: [
          {
            OptionType: {
              Code: '01',
            },
            OptionCode: [
              {
                Code: '000',
              },
            ],
          },
          {
            OptionType: {
              Code: '03',
            },
            OptionCode: {
              Code: '033',
            },
          },
        ],
        MaximumListSize: '5',
      },
      SortCriteria: {
        SortType: '01',
      },
    };
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
        },
      },
    ];
  }

  public handleLocatorErrorsOnRequest({ LocatorResponse }: any) {
    if (LocatorResponse.Response.ResponseStatusDescription !== 'Failure') {
      return;
    }

    const mappedErrors = (errorCode?: string) => {
      switch (errorCode) {
        case '250003':
        case '350106':
        case '350107':
          return this.makeFakeDropOffLocation();
        case '350201':
          return {
            message:
              'Drop-off locations are not found for the selected region.',
          };
        default:
          return {
            message: LocatorResponse.Response.Error.ErrorDescription,
          };
      }
    };

    const errorCode = LocatorResponse.Response.Error.ErrorCode;
    const mappedError = mappedErrors(errorCode);

    return mappedError;
  }

  public makeLocatorResponseData(locations: any) {
    const locationToArray = Array.isArray(locations) ? locations : [locations];
    return locationToArray.map(this.normalizeLocatorData);
  }

  public normalizeLocatorData({ AddressKeyFormat, PhoneNumber }: any) {
    return {
      company_name: AddressKeyFormat.ConsigneeName,
      phone_number: PhoneNumber,
      address: {
        street: AddressKeyFormat.AddressLine.replace(/(&#xD;)+/gi, ' - '),
        city: AddressKeyFormat.PoliticalDivision2,
        state: AddressKeyFormat.PoliticalDivision1,
        postal_code: AddressKeyFormat.PostcodePrimaryLow,
        country: AddressKeyFormat.CountryCode,
      },
    };
  }
}
