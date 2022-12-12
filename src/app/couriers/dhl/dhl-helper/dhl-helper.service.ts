import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FindDropoffsDTO, FindDropoffsReturnDTO } from '../../dto/couriers.dto';
import {
  DHLCreateCreateShipmentCustomerDetails,
  DHLCreateCreateShipmentCustomerDetailsReceiverDetails,
  DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers,
  DHLCreateCreateShipmentCustomerDetailsShiperDetails,
  DHLCreateShipment,
  DHLCreateShipmentContent,
  DHLCreateShipmentContentExportDeclaration,
  DHLCreateShipmentContentExportDeclarationLineItem,
  DHLCreateShipmentContentPackage,
  DHLCreateShipmentOutputImageProperties,
  DHLCreateShipmentPickUp,
  DHLCreateShipmentRequestBody,
  DHLCreateShipmentValueAdded,
  DHLDropoffLocations,
  DHLRateRequestBody,
  DHLRateRequestBodyCustomerDetailsReceiverDetails,
  DHLRateRequestBodyCustomerDetailsShipperDetails,
  DHLRateRequestBodyValueAddedServices,
  DHLRateRequestProductsReturn,
} from '../interface/dhl.interface';
import { lastValueFrom } from 'rxjs';
import { addHours, formatISO, parseISO } from 'date-fns';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnDeliveryDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnPriceDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentWhatsInsideDataDTO,
  NewRateShipmentWhatsInsideDataItemsDTO,
} from '../../dto/newCouriers.dto';
import { CheckoutParcelMember } from '../../../../app/checkout/interface/checkout.interface';
import { FormattersService } from '../../../misc/formatters/formatters.service';

@Injectable()
export class DhlHelperService {
  private importNumber: string;
  private exportNumber: string;
  private isProduction: boolean;
  constructor(
    private readonly configService: ConfigService,
    private readonly formatters: FormattersService,
    private readonly http: HttpService,
  ) {
    this.importNumber = configService.get<string>('DHL_API_IMPORT_NUMBER');
    this.exportNumber = configService.get<string>('DHL_API_EXPORT_NUMBER');
    this.isProduction = configService.get<string>('NODE_ENV') === 'production';
  }

  public makeDHLQuoteBody(
    body: NewRateShipmentDTO,
    accountNumber: string,
    serviceCode?: string,
  ): DHLRateRequestBody {
    const accounts = [
      {
        typeCode: 'shipper',
        number: accountNumber,
      },
    ];

    const whereFrom = body.whereFrom;
    const whereTo = body.whereTo;

    let packages: any = body.whatsInside.data.map((i, index: number) => {
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
        weight: Number(
          weightIsLbs
            ? this.formatters.convertLbsToKgs(i.weight.value)
            : i.weight.value,
        ),
      });
    });

    packages = [].concat(...packages.map((i: any) => i));

    const shipperDetails: DHLRateRequestBodyCustomerDetailsShipperDetails = {
      countryCode: whereFrom.data.country,
      postalCode: whereFrom.data.zipCode,
      cityName: whereFrom.data.city,
      provinceCode: whereFrom.data.state,
      addressLine1: whereFrom.data.street + whereFrom.data.streetNumber,
    };

    const receiverDetails: DHLRateRequestBodyCustomerDetailsReceiverDetails = {
      countryCode: whereTo.data.country,
      postalCode: whereTo.data.zipCode,
      cityName: whereTo.data.city,
      provinceCode: whereTo.data.state,
      addressLine1: whereTo.data.street + whereTo.data.streetNumber,
    };

    const valueAddedServices: DHLRateRequestBodyValueAddedServices[] = [
      {
        serviceCode: 'PX',
        localServiceCode: 'PX',
      },
    ];

    if (whereFrom?.data?.country !== whereTo?.data?.country) {
      let totalItemsPrice = 0;
      
      if (body?.category === 'air') {
        totalItemsPrice += Number(body?.description?.price.value);
      } else {
        body?.whatsInside?.data?.forEach((i) => {
          i.items.forEach((a) => {
            totalItemsPrice += Number(a?.price.value);
          });
        });
      }     

      totalItemsPrice > 0 &&
        valueAddedServices.push({
          serviceCode: 'II',
          localServiceCode: 'II',
          value: totalItemsPrice,
          currency: 'USD',
        });
    }

    const fullBody: DHLRateRequestBody = {
      customerDetails: { receiverDetails, shipperDetails },
      plannedShippingDateAndTime: body.shipDate.data.date,
      unitOfMeasurement: 'metric',
      valueAddedServices,
      isCustomsDeclarable: true,
      packages,
      accounts,
    };

    if (serviceCode) {
      fullBody.productCode = serviceCode;
    }

    return fullBody;
  }

  public getDHLRateType(
    originCountryCode: string,
    destinationCountryCode: string,
  ): string {
    const accountNumber =
      originCountryCode !== 'US' ? this.importNumber : this.exportNumber;

    return accountNumber;
  }

  public handleDHLError(error: any) {
    const dhlError = error?.response?.data;
    if (!dhlError)
      throw new BadRequestException({
        message: 'An unexpected error occurred',
      });

    const { title, message, detail, status, additionalDetails } = dhlError;
    throw new BadRequestException({
      title,
      message,
      detail,
      errors: additionalDetails,
    });
  }

  public formatDHLDomesticQuoteReponse(
    quote: NewRateShipmentDTO,
    product: DHLRateRequestProductsReturn,
    dropoffAddress: FindDropoffsReturnDTO[],
  ): NewRateShipmentReturnDTO {
    const daysAbbreviation = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

    let currencyPrice = product.totalPrice.find(
      (price) =>
        price.currencyType === 'BILLC' && price.priceCurrency === 'USD',
    );

    if (!currencyPrice) {
      currencyPrice = product.totalPrice[0];
    }

    const dateAndTime =
      product.deliveryCapabilities.estimatedDeliveryDateAndTime.split('T');

    const company: NewRateShipmentReturnDeliveryCarrierDTO = {
      logo_url:
        'https://static.alirok.io/collections/logos/dhl_small_official_logo.png',
      name: 'DHL',
      rating: 1,
      drop_off: dropoffAddress,
    };

    const delivery: NewRateShipmentReturnDeliveryDTO = {
      date: dateAndTime[0] ?? null,
      days_in_transit: product?.deliveryCapabilities?.totalTransitDays ?? null,
    };

    const price: NewRateShipmentReturnPriceDTO = {
      currency: 'USD',
      value: Number(currencyPrice.price.toFixed(2)),
    };

    const rate_type = product.productName;

    const service_code = product.productCode;

    return {
      category: quote?.category,
      company,
      delivery,
      price,
      rate_type,
      service_code,
      services: quote?.category === 'air' 
      ? this.makeAirDhlServices(
        quote?.whereFrom?.data?.country,
        product,
        dropoffAddress,
        company,
        price,
      ) : this.makeparcelDhlServices(
        quote?.whereFrom?.data?.country,
        product,
        dropoffAddress,
        company,
        price,
      ),
    };
  }

  public makeparcelDhlServices(
    origin: string,
    product: DHLRateRequestProductsReturn,
    dropoffAddress: FindDropoffsReturnDTO[],
    company: NewRateShipmentReturnDeliveryCarrierDTO,
    freightPrice: NewRateShipmentReturnPriceDTO,
  ) {
    const priceBreakDown = product?.detailedPriceBreakdown?.find(
      (i) => i.currencyType === 'BILLC',
    )?.breakdown;

    const services: NewRateShipmentReturnServiceDTO[] = [
      {
        company,
        items: [
          {
            description: 'Parcel Freight',
            name: 'Parcel Freight',
            price: freightPrice,
            required: true,
          },
        ],
        name: 'Parcel Freight',
      },
    ];

    const isThereInsurance = priceBreakDown?.find(
      (i) => i?.serviceCode === 'II',
    );

    if (isThereInsurance && isThereInsurance?.price) {
      services.push({
        company,
        items: [
          {
            description: 'Insurance',
            name: 'Insurance',
            price: {
              currency: 'USD',
              value: Number(isThereInsurance.price),
            },
            required: false,
          },
        ],
        name: 'Insurance',
      });
    }

    const isTherePickup = priceBreakDown?.find((i) => i?.serviceCode === 'PX');

    if (isTherePickup) {
      services.push({
        company,
        items: [
          {
            description: 'Pick-up',
            name: 'Pick-up',
            price: {
              currency: 'USD',
              value: Number(isTherePickup?.price),
            },
            required: false,
          },
        ],
        name: 'Pick-up',
      });
    } else if (
      !isTherePickup &&
      product?.pickupCapabilities?.originServiceAreaCode &&
      origin === 'US'
    ) {
      services.push({
        company,
        items: [
          {
            description: 'Pick-up',
            name: 'Pick-up',
            price: {
              currency: 'USD',
              value: 5.4,
            },
            required: false,
          },
        ],
        name: 'Pick-up',
      });
    }

    return services?.reverse();
  }

  public makeAirDhlServices(
    origin: string,
    product: DHLRateRequestProductsReturn,
    dropoffAddress: FindDropoffsReturnDTO[],
    company: NewRateShipmentReturnDeliveryCarrierDTO,
    freightPrice: NewRateShipmentReturnPriceDTO,
  ) {
    const priceBreakDown = product?.detailedPriceBreakdown?.find(
      (i) => i.currencyType === 'BILLC',
    )?.breakdown;

    const services: NewRateShipmentReturnServiceDTO[] = [
      {
        company,
        items: [
          {
            description: 'Air Freight',
            name: 'Air Freight',
            price: freightPrice,
            required: true,
          },
        ],
        name: 'Air Freight',
      },
    ];

    const isThereInsurance = priceBreakDown?.find(
      (i) => i?.serviceCode === 'II',
    );

    if (isThereInsurance && isThereInsurance?.price) {
      services.push({
        company,
        items: [
          {
            description: 'Insurance',
            name: 'Insurance',
            price: {
              currency: 'USD',
              value: Number(isThereInsurance.price),
            },
            required: false,
          },
        ],
        name: 'Insurance',
      });
    }

    const isTherePickup = priceBreakDown?.find((i) => i?.serviceCode === 'PX');

    if (isTherePickup) {
      services.push({
        company,
        items: [
          {
            description: 'Pick-up',
            name: 'Pick-up',
            price: {
              currency: 'USD',
              value: Number(isTherePickup?.price),
            },
            required: false,
          },
        ],
        name: 'Pick-up',
      });
    } else if (
      !isTherePickup &&
      product?.pickupCapabilities?.originServiceAreaCode &&
      origin === 'US'
    ) {
      services.push({
        company,
        items: [
          {
            description: 'Pick-up',
            name: 'Pick-up',
            price: {
              currency: 'USD',
              value: 5.4,
            },
            required: false,
          },
        ],
        name: 'Pick-up',
      });
    }

    return services?.reverse();
  }

  public makeLocatorPayload({
    street,
    city,
    state,
    country,
    postal_code,
    address,
    is_residential_address,
    street_number,
  }: FindDropoffsDTO) {
    return {
      countryCode: country,
      addressLocality: city,
      postalCode: postal_code,
      streetAddress: street,
      radius: '25000',
      limit: 15,
    };
  }

  public makeFakeDropOffLocation() {
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

  public handleErrorsOnRequest(response: DHLDropoffLocations) {
    if (response?.locations?.length > 0) {
      return false;
    } else {
      if (response?.locations) {
        return new BadRequestException({
          message: 'Drop-off locations not found for this address',
        });
      } else {
        return new BadRequestException({
          message: response?.title + response?.detail,
        });
      }
    }
  }

  public makeResponseData(locations: DHLDropoffLocations) {
    return locations.locations.map((i) => ({
      company_name: i.name,
      phone_number: 'not available',
      address: {
        street: i.place?.address?.streetAddress,
        city: i.place?.address?.addressLocality,
        state: '',
        postal_code: i.place?.address?.postalCode,
        country: i.place?.address?.countryCode,
      },
    }));
  }

  public inputAdapterCreateShipment = async ({
    sender,
    recipient,
    quote,
    order,
    parcel_serial_number: parcelSerialNumber,
  }: DHLCreateShipmentRequestBody) => {
    const productCode = this.isProduction
      ? order.service_code
      : quote.whereFrom.data.country === quote.whereTo.data.country
      ? 'N'
      : 'P';
    const localProductCode = this.isProduction
      ? order.service_code
      : quote.whereFrom.data.country === quote.whereTo.data.country
      ? 'N'
      : 'P';
    const dateWithOneHour = formatISO(
      addHours(parseISO(quote.shipDate.data.date as any), 4),
    );

    const formattedDate = dateWithOneHour.split('T')[0];
    const formattedTime = dateWithOneHour.split('T')[1].split('-')[0];
    const formatteDDateTimeWithGMT = `${formattedDate}T${formattedTime}GMT+00:00`;

    const { whereFrom, whereTo } = quote;

    const details = this.createCustomerDetails(quote, sender, recipient);

    const isPickupRequested = order.services.find((i) => i.name === 'Pick-up')
      ?.items[0]?.selected;

    const isInsuranceRequested = order.services.find(
      (i) => i.name === 'Insurance',
    )?.items[0]?.selected;

    const isDutiesRequested = order.services.find(
      (i) => i.name === 'Duties & Taxes',
    )?.items[0]?.selected;

    const shipmentBody: DHLCreateShipment = {
      plannedShippingDateAndTime: formatteDDateTimeWithGMT.replace('Z', ''),
      productCode: String(productCode),
      localProductCode: String(localProductCode),
      customerDetails: {
        shipperDetails: details.shipperDetails,
        receiverDetails: details.receiverDetails,
      },
      valueAddedServices: this.createValueAddedServices({
        quote,
        insurance: isInsuranceRequested,
        pickup: isPickupRequested,
        duties: isDutiesRequested,
      }),
      accounts: [...this.createShipperAccount(quote, sender, recipient)],
      content: this.createContent(quote, sender, recipient, parcelSerialNumber),
      pickup: this.createPickUp(
        isPickupRequested,
        quote,
        details.shipperDetails,
      ),
      outputImageProperties: await this.createOutputImageProperties(
        whereFrom.data.country,
        whereTo.data.country,
      ),
    };

    return shipmentBody;
  };

  private createValueAddedServices({
    quote,
    insurance,
    pickup,
    duties,
  }: {
    quote: NewRateShipmentDTO;
    insurance: boolean;
    pickup: boolean;
    duties: boolean;
  }): DHLCreateShipmentValueAdded[] {
    const services: DHLCreateShipmentValueAdded[] = [];

    if (insurance) {
      let totalItemsPrice = 0;

      quote?.whatsInside?.data?.forEach((i) => {
        i.items.forEach((a) => {
          totalItemsPrice += Number(a?.price.value);
        });
      });

      totalItemsPrice > 0 &&
        services.push({
          serviceCode: 'II',
          value: totalItemsPrice,
          currency: 'USD',
        });
    }

    return services;
  }

  private createCustomerDetails(
    quote: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ): DHLCreateCreateShipmentCustomerDetails {
    const { whereFrom, whereTo } = quote;

    const isDomestic = whereFrom.data.country === whereFrom.data.country;

    let shipperDetails: DHLCreateCreateShipmentCustomerDetailsShiperDetails = {
      postalAddress: {
        postalCode: whereFrom.data.zipCode,
        cityName: whereFrom.data.city,
        countryCode: whereFrom.data.country,
        provinceCode: whereFrom.data.state,
        addressLine1: `${whereFrom.data.street} ${whereFrom.data.streetNumber}`,
      },
      contactInformation: {
        email: sender.email,
        phone: `${String(sender.phone.countryCode)}${String(
          sender.phone.number,
        )}`,
        companyName: recipient?.company_name.length
          ? recipient?.company_name
          : recipient?.full_name,
        fullName: sender.full_name,
      },
    };

    if (!isDomestic) {
      const registrationNumber: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers =
        {
          issuerCountryCode: whereTo.data.country,
          typeCode: 'VAT',
          number: recipient.tax_id,
        };

      shipperDetails = {
        ...shipperDetails,
        registrationNumbers: [registrationNumber],
      };
    }

    let receiverDetails: DHLCreateCreateShipmentCustomerDetailsReceiverDetails =
      {
        postalAddress: {
          postalCode: whereTo.data.zipCode,
          cityName: whereTo.data.city,
          countryCode: whereTo.data.country,
          provinceCode: whereTo.data.state,
          addressLine1: `${whereTo.data.street} ${whereTo.data.streetNumber}`,
        },
        contactInformation: {
          email: recipient.email,
          phone: `${String(recipient.phone.countryCode)}${String(
            recipient.phone.number,
          )}`,
          companyName: recipient?.company_name.length
            ? recipient?.company_name
            : recipient?.full_name,
          fullName: recipient.full_name,
        },
      };

    if (!isDomestic) {
      const registrationNumber: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers =
        {
          issuerCountryCode: whereTo.data.country,
          typeCode: 'VAT',
          number: recipient.tax_id,
        };

      receiverDetails = {
        ...receiverDetails,
        registrationNumbers: [registrationNumber],
      };
    }

    return { shipperDetails, receiverDetails };
  }

  private createShipperAccount = (
    { whereFrom, whereTo }: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ) => {
    const isDomestic = whereFrom.data.country === whereFrom.data.country;

    const accountNumber =
      whereFrom.data.country !== 'US' ? this.importNumber : this.exportNumber;

    const accounts = [
      {
        typeCode: 'shipper',
        number: accountNumber,
      },
    ];

    if (!isDomestic) {
      //Must have incoterm DDP logic when taxes are paid
    }

    return accounts;
  };

  private createPickUp(
    requested: boolean,
    quote: NewRateShipmentDTO,
    details: DHLCreateCreateShipmentCustomerDetailsShiperDetails,
  ): DHLCreateShipmentPickUp {
    let pickupRequested: DHLCreateShipmentPickUp;

    if (requested) {
      pickupRequested = {
        isRequested: true,
        pickupDetails: {
          postalAddress: details?.postalAddress,
          contactInformation: details?.contactInformation,
        },
      };
    } else {
      pickupRequested = {
        isRequested: false,
      };
    }

    return pickupRequested;
  }

  private createOutputImageProperties = async (
    origin: string,
    destiny: string,
  ): Promise<DHLCreateShipmentOutputImageProperties> => {
    const isDomestic = origin === destiny;

    let imageOptions: DHLCreateShipmentOutputImageProperties = {
      printerDPI: 300,
      encodingFormat: 'pdf',
      // customerLogos: await this.loadCustomerLogo(),
      splitTransportAndWaybillDocLabels: false,
      allDocumentsInOneImage: false,
      splitDocumentsByPages: false,
      splitInvoiceAndReceipt: true,
    };

    if (isDomestic) {
      imageOptions = {
        ...imageOptions,
        imageOptions: [
          {
            typeCode: 'invoice',
            templateName: 'COMMERCIAL_INVOICE_03',
            isRequested: false,
            invoiceType: 'commercial',
            languageCode: 'eng',
          },
        ],
      };
    } else {
      imageOptions = {
        ...imageOptions,
        imageOptions: [
          {
            typeCode: 'invoice',
            templateName: 'COMMERCIAL_INVOICE_03',
            isRequested: true,
            invoiceType: 'commercial',
            languageCode: 'eng',
          },
        ],
      };
    }

    return imageOptions;
  };

  private createContent(
    quote: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    parcelSerialNumber: string | number,
  ): DHLCreateShipmentContent {
    const isCustomsDeclarable =
      quote.whereFrom.data.country !== quote.whereTo.data.country;

    const description = 'Shipment';

    let content: DHLCreateShipmentContent = {
      isCustomsDeclarable: isCustomsDeclarable,
      description,
      packages: this.createPackages(quote, sender, recipient),
      unitOfMeasurement: 'metric',
      incoterm: 'DPU',
    };

    if (isCustomsDeclarable) {
      const incoterm:
        | 'EXW'
        | 'FCA'
        | 'CPT'
        | 'CIP'
        | 'DPU'
        | 'DAP'
        | 'DDP'
        | 'FAS'
        | 'FOB'
        | 'CFR'
        | 'CIF' = 'DPU';

      const declaredValue = quote.whatsInside.data.reduce(
        (acc: number, curr: NewRateShipmentWhatsInsideDataDTO) => {
          const itemsValue = curr.items.reduce(
            (acc: number, curr: NewRateShipmentWhatsInsideDataItemsDTO) =>
              acc + Number(curr.price.value) * Number(curr.quantity),
            0,
          );
          return acc + Number(itemsValue);
        },
        0,
      );

      const declaredValueCurrency = 'USD';

      const exportDeclaration = this.createExportDeclaration(
        quote,
        sender,
        parcelSerialNumber,
      );

      const mappedItems = quote.whatsInside.data
        .map((pkg) => ({
          item: pkg.items.reduce(
            (acc: string, curr: NewRateShipmentWhatsInsideDataItemsDTO) =>
              `${acc}, ${String(curr.hts_code)}`,
            '',
          ),
        }))
        .reduce((acc: string, curr: any) => `${acc}, ${String(curr.item)}`, '');

      content = {
        ...content,
        incoterm,
        description: mappedItems.substr(0, 68),
        declaredValue,
        declaredValueCurrency,
        exportDeclaration,
      };
    }

    return content;
  }

  public createPackages(
    quote: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ): DHLCreateShipmentContentPackage[] {
    const packages: DHLCreateShipmentContentPackage[][] =
      quote.whatsInside.data.map((pkg, index: number) => {
        const weightIsLbs = pkg.weight.unit === 'lb';

        const sizeInInches = pkg.dimensions.unit === 'in';
        let description = 'not declarable';
        if (quote.whereFrom.data.country !== quote.whereTo.data.country) {
          description = pkg.items.reduce(
            (acc: string, curr) => `${acc}, ${String(curr?.description)}`,
            '',
          );
        }
        return Array(Number(pkg.pieces)).fill({
          description: description.substr(0, 68),
          weight: Number(
            weightIsLbs
              ? this.formatters.convertLbsToKgs(pkg.weight.value)
              : pkg.weight.value,
          ),
          labelDescription: String(sender.full_name).substring(0, 78),
          dimensions: {
            height: Number(
              sizeInInches
                ? this.formatters.convertInchesInCM(pkg.dimensions.height)
                : pkg.dimensions.height,
            ),
            length: Number(
              sizeInInches
                ? this.formatters.convertInchesInCM(pkg.dimensions.length)
                : pkg.dimensions.length,
            ),
            width: Number(
              sizeInInches
                ? this.formatters.convertInchesInCM(pkg.dimensions.width)
                : pkg.dimensions.width,
            ),
          },
        });
      });

    const flattenPackage = [].concat(...packages.map((i) => i));

    return flattenPackage;
  }

  public createExportDeclaration = (
    quote: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    parcelSerialNumber,
  ): DHLCreateShipmentContentExportDeclaration => {
    const invoice = {
      number: String(parcelSerialNumber),
      date: new Date().toISOString().split('T')[0],
      signatureName: sender.full_name,
      signatureTitle: sender.full_name,
    };

    return {
      invoice: invoice,
      exportReason: quote.whatsInside?.data[0]?.purpose,
      exportReasonType: this.formatExportType(
        quote.whatsInside?.data[0]?.purpose,
      ),
      lineItems: this.createLineItems(quote, parcelSerialNumber),
    };
  };

  public createLineItems(
    quote: NewRateShipmentDTO,
    parcelSerialNumber: string | number,
  ): DHLCreateShipmentContentExportDeclarationLineItem[] {
    const itemsTypeAmount: number = quote.whatsInside.data
      .map((i) => ({
        amount: i.pieces,
      }))
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalWeight: number = quote.whatsInside.data
      .map((i) => {
        const weightIsLbs = i.weight.unit === 'lb';

        return {
          weight: weightIsLbs
            ? this.formatters.convertLbsToKgs(i.weight.value) * i.pieces
            : i.weight.value * i.pieces,
        };
      })
      .reduce((acc, curr) => acc + curr.weight, 0);

    const lineItems: DHLCreateShipmentContentExportDeclarationLineItem[][] =
      quote.whatsInside?.data?.map((shipPackage) => {
        return shipPackage.items.map((item) => {
          const weightIsLbs = shipPackage.weight.unit === 'lb';
          const lineItemDescription = item.description
            ? item.description
            : item.hts_code;

          const netWeight = weightIsLbs
            ? this.formatters.toNetWeight(
                Math.round(
                  (Number(totalWeight) / itemsTypeAmount + Number.EPSILON) *
                    100,
                ) / 100,
              )
            : this.formatters.toNetWeight(
                Math.round(
                  (Number(totalWeight) / itemsTypeAmount + Number.EPSILON) *
                    100,
                ) / 100,
              );

          const grossWeight = weightIsLbs
            ? Math.round(
                (Number(totalWeight) / itemsTypeAmount + Number.EPSILON) * 100,
              ) / 100
            : Math.round(
                (Number(totalWeight) / itemsTypeAmount + Number.EPSILON) * 100,
              ) / 100;

          return {
            number: Number(shipPackage.items.indexOf(item)) + 1,
            description: lineItemDescription.substr(0, 68),
            price:
              Math.round(
                (Number(item.price?.value) / Number(item?.quantity)) * 100,
              ) / 100,
            priceCurrency: 'USD',
            manufacturerCountry: quote.whereFrom.data.country,
            weight: {
              netValue: netWeight,
              grossValue: grossWeight,
            },
            quantity: {
              value: Number(item.quantity),
              unitOfMeasurement: 'PCS',
            },
            commodityCodes: [
              {
                typeCode: 'outbound',
                value: item.hts_code.replace('.', ''),
              },
            ],
          };
        });
      });

    const flattedArray = [].concat(...lineItems.map((i) => i));

    return flattedArray;
  }

  private formatExportType(reason: string) {
    switch (reason) {
      case 'gift':
        return 'gift';
        break;
      case 'return':
        return 'return';
        break;
      case 'commercial':
        return 'commercial_purpose_or_sale';
        break;
      case 'personal':
        return 'personal_belongings_or_personal_use';
        break;

      default:
        return 'permanent';
        break;
    }
  }

  private loadCustomerLogo = async () => {
    const response = await lastValueFrom(
      this.http.get('https://static.alirok.io/imgs/logo.png'),
    );

    const base64 =
      'data:' +
      response.headers['content-type'] +
      ';base64,' +
      Buffer.from(response.data).toString('base64');

    const customerLogo: DHLCreateShipmentOutputImageProperties['customerLogos'] =
      [
        {
          fileFormat: 'PNG',
          content: base64,
        },
      ];

    return customerLogo;
  };

  // public async createLandedCost(
  //   quote: NewRateShipmentDTO,
  //   order: NewRateShipmentReturnDTO
  // ): DHLLandedCostRequest {

  //   const payload: DHLLandedCostRequest = {
  //     accounts: [      {
  //       typeCode: 'shipper',
  //       number: this.getDHLRateType(
  //         quote?.whereFrom?.data?.country,
  //         quote?.whereTo?.data?.country,
  //       ),
  //     }],
  //     currencyCode: "USD",
  //     customerDetails:{receiverDetails:{      countryCode: quote?.whereTo.data.country,
  //       postalCode: quote?.whereTo.data.zipCode,
  //       cityName: quote?.whereTo.data.city,
  //       provinceCode: quote?.whereTo.data.state,
  //       addressLine1: quote?.whereTo.data.street + quote?.whereTo.data.streetNumber},shipperDetails:{      countryCode: quote?.whereFrom.data.country,
  //       postalCode: quote?.whereFrom.data.zipCode,
  //       cityName: quote?.whereFrom.data.city,
  //       provinceCode: quote?.whereFrom.data.state,
  //       addressLine1: quote?.whereFrom.data.street + quote?.whereFrom.data.streetNumber,}},
  //     getCostBreakdown: true,
  //     isCustomsDeclarable: true,
  //     isDTPRequested: true,
  //     items: quote?.whatsInside?.data.map((i) => ({

  //     })),
  //     localProductCode,
  //     merchantSelectedCarrierName,
  //     packages,
  //     productCode: ,
  //     shipmentPurpose: this.formatExportType(
  //       quote.whatsInside?.data[0]?.purpose,
  //     ),
  //     transportationMode: 'air',
  //     unitOfMeasurement: 'metric',
  //   };

  //   return payload
  // }
}
