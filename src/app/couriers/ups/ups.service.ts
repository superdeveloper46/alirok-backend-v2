import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { FindDropoffsDTO } from '../dto/couriers.dto';
import {
  NewRateShipmentAddressDataDTO,
  NewRateShipmentDTO,
  NewRateShipmentFiltersDTO,
  NewRateShipmentReturnDTO,
} from '../dto/newCouriers.dto';
import {
  UPSDropoffError,
  UPSDropoffReturn,
  UPSLabels,
  UPSPickup,
  UPSPickupReturn,
  UPSRateRequestQuote,
  UPSRateRequestTimeInTransitPayload,
  UPSRateRequestTimeInTransitResponse,
  UPSTrackingReturn,
} from './interface';
import { UpsHelperService } from './ups-helper/ups-helper.service';
import { CheckoutParcelMember } from '../../checkout/interface/checkout.interface';
import { FormattersService } from '../../misc/formatters/formatters.service';
import { S3Service } from '../../../vendors/s3/s3.service';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UpsService {
  private baseUrl: string;
  private licenseNumber: string;
  private userId: string;
  private password: string;
  private environment: string;

  private status = {
    RS: 'RETURNED',
    M: 'DROP_OFF',
    P: 'PICK_UP',
    I: 'TRANSIT',
    MV: 'BILLING_INFORMATION_AVOIDED',
    X: 'EXCEPTION',
    D: 'DELIVERED',
    DO: 'DELIVERY_ORIGIN',
    DD: 'DELIVERY_DESTINATION',
    W: 'WAREHOUSING',
    NA: 'NOT_AVAILABLE',
    O: 'OUT_FOR_DELIVERY',
  };

  constructor(
    private readonly upsHelper: UpsHelperService,
    private readonly configService: ConfigService,
    private readonly formatter: FormattersService,
    private readonly http: HttpService,
    private readonly s3Service: S3Service,
    private prisma: PrismaService,
  ) {
    this.baseUrl = configService.get('UPS_API_URL');
    this.licenseNumber = configService.get('UPS_ACCESS_LICENSE_NUMBER');
    this.userId = configService.get('UPS_USER_ID');
    this.password = configService.get('UPS_PASSWORD');
    this.environment = configService.get('ENVIRONMENT');
  }

  private upsHeader() {
    return {
      AccessLicenseNumber: this.licenseNumber,
      Username: this.userId,
      Password: this.password,
      transId: uuidv4(),
      transactionSrc: 'ALIROK',
    };
  }

  // private isProduction() {
  //   return this.environment === 'production';
  // }

  private upsRawAuth() {
    return { headers: this.upsHeader() };
  }

  public async rate(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    try {
      let packagesNormalizeds = this.upsHelper.makePackage(rateData);
      let ratePayload = this.upsHelper.makeRateRequest(
        rateData,
        packagesNormalizeds,
      );
      let timeInTransitPayload: UPSRateRequestTimeInTransitPayload =
        this.upsHelper.makeTimeInTransitRequest(rateData);

      let parcelRatingQuote;
      try {
        parcelRatingQuote = await lastValueFrom(
          this.http.post<UPSRateRequestQuote>(
            `${this.baseUrl}/ship/v1801/rating/Shop`,
            ratePayload,
            this.upsRawAuth(),
          ),
        );
      } catch (error) {
        let upsErrors = error.response.data?.response?.errors;

        let upsError = upsErrors?.pop();

        if (!upsErrors) {
          throw error;
        }
        if (upsError.code === '111057') {
          timeInTransitPayload = this.upsHelper.makeTimeInTransitRequest(
            rateData,
            true,
          );
          try {
            packagesNormalizeds = this.upsHelper.makePackage(rateData, true);
            ratePayload = this.upsHelper.makeRateRequest(
              rateData,
              packagesNormalizeds,
              true,
            );

            parcelRatingQuote = await lastValueFrom(
              this.http.post<UPSRateRequestQuote>(
                `${this.baseUrl}/ship/v1801/rating/Shop`,
                ratePayload,
                this.upsRawAuth(),
              ),
            );
          } catch (error) {
            upsErrors = error.response.data?.response?.errors;

            if (!upsErrors) {
              throw error;
            }

            upsError = upsErrors.pop();
            throw new BadRequestException({
              code: upsError.code,
              message: upsError.message,
            });
          }
        } else
          throw new BadRequestException({
            code: upsError.code,
            message: upsError.message,
          });
      }

      let data = await lastValueFrom(
        this.http.post<UPSRateRequestTimeInTransitResponse>(
          `${this.baseUrl}/ship/v1/shipments/transittimes`,
          timeInTransitPayload,
          this.upsRawAuth(),
        ),
      );

      if (data?.data?.validationList) {
        if (
          data?.data?.validationList?.invalidFieldList?.includes(
            'OriginCityName',
          )
        ) {
          const city = data?.data?.originPickList[0]?.city;
          data = await lastValueFrom(
            this.http.post<UPSRateRequestTimeInTransitResponse>(
              `${this.baseUrl}/ship/v1/shipments/transittimes`,
              { ...timeInTransitPayload, originCityName: city },
              this.upsRawAuth(),
            ),
          );
        }
      }

      const {
        data: { RateResponse },
      } = parcelRatingQuote;

      const ratedShipment = Array.isArray(RateResponse.RatedShipment)
        ? RateResponse.RatedShipment
        : [RateResponse.RatedShipment];

      const emsResponse = data?.data?.emsResponse;
      const timesInTransitServices = emsResponse ? emsResponse.services : [];

      const whereFromAddress = rateData.whereFrom.data;

      const dropoffAddress = await this.dropoff({
        city: whereFromAddress.city,
        country: whereFromAddress.country,
        is_residential_address: true,
        postal_code: whereFromAddress.zipCode,
        state: whereFromAddress.state,
        street: whereFromAddress.street,
        address: `${whereFromAddress.street} ${whereFromAddress.streetNumber}, ${whereFromAddress.state} - ${whereFromAddress.country}`,
        street_number: whereFromAddress.streetNumber,
      });

      const pickup = this.isTherePickUp(services)
        ? await this.pickup({
            address: {
              city: whereFromAddress.city,
              country: whereFromAddress.country,
              is_residential_address:
                whereFromAddress?.addressType === 'residential',
              postal_code: whereFromAddress.zipCode,
              state: whereFromAddress.state,
              street: whereFromAddress.street,
              address: `${whereFromAddress.street} ${whereFromAddress.streetNumber}, ${whereFromAddress.state} - ${whereFromAddress.country}`,
              street_number: whereFromAddress.streetNumber,
              complement_address: '',
            },
            pickup_date: rateData.shipDate.data.date as any,
          })
        : null;

      const UPSQuote = ratedShipment?.map((rate) =>
        this.upsHelper.normalizeRatedShipmentResponse({
          item: rate,
          timeInTransits: timesInTransitServices,
          dropoffAddress: dropoffAddress as UPSDropoffReturn[],
          pickup: pickup,
        }),
      );

      return { data: UPSQuote };
    } catch (error) {
      console.log('ups error', error);
      return error;
    }
  }

  public async rateWithType(rateData: NewRateShipmentDTO, serviceCode: string) {
    try {
      let packagesNormalizeds = this.upsHelper.makePackage(rateData);
      let ratePayload = this.upsHelper.makeRateRequest(
        rateData,
        packagesNormalizeds,
        false,
        serviceCode,
      );

      let parcelRatingQuote;
      try {
        parcelRatingQuote = await lastValueFrom(
          this.http.post<UPSRateRequestQuote>(
            `${this.baseUrl}/ship/v1801/rating/Rate`,
            ratePayload,
            this.upsRawAuth(),
          ),
        );
      } catch (error) {
        let upsErrors = error.response.data?.response?.errors;

        let upsError = upsErrors.pop();

        if (!upsErrors) {
          throw error;
        }
        if (upsError.code === '111057') {
          try {
            packagesNormalizeds = this.upsHelper.makePackage(rateData, true);
            ratePayload = this.upsHelper.makeRateRequest(
              rateData,
              packagesNormalizeds,
              true,
              serviceCode,
            );

            parcelRatingQuote = await lastValueFrom(
              this.http.post<UPSRateRequestQuote>(
                `${this.baseUrl}/ship/v1801/rating/Rate`,
                ratePayload,
                this.upsRawAuth(),
              ),
            );
          } catch (error) {
            upsErrors = error.response.data?.response?.errors;

            if (!upsErrors) {
              throw error;
            }

            upsError = upsErrors.pop();
            throw new BadRequestException({
              code: upsError.code,
              message: upsError.message,
            });
          }
        } else
          throw new BadRequestException({
            code: upsError.code,
            message: upsError.message,
          });
      }

      const {
        data: { RateResponse },
      } = parcelRatingQuote;

      const ratedShipment = Array.isArray(RateResponse.RatedShipment)
        ? RateResponse.RatedShipment
        : [RateResponse.RatedShipment];

      const item = ratedShipment[0];
      const upsMonetaryValue = Number(
        item.NegotiatedRateCharges.TotalCharge.MonetaryValue,
      );

      return upsMonetaryValue;
    } catch (error) {
      return error.response.data;
    }
  }

  public async dropoff(
    dropoff: FindDropoffsDTO,
  ): Promise<UPSDropoffReturn[] | UPSDropoffError> {
    try {
      const locatorPayload = this.upsHelper.makeLocatorPayload(dropoff);

      const { data } = await lastValueFrom(
        this.http.post(`${this.baseUrl}/rest/Locator`, {
          AccessRequest: {
            AccessLicenseNumber: this.licenseNumber,
            UserId: this.userId,
            Password: this.password,
          },
          LocatorRequest: locatorPayload,
        }),
      );

      const errorOnRequest = this.upsHelper.handleLocatorErrorsOnRequest(data);
      if (errorOnRequest) {
        return errorOnRequest;
      }

      const responseData = this.upsHelper.makeLocatorResponseData(
        data.LocatorResponse.SearchResults.DropLocation,
      );

      return responseData;
    } catch (error) {
      return error?.response;
    }
  }

  public async tracking(trackingNumber: string) {
    try {
      const { data } = await lastValueFrom(
        this.http.get<UPSTrackingReturn>(
          `${this.baseUrl}/track/v1/details/${trackingNumber}?locale=en_US`,
          this.upsRawAuth(),
        ),
      );

      const events = data?.trackResponse?.shipment[0]?.package[0]?.activity
        .map((i) => ({
          date: `${i?.date?.substring(0, 4)}-${i?.date?.substring(
            4,
            6,
          )}-${i?.date?.substring(6, 8)}`,
          description: i?.status?.description,
          status: this.status[i?.status?.type],
          rawStatus: i?.status?.type,
        }))
        .reverse();

      const labelIssued =
        !!data?.trackResponse?.shipment[0]?.package[0]?.trackingNumber;

      return { events: events ?? [], labelIssued: labelIssued ?? false };
    } catch (error) {
      return error;
    }
  }

  public async pickup(
    pickup: UPSPickup,
  ): Promise<UPSPickupReturn | BadRequestException> {
    try {
      const pickupRatePayload = this.upsHelper.makePickupRatePayload(pickup);

      const pickupBody = {
        PickupRateRequest: pickupRatePayload,
      };

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.baseUrl}/ship/v1801/pickups/rating`,
          pickupBody,
          this.upsRawAuth(),
        ),
      );

      const responseData = await this.upsHelper.makePickupResponseData(
        data.PickupRateResponse.RateResult,
      );

      if (!responseData) {
        const message =
          'Pickup is not available for the selected region. You will need to drop off the package at the station closest to your address.';

        return new BadRequestException({ message: message });
      }

      return responseData;
    } catch (error) {
      return error;
    }
  }

  private isTherePickUp(services: NewRateShipmentFiltersDTO['services']) {
    return services?.length ? services?.find((i) => i === 'pickUp') : true;
  }

  async shipment(
    parcelBooking: any,
    {
      sender,
      recipient,
    }: {
      sender: CheckoutParcelMember;
      recipient: CheckoutParcelMember;
    },
  ) {
    try {
      const order: NewRateShipmentReturnDTO = parcelBooking.metadata as any;
      const quote: NewRateShipmentDTO = parcelBooking.quote as any;

      const currentDate = new Date();
      const formattedDate = currentDate
        .toISOString()
        .split('T')
        .shift()
        .replace(/-/g, '');

      const isDocument = quote.type === 'document';
      const DocumentsOnlyIndicator = isDocument ? 'Document' : undefined;

      const PackageID = `ALIROK${String(
        parcelBooking.parcel_serial_number,
      ).padStart(7, '0')}P`;
      const PackageCode = '02';

      const originAndDestinationAreDifferent =
        (quote.whereFrom.data.country !== 'US' &&
          quote.whereTo.data.country !== 'US') ||
        quote.whereFrom.data.country !== quote.whereTo.data.country;

      const alirokInfo = {
        Name: 'Alirok Corp',
        AttentionName: 'Alirok Corp',
        ShipperNumber: 'Y242R5',
        Phone: {
          Number: '17863569453',
        },
        Address: {
          AddressLine: '1395 Brickell Ave',
          City: 'Miami',
          StateProvinceCode: 'FL',
          PostalCode: '33131',
          CountryCode: 'US',
        },
      };

      const splitAddress = (address) => {
        const ADDRESS_SPLIT_PATTERN = /^(.{0,32})?(.{0,32})?(.{0,32})/;
        const LAST_THREE_VALUES = -3;
        const addresses = address
          .match(ADDRESS_SPLIT_PATTERN)
          .slice(LAST_THREE_VALUES);
        const removeEmptyAddresses = addresses.filter((address) =>
          Boolean(address),
        );

        return removeEmptyAddresses;
      };

      const findUkStateCode = async (address) => {
        if (address.country === 'GB') {
          const ukState = await this.prisma.uk_states_mapping_ups.findFirst({
            where: {
              state: address.state,
            },
          });

          if (ukState) {
            return ukState.code;
          } else {
            return address.state;
          }
        } else return address.state;
      };

      const createShip = (
        {
          person,
          address,
          shipState,
        }: {
          person: CheckoutParcelMember;
          address: NewRateShipmentAddressDataDTO;
          shipState: string;
        },
        otherAttributes?,
      ) => ({
        Name: person?.full_name,
        AttentionName: person?.company_name
          ? person?.company_name
          : person?.full_name,
        Phone: {
          Number: `${person?.phone?.countryCode as any}${
            person?.phone?.number as any
          }`,
        },
        TaxIdentificationNumber: person?.tax_id,
        Address: {
          AddressLine: splitAddress(
            `${address?.streetNumber} ${address?.street} ${
              address?.additionalAddress ?? ''
            }`,
          ),
          City: address?.city,
          StateProvinceCode: shipState,
          PostalCode: address?.zipCode,
          CountryCode: address?.country,
        },
        ...otherAttributes,
      });

      const ShipperState = await findUkStateCode(quote.whereFrom.data);
      const Shipper = originAndDestinationAreDifferent
        ? alirokInfo
        : createShip(
            {
              person: sender,
              address: quote.whereFrom.data,
              shipState: ShipperState,
            },
            {
              ShipperNumber: alirokInfo.ShipperNumber,
            },
          );

      const ShipFromState = await findUkStateCode(quote.whereFrom.data);
      const ShipToState = await findUkStateCode(quote.whereTo.data);

      const ShipFrom = createShip({
        person: sender,
        address: quote.whereFrom.data,
        shipState: ShipFromState,
      });
      const ShipTo = createShip({
        person: recipient,
        address: quote.whereTo.data,
        shipState: ShipToState,
      });
      const upsPackages = quote.whatsInside?.data?.map((pkg, index: number) => {
        const weightIsLbs = pkg.weight.unit === 'lb';

        const sizeInInches = pkg.dimensions.unit === 'in';

        return Array(Number(pkg.pieces)).fill({
          Description: `Package ${index + 1}`,
          Packaging: {
            Code: PackageCode,
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

      const Package = [].concat(...upsPackages.map((i) => i));

      const payload = {
        Shipment: {
          DocumentsOnlyIndicator,
          PackageID,
          Description: PackageID,
          Shipper,
          ShipFrom,
          ShipTo,
          PaymentInformation: {
            ShipmentCharge: [
              {
                Type: '01',
                BillShipper: {
                  AccountNumber: 'Y242R5',
                  Address: {
                    AddressLine: '1395 Brickell Ave',
                    City: 'Miami',
                    StateProvinceCode: 'FL',
                    PostalCode: '33131',
                    CountryCode: 'US',
                  },
                },
              },
            ],
          },
          Service: {
            Code: order.service_code,
          },
          Package,
          ShipmentServiceOptions: {} as any,
          ItemizedChargesRequestedIndicator: 'Y',
          RatingMethodRequestedIndicator: 'Y',
          TaxInformationIndicator: 'Y',
          ShipmentRatingOptions: {
            NegotiatedRatesIndicator: 'Y',
          },
        },
        LabelSpecification: {
          LabelImageFormat: {
            Code: 'PNG',
          },
        },
      };

      if (
        originAndDestinationAreDifferent &&
        quote?.whereFrom?.data?.country !== 'US'
      ) {
        payload.Shipment.ShipmentServiceOptions.ImportControlIndicator = 'Y';
        payload.Shipment.ShipmentServiceOptions.LabelMethod = {
          Code: '04',
          Description: 'ImportControl Electronic Label',
        };
        payload.Shipment.ShipmentServiceOptions.LabelDelivery = {
          LabelLinksIndicator: 'Y',
        };
      }

      const needGenerateInternationalForms =
        originAndDestinationAreDifferent && !isDocument;
      if (needGenerateInternationalForms) {
        const upsProduct = quote.whatsInside?.data?.map((pkg) =>
          pkg?.items?.map((item, index) => {
            const description = item?.description.substring(0, 34);

            const weight = pkg.weight.value * pkg.pieces;

            const WeightUnitOfMeasurementCode = 'LBS';

            return {
              Description: !isDocument ? description : `Document ${index}`,
              CommodityCode: !isDocument ? item?.hts_code : undefined,
              NumberOfPackagesPerCommodity: Number(pkg.pieces),
              OriginCountryCode: ShipFrom.Address.CountryCode,
              ProductWeight: {
                Weight: Number(weight / item?.quantity).toFixed(1),
                UnitOfMeasurement: {
                  Code: WeightUnitOfMeasurementCode,
                },
              },
              Unit: {
                Number: Number(item?.quantity),
                Value:
                  String(item?.price?.value / Number(item?.quantity)) || '0',
                UnitOfMeasurement: {
                  Code: WeightUnitOfMeasurementCode,
                },
              },
            };
          }),
        );
        const Product = []
          .concat(...upsProduct.map((i) => i))
          .reduce((productItems, productItem) => {
            const itemCopy = Object.assign({}, productItem);
            itemCopy.Unit = { ...itemCopy.Unit, Number: 0 };
            itemCopy.NumberOfPackagesPerCommodity = 0;

            const itemBase =
              productItems
                .filter(
                  (item) => item?.CommodityCode === productItem?.CommodityCode,
                )
                .pop() ?? itemCopy;
            itemBase.Unit.Number += productItem.Unit.Number;
            itemBase.NumberOfPackagesPerCommodity +=
              productItem.NumberOfPackagesPerCommodity;

            return [...productItems, itemBase];
          }, [])
          .filter(
            (items, item, originalItems) =>
              item == originalItems.indexOf(items),
          )
          .map((item) => ({
            ...item,
            NumberOfPackagesPerCommodity: String(
              item.NumberOfPackagesPerCommodity,
            ),
            Unit: {
              ...item.Unit,
              Number: String(item.Unit.Number),
            },
          }));

        const exportReason = quote.whatsInside?.data[0].purpose.toUpperCase();

        payload.Shipment.ShipmentServiceOptions.InternationalForms = [
          {
            FormType: '01',
          },
          {
            FormType: '03',
          },
          {
            InvoiceDate: formattedDate,
            ExportDate: formattedDate,
            ExportingCarrier: 'UPS',
            ReasonForExport: exportReason ? exportReason : 'SALE',
            CurrencyCode: quote.currency,
            TermsOfShipment: 'DDU',
            Contacts: {
              SoldTo: ShipTo,
            },
            FreightCharges: {
              MonetaryValue: String(order.price.value),
            },
            Product,
          },
        ];
      }
      const { data } = await lastValueFrom(
        this.http.post(
          `${this.baseUrl}ship/v1801/shipments`,
          {
            ShipmentRequest: payload,
          },
          this.upsRawAuth(),
        ),
      );
      const trackingNumber: string =
        data.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber;

      const pickupWasSelected = order?.services?.find(
        (i) => i.name === 'Pick-up',
      );

      let requestPickup;
      if (pickupWasSelected?.items[0]?.selected) {
        requestPickup = {
          shipper: Shipper,
          order,
          packages: Package,
          quote,
          shipFrom: ShipFrom,
          shipTo: ShipTo,
          trackingNumber,
        };
      }

      const labelPDFDocumentWithMime =
        await this.upsHelper.makeUPSLabelPDFDocument(
          data.ShipmentResponse.ShipmentResults.PackageResults,
        );
      const labelPDFDocumentBase64 = labelPDFDocumentWithMime.split(',').pop();
      const labelPDFDocument = Buffer.from(labelPDFDocumentBase64, 'base64');

      const labelUrl = await this.s3Service.put({
        file: labelPDFDocument,
        contentType: 'application/pdf',
        folder: 'documents/labels',
        name: `${PackageID}.pdf`,
      });

      const invoiceUrl = needGenerateInternationalForms
        ? await this.s3Service.put({
            file: Buffer.from(
              data.ShipmentResponse.ShipmentResults.Form.Image.GraphicImage,
              'base64',
            ),
            contentType: 'application/pdf',
            folder: 'documents/invoices',
            name: `${PackageID}.pdf`,
          })
        : undefined;

      return {
        id: trackingNumber,
        shipmentId: trackingNumber,
        tracking_number: trackingNumber,
        label_url: labelUrl,
        invoice_url: invoiceUrl,
        receipt_url: '',
        PackageID,
        requestPickup,
      };
    } catch (error) {
      //  console.log(error);

      throw error;
    }
  }

  async firstMileShipment(
    parcelBooking: any,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
    mainCourier: string,
    referenceTracking: string,
  ) {
    try {
      const order: NewRateShipmentReturnDTO = parcelBooking.metadata as any;
      let quote: NewRateShipmentDTO = parcelBooking.quote as any;

      let firstMileDropoffAddress;

      switch (mainCourier) {
        case 'skypostal':
          firstMileDropoffAddress = {
            city: 'Doral',
            country: 'US',
            postal_code: '33126',
            state: 'FL',
            street: 'NW 15th St',
            streetNumber: '7805',
          };
          break;
        case 'bps':
          firstMileDropoffAddress = {
            city: 'Doral',
            country: 'US',
            postal_code: '33122',
            state: 'FL',
            street: 'NW 21st St',
            streetNumber: '8351',
          };
          break;

        default:
          break;
      }

      quote = {
        ...quote,
        whereTo: {
          formattedAddress: `${firstMileDropoffAddress.street}, ${firstMileDropoffAddress.city}, ${firstMileDropoffAddress.state} ${firstMileDropoffAddress.postal_code}, ${firstMileDropoffAddress.country}`,
          data: {
            addressType: quote?.whereTo?.data?.addressType,
            zipCode: firstMileDropoffAddress.postal_code,
            additionalAddress: '',
            city: firstMileDropoffAddress.city,
            country: firstMileDropoffAddress.country,
            state: firstMileDropoffAddress.state,
            street: firstMileDropoffAddress.street,
            streetNumber: firstMileDropoffAddress.streetNumber,
          },
        },
      };

      const currentDate = new Date();
      const formattedDate = currentDate
        .toISOString()
        .split('T')
        .shift()
        .replace(/-/g, '');

      const isDocument = quote.type === 'document';
      const DocumentsOnlyIndicator = isDocument ? 'Document' : undefined;

      const PackageID = `ALIROK${String(
        parcelBooking.parcel_serial_number,
      ).padStart(7, '0')}P`;
      const PackageCode = '02';

      const DimensionsUnitOfMeasurementCode = 'IN';

      const originAndDestinationAreDifferent =
        (quote.whereFrom.data.country !== 'US' &&
          quote.whereTo.data.country !== 'US') ||
        quote.whereFrom.data.country !== quote.whereTo.data.country;

      const alirokInfo = {
        Name: 'Alirok Corp',
        AttentionName: 'Alirok Corp',
        ShipperNumber: 'Y242R5',
        Phone: {
          Number: '17863569453',
        },
        Address: {
          AddressLine: '1395 Brickell Ave',
          City: 'Miami',
          StateProvinceCode: 'FL',
          PostalCode: '33131',
          CountryCode: 'US',
        },
      };

      const splitAddress = (address) => {
        const ADDRESS_SPLIT_PATTERN = /^(.{0,32})?(.{0,32})?(.{0,32})/;
        const LAST_THREE_VALUES = -3;
        const addresses = address
          .match(ADDRESS_SPLIT_PATTERN)
          .slice(LAST_THREE_VALUES);
        const removeEmptyAddresses = addresses.filter((address) =>
          Boolean(address),
        );

        return removeEmptyAddresses;
      };

      const findUkStateCode = async (address) => {
        if (address.country === 'GB') {
          const ukState = await this.prisma.uk_states_mapping_ups.findFirst({
            where: {
              state: address.state,
            },
          });

          if (ukState) {
            return ukState.code;
          } else {
            return address.state;
          }
        } else return address.state;
      };

      const createShip = (
        {
          person,
          address,
          shipState,
          firstMile = false,
        }: {
          person: CheckoutParcelMember;
          address: NewRateShipmentAddressDataDTO;
          shipState: string;
          firstMile?: boolean;
          recipient?: boolean;
        },
        otherAttributes?,
      ) => ({
        Name: firstMile
          ? `REF ${referenceTracking}`
          : person?.company_name
          ? person?.company_name
          : person?.full_name,
        AttentionName:
          mainCourier === 'skypostal'
            ? 'SKYPOSTAL INC'
            : mainCourier === 'bps'
            ? 'BPS - Bringer Parcel Service'
            : recipient?.company_name ?? recipient?.full_name,
        Phone: {
          Number: `${person?.phone?.countryCode as any}${
            person?.phone?.number as any
          }`,
        },
        TaxIdentificationNumber: person?.tax_id,
        Address: {
          AddressLine: splitAddress(
            `${address?.streetNumber} ${address?.street} ${
              address?.additionalAddress ?? ''
            }`,
          ),
          City: address?.city,
          StateProvinceCode: shipState,
          PostalCode: address?.zipCode,
          CountryCode: address?.country,
        },
        ...otherAttributes,
      });

      const ShipperState = await findUkStateCode(quote.whereFrom.data);
      const Shipper = originAndDestinationAreDifferent
        ? alirokInfo
        : createShip(
            {
              person: sender,
              address: quote.whereFrom.data,
              shipState: ShipperState,
            },
            {
              ShipperNumber: alirokInfo.ShipperNumber,
            },
          );

      const ShipFromState = await findUkStateCode(quote.whereFrom.data);
      const ShipToState = await findUkStateCode(quote.whereTo.data);

      const ShipFrom = createShip({
        person: sender,
        address: quote.whereFrom.data,
        shipState: ShipFromState,
      });
      const ShipTo = createShip({
        person: recipient,
        address: quote.whereTo.data,
        shipState: ShipToState,
        firstMile: true,
      });

      const upsPackages = quote.whatsInside?.data?.map((pkg, index: number) => {
        const weightIsLbs = pkg.weight.unit === 'lb';

        const sizeInInches = pkg.dimensions.unit === 'in';

        return Array(Number(pkg.pieces)).fill({
          Description: `Package ${index + 1}`,
          Packaging: {
            Code: PackageCode,
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

      const Package = [].concat(...upsPackages.map((i) => i));

      const payload = {
        Shipment: {
          DocumentsOnlyIndicator,
          PackageID,
          Description: PackageID,
          Shipper,
          ShipFrom,
          ShipTo,
          PaymentInformation: {
            ShipmentCharge: {
              Type: '01',
              BillShipper: {
                AccountNumber: 'Y242R5',
                Address: {
                  AddressLine: '1395 Brickell Ave',
                  City: 'Miami',
                  StateProvinceCode: 'FL',
                  PostalCode: '33131',
                  CountryCode: 'US',
                },
              },
            },
          },
          Service: {
            Code: '03',
          },
          Package,
          ShipmentServiceOptions: {} as any,
          ItemizedChargesRequestedIndicator: 'Y',
          RatingMethodRequestedIndicator: 'Y',
          TaxInformationIndicator: 'Y',
          ShipmentRatingOptions: {
            NegotiatedRatesIndicator: 'Y',
          },
        },
        LabelSpecification: {
          LabelImageFormat: {
            Code: 'PNG',
          },
        },
      };

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.baseUrl}ship/v1801/shipments`,
          {
            ShipmentRequest: payload,
          },
          this.upsRawAuth(),
        ),
      );
      const trackingNumber =
        data.ShipmentResponse.ShipmentResults.ShipmentIdentificationNumber;

      const packageResults: UPSLabels =
        data.ShipmentResponse.ShipmentResults.PackageResults;

      // const labelPDFDocumentWithMime =
      //   await this.upsHelper.makeUPSLabelPDFDocument(packageResults);

      return {
        tracking_number: trackingNumber,
        label_base64: packageResults.ShippingLabel.GraphicImage,
        order,
        quote,
        packages: Package,
        shipper: Shipper,
        shipFrom: ShipFrom,
        shipTo: ShipTo,
      };
    } catch (error) {
      throw error;
    }
  }

  async cancelShipment(shipmentIdentificationNumber: string) {
    await lastValueFrom(
      this.http.delete(
        `${this.baseUrl}/ship/v1/shipments/cancel/${shipmentIdentificationNumber}`,
        this.upsRawAuth(),
      ),
    );

    throw new BadRequestException('Shipment cancelled due operational issues.');
  }

  async requestPickup({
    shipper,
    shipFrom,
    shipTo,
    quote,
    order,
    packages,
    trackingNumber,
  }: {
    shipper;
    shipFrom;
    shipTo;
    quote: NewRateShipmentDTO;
    order: NewRateShipmentReturnDTO;
    packages;
    trackingNumber;
  }) {
    try {
      const parcelShipDate = new Date(quote.shipDate?.data?.date);

      const PickupDate = parcelShipDate
        .toISOString()
        .substring(0, 10)
        .replace(/-/g, '');

      const isResidentialAddress =
        quote?.whereFrom?.data?.addressType === 'residential' ? 'Y' : 'N';

      const PickupServiceCode = String(order.service_code).padStart(3, '0');

      const whatsInsideFormatted =
        this.formatter.convertPackagesToImperial(quote);

      const weight = whatsInsideFormatted.reduce(
        (acc, next) => acc + next.weight.value * next.pieces,
        0,
      );

      const pickupPayload = {
        RatePickupIndicator: 'Y',
        AlternateAddressIndicator: 'Y',
        PaymentMethod: '01',
        Shipper: {
          Account: {
            AccountNumber: shipper.ShipperNumber,
            AccountCountryCode: shipper.Address.CountryCode,
          },
        },
        PickupDateInfo: {
          ReadyTime: '0900',
          CloseTime: '1900',
          PickupDate,
        },
        PickupAddress: {
          CompanyName: shipFrom.Name.slice(0, 22),
          ContactName: shipFrom.AttentionName.slice(0, 22),
          AddressLine: shipFrom.Address.AddressLine,
          City: shipFrom.Address.City,
          StateProvince: shipFrom.Address.StateProvinceCode,
          PostalCode: shipFrom.Address.PostalCode,
          CountryCode: shipFrom.Address.CountryCode,
          ResidentialIndicator: isResidentialAddress,
          Phone: {
            Number: shipFrom.Phone.Number,
          },
        },
        PickupPiece: [
          {
            ServiceCode: PickupServiceCode,
            Quantity: String(packages.length),
            DestinationCountryCode: shipTo.Address.CountryCode,
            ContainerCode: '01',
          },
        ],
        TotalWeight: {
          Weight: weight,
          UnitOfMeasurement: 'LBS',
        },
        TrackingDataWithReferenceNumber: {
          TrackingNumber: trackingNumber,
        },
      };

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.baseUrl}/ship/v1707/pickups`,
          {
            PickupCreationRequest: pickupPayload,
          },
          this.upsRawAuth(),
        ),
      );

      return data;
    } catch (error) {
      return error.response.data;
    }
  }

  public async cancelPickupRequest(confirmationNumber: string) {
    return await lastValueFrom(
      this.http.post(
        `${this.baseUrl}/ship/v1/pickups/prn`,
        {
          PickupCancelRequest: { CancelBy: 'prn', PRN: confirmationNumber },
        },
        this.upsRawAuth(),
      ),
    );
  }
}
