import { parcel_bookings } from '@generated/client';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { CheckoutParcelMember } from '../../../app/checkout/interface/checkout.interface';
import { parseString } from 'xml2js';
import { RateShipmentDTO } from '../dto/couriers.dto';
import {
  NewRateShipmentDTO,
  NewRateShipmentFiltersDTO,
  NewRateShipmentReturnDropOffLocationDTO,
  NewRateShipmentReturnDTO,
} from '../dto/newCouriers.dto';
import {
  USPSAddressValidation,
  USPSCreateShipmentRequestBody,
  USPSCreateShippingLabelReturn,
  USPSDomesticRateRequestXMLParsedResponse,
  USPSPickUpAvailability,
  USPSSchedulePickupResponse,
  USPSServicesCommitmentResponse,
} from './interface/usps.interface';
import { UspsHelperService } from './usps-helper/usps-helper.service';
import { S3Service } from '../../../vendors/s3/s3.service';
import { NewRateShipmentAddressDataDTO } from 'src/app/misc/search-helper/dto/newRateAddress.dto';
import { addBusinessDays, format, parse, parseISO } from 'date-fns';
import { IPickupAvailabilityData } from 'src/app/parcel-booking/interface/parcel-booking.interface';

@Injectable()
export class UspsService {
  private baseUrl: string;
  private baseRatingUrl: string;

  constructor(
    private readonly uspsHelper: UspsHelperService,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    private readonly s3Service: S3Service,
  ) {
    this.baseUrl = this.configService.get('USPS_API_URL');
    this.baseRatingUrl = this.configService.get('USPS_RATE_API_URL');
  }

  public async rate(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    try {
      const validateUspsQuote =
        this.uspsHelper.validateUSPSQuoteRequest(rateData);

      if (validateUspsQuote?.error)
        return new BadRequestException({
          message:
            validateUspsQuote?.message || 'Unable to quote packages at USPS',
        });

      const rateWithValidatedAddress = await this.addressValidation(rateData);

      const requestBody = this.uspsHelper.formatUSPSQuoteXMLRequest(
        rateWithValidatedAddress,
      );

      const { data } = await lastValueFrom(
        this.http.get(`${this.baseRatingUrl}/ShippingAPI.dll`, {
          params: requestBody,
        }),
      );

      let parsedXML: USPSDomesticRateRequestXMLParsedResponse;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to quote packages at USPS',
        });
      }

      const formattedResponse = this.uspsHelper.formatUSPSQuoteResponse(
        rateWithValidatedAddress,
        parsedXML,
      );

      //Insert Dropoff Location

      const dateFormatted = format(
        parseISO(rateData.shipDate.data.date),
        'dd-MMM-yyyy',
      );

      const originZipCode = rateWithValidatedAddress?.whereFrom?.data;
      const destinyZipCode = rateWithValidatedAddress?.whereTo?.data;

      const removeUnusedServices = formattedResponse.filter((i) => {
        if (rateData.type === 'package') {
          return rateWithValidatedAddress.whereTo.data.country !== 'US'
            ? i.service_code === '1' || i.service_code === '2'
            : i.service_code === '3' ||
                i.service_code === '1' ||
                i.service_code === '77' ||
                i.service_code === '53';
        }

        if (rateData.type === 'document') {
          return rateWithValidatedAddress.whereTo.data.country !== 'US'
            ? i.service_code === '1' || i.service_code === '2'
            : i.service_code === '13' ||
                i.service_code === '16' ||
                (i.service_code === '0' &&
                  i.rate_type === 'First-Class Mail') ||
                i.service_code === '77';
        }
      });

      let responsesWithDropoff: NewRateShipmentReturnDTO[] = [];

      for (const iterator of removeUnusedServices) {
        const {
          dropoffAddresses,
          estimatedDeliveryDates,
          scheduleDeliveryDate,
        } = await this.commitmentAndServices(
          iterator,
          originZipCode?.zipCode,
          destinyZipCode?.zipCode,
          dateFormatted,
          destinyZipCode?.country !== 'US',
          rateData?.shipDate?.data?.date,
        );

        const responseWithCommitments: NewRateShipmentReturnDTO = {
          ...iterator,
          company: { ...iterator.company, drop_off: dropoffAddresses },
          services: iterator.services.map((i) => ({
            ...i,
            items: i.items.map((a) => ({ ...a })),
          })),
          delivery: { ...iterator.delivery, date: scheduleDeliveryDate },
          estimatedDeliveryDates,
        };

        responsesWithDropoff.push(responseWithCommitments);
      }

      if (this.isTherePickUp(rateData?.filters?.services)) {
        const pickUpQuote = await this.pickUpAvailability(
          rateWithValidatedAddress,
        );

        if (pickUpQuote?.CarrierPickupAvailabilityResponse?.CarrierRoute) {
          responsesWithDropoff = responsesWithDropoff.map((i) => {
            const allServices = i.services;

            allServices.push({
              company: i.company,
              items: [
                {
                  description: 'Pick-up',
                  name: 'Pick-up',
                  price: {
                    currency: 'USD',
                    value: 3,
                  },
                  required: false,
                },
              ],
              name: 'Pick-up',
            });

            return { ...i, services: allServices.reverse() };
          });
        }
      }

      return { data: responsesWithDropoff };
    } catch (error) {
      return error;
    }
  }

  public async pickUpAvailability(
    rateData: NewRateShipmentDTO,
  ): Promise<USPSPickUpAvailability> {
    try {
      const requestBody =
        this.uspsHelper.formatUSPSPickUpAvailability(rateData);

      const { data } = await lastValueFrom(
        this.http.get(`${this.baseRatingUrl}/ShippingAPI.dll`, {
          params: requestBody,
        }),
      );

      let parsedXML: USPSPickUpAvailability;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to quote pickup at USPS',
        });
      }

      return parsedXML;
    } catch (error) {
      return error;
    }
  }

  private isTherePickUp(services: NewRateShipmentFiltersDTO['services']) {
    return services?.length ? services?.find((i) => i === 'pickUp') : true;
  }

  public async rateWithType(rateData: NewRateShipmentDTO, serviceCode: string) {
    try {
      const validateUspsQuote =
        this.uspsHelper.validateUSPSQuoteRequest(rateData);

      if (validateUspsQuote?.error)
        return new BadRequestException({
          message:
            validateUspsQuote?.message || 'Unable to quote packages at USPS',
        });

      const rateWithAddressValidated = await this.addressValidation(rateData);

      const requestBody = this.uspsHelper.formatUSPSQuoteXMLRequest(
        rateWithAddressValidated,
      );

      const { data } = await lastValueFrom(
        this.http.get(`${this.baseRatingUrl}/ShippingAPI.dll`, {
          params: requestBody,
        }),
      );
      let parsedXML: USPSDomesticRateRequestXMLParsedResponse;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });

      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to quote packages at USPS',
        });
      }

      const formattedResponse = this.uspsHelper.formatUSPSQuoteResponse(
        rateWithAddressValidated,
        parsedXML,
      );

      const returnPrice = formattedResponse.filter(
        (i) => String(i.service_code) === String(serviceCode),
      )[0]?.price?.value;

      return returnPrice;
    } catch (error) {
      return error;
    }
  }

  public async shipment(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    try {
      const base64Labels = [];

      const order: NewRateShipmentReturnDTO = shipmentBody?.metadata as any;
      const quote: NewRateShipmentDTO = shipmentBody?.quote as any;

      const isPickupRequested = order.services.find((i) => i.name === 'Pick-up')
        ?.items[0]?.selected;

      const rateWithValidatedAddress = await this.addressValidation(quote);

      const serviceCode = order.service_code;

      for (const dataPack of this.uspsHelper.formatQuotePackages(
        rateWithValidatedAddress,
      )) {
        const requestBody = this.uspsHelper.formatUSPSShipmentXMLRequest(
          dataPack,
          sender,
          recipient,
          {},
          serviceCode,
        );

        const { data } = await lastValueFrom(
          this.http.get(`${this.baseUrl}/ShippingAPI.dll`, {
            params: requestBody,
          }),
        );

        let parsedXML: USPSCreateShippingLabelReturn;
        let parsingXMLError = false;
        parseString(data, (err, parsed) => {
          if (!err) {
            parsedXML = parsed;
            parsingXMLError = false;
          } else {
            parsedXML = null;
            parsingXMLError = true;
          }
        });
        if (parsingXMLError) {
          throw new BadRequestException({
            message: 'Unable to generate packages labels at USPS',
          });
        }

        if (parsedXML.Error) {
          throw new BadRequestException({
            message: `Unable to generate packages labels at USPS ${parsedXML.Error?.Description[0]}`,
          });
        }

        if (requestBody.API === 'eVS') {
          base64Labels.push({
            label: parsedXML.eVSResponse.LabelImage[0],
            receipt: parsedXML.eVSResponse.ReceiptImage[0],
            tracking: parsedXML.eVSResponse.BarcodeNumber[0],
          });
        } else {
          if (serviceCode === '1') {
            base64Labels.push({
              label: parsedXML.eVSExpressMailIntlResponse.LabelImage[0],
              receipt: parsedXML.eVSExpressMailIntlResponse.LabelImage[0],
              tracking: parsedXML.eVSExpressMailIntlResponse.BarcodeNumber[0],
            });
          }

          if (serviceCode === '2') {
            base64Labels.push({
              label: parsedXML.eVSPriorityMailIntlResponse.LabelImage[0],
              receipt: parsedXML.eVSPriorityMailIntlResponse.LabelImage[0],
              tracking: parsedXML.eVSPriorityMailIntlResponse.BarcodeNumber[0],
            });
          }

          if (serviceCode === '12') {
            base64Labels.push({
              label: parsedXML.eVSGXGGetLabelResponse.LabelImage[0],
              receipt: parsedXML.eVSGXGGetLabelResponse.CIImage[0],
              tracking: parsedXML.eVSGXGGetLabelResponse.USPSBarcodeNumber[0],
            });
          }
        }
      }

      const PackageID = `ALIROK${String(
        shipmentBody.parcel_serial_number,
      ).padStart(7, '0')}P`;

      const labelUrl = await this.s3Service.put({
        file: Buffer.from(base64Labels[0].label, 'base64'),
        contentType: 'application/pdf',
        folder: 'documents/labels',
        name: `${PackageID}.pdf`,
      });

      return {
        id: String(base64Labels[0].tracking),
        requestPickup: isPickupRequested,
        shipmentId: String(base64Labels[0].tracking),
        tracking_number: String(base64Labels[0].tracking),
        label_url: labelUrl,
        receipt_url: '',
        PackageID,
      };
    } catch (error) {
      throw error;
    }
  }

  public async firstMileShipment(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
    mainCourier: string,
    referenceTracking: string,
  ): Promise<{
    tracking_number: string;
    label_base64: string;
  }> {
    try {
      const base64Labels = [];

      const order: any = shipmentBody?.metadata;
      let quote: any = shipmentBody?.quote;

      let firstMileDropoffAddress;

      switch (mainCourier) {
        case 'skypostal':
          firstMileDropoffAddress = {
            city: 'Doral',
            country: 'US',
            postal_code: '33126',
            state: 'FL',
            street: 'NW 15TH ST',
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
            additionalAddress: referenceTracking,
            city: firstMileDropoffAddress.city,
            country: firstMileDropoffAddress.country,
            state: firstMileDropoffAddress.state,
            street: firstMileDropoffAddress.street,
            streetNumber: firstMileDropoffAddress.streetNumber,
          },
        },
      };

      const rateWithValidatedAddress = await this.addressValidation(quote);

      for (const dataPack of this.uspsHelper.formatQuotePackages(
        rateWithValidatedAddress,
      )) {
        const requestBody = this.uspsHelper.formatUSPSShipmentXMLRequest(
          dataPack,
          sender,
          recipient,
          { firstMile: true, courier: 'SKYPOSTAL INC' },
        );

        const { data } = await lastValueFrom(
          this.http.get(`${this.baseUrl}/ShippingAPI.dll`, {
            params: requestBody,
          }),
        );

        let parsedXML: USPSCreateShippingLabelReturn;
        let parsingXMLError = false;
        parseString(data, (err, parsed) => {
          if (!err) {
            parsedXML = parsed;
            parsingXMLError = false;
          } else {
            parsedXML = null;
            parsingXMLError = true;
          }
        });

        if (parsingXMLError) {
          throw new BadRequestException({
            message: 'Unable to generate packages labels at USPS',
          });
        }

        if (parsedXML.Error) {
          throw new BadRequestException({
            message: `Unable to generate packages labels at USPS ${parsedXML.Error?.Description[0]}`,
          });
        }

        if (requestBody.API === 'eVS') {
          base64Labels.push({
            label: parsedXML.eVSResponse.LabelImage[0],
            receipt: parsedXML.eVSResponse.ReceiptImage[0],
            tracking: parsedXML.eVSResponse.BarcodeNumber[0],
          });
        } else {
          base64Labels.push({
            label: parsedXML.eVSExpressMailIntlResponse.LabelImage[0],
            receipt: parsedXML.eVSExpressMailIntlResponse.LabelImage[0],
            tracking: parsedXML.eVSExpressMailIntlResponse.BarcodeNumber[0],
          });
        }
      }

      return {
        tracking_number: String(base64Labels[0].tracking),
        label_base64: base64Labels[0].label,
      };
    } catch (error) {
      throw error;
    }
  }

  public async addressValidation(
    rateData: NewRateShipmentDTO,
  ): Promise<NewRateShipmentDTO> {
    let requestBody = this.uspsHelper.formatUSPSAddressValidation(
      rateData,
      'sender',
    );

    const { data } = await lastValueFrom(
      this.http.get(`${this.baseRatingUrl}/ShippingAPI.dll`, {
        params: requestBody,
      }),
    );

    let parsedOriginXML: USPSAddressValidation;
    let parsingXMLError = false;

    parseString(data, (err, parsed) => {
      if (!err) {
        parsedOriginXML = parsed;
        parsingXMLError = false;
      } else {
        parsedOriginXML = null;
        parsingXMLError = true;
      }
    });

    if (parsingXMLError) {
      throw new BadRequestException({
        message: 'Unable to quote packages at USPS',
      });
    }

    if (parsedOriginXML?.AddressValidateResponse?.Address[0]?.Error) {
      throw new BadRequestException('Fail');
    }

    const rateWithAddressValidated = rateData;

    if (rateData?.whereTo?.data?.country === 'US') {
      requestBody = this.uspsHelper.formatUSPSAddressValidation(
        rateData,
        'receiver',
      );

      const { data: data2 } = await lastValueFrom(
        this.http.get(`${this.baseRatingUrl}/ShippingAPI.dll`, {
          params: requestBody,
        }),
      );

      let parsedDestinyXML: USPSAddressValidation;

      parseString(data2, (err, parsed) => {
        if (!err) {
          parsedDestinyXML = parsed;
          parsingXMLError = false;
        } else {
          parsedDestinyXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to quote packages at USPS',
        });
      }

      if (parsedDestinyXML?.AddressValidateResponse?.Address[0]?.Error) {
        throw new BadRequestException('Fail');
      }

      if (
        parsedDestinyXML?.AddressValidateResponse?.Address[0]?.Zip4[0] ||
        parsedDestinyXML?.AddressValidateResponse?.Address[0]?.Zip5[0]
      ) {
        rateWithAddressValidated.whereTo.data = {
          ...rateWithAddressValidated.whereTo.data,
          zipCode4:
            parsedDestinyXML?.AddressValidateResponse?.Address[0]?.Zip4[0],
          addressLine:
            parsedDestinyXML?.AddressValidateResponse?.Address[0]?.Address2[0],
          city: parsedDestinyXML?.AddressValidateResponse?.Address[0]?.City[0],
          state:
            parsedDestinyXML?.AddressValidateResponse?.Address[0]?.State[0],
          zipCode:
            parsedDestinyXML?.AddressValidateResponse?.Address[0]?.Zip5[0],
        };
      }
      if (
        parsedDestinyXML?.AddressValidateResponse?.Address[0]?.ReturnText &&
        !rateData?.whereTo?.data?.additionalAddress
      ) {
        throw new BadRequestException(
          'USPS quote failed, additional address is necessary.',
        );
      }
    }

    if (
      parsedOriginXML?.AddressValidateResponse?.Address[0]?.Zip4[0] ||
      parsedOriginXML?.AddressValidateResponse?.Address[0]?.Zip5[0]
    ) {
      rateWithAddressValidated.whereFrom.data = {
        ...rateWithAddressValidated.whereFrom.data,
        zipCode4: parsedOriginXML?.AddressValidateResponse?.Address[0]?.Zip4[0],
        addressLine:
          parsedOriginXML?.AddressValidateResponse?.Address[0]?.Address2[0],
        city: parsedOriginXML?.AddressValidateResponse?.Address[0]?.City[0],
        state: parsedOriginXML?.AddressValidateResponse?.Address[0]?.State[0],
        zipCode: parsedOriginXML?.AddressValidateResponse?.Address[0]?.Zip5[0],
      };
    }

    if (
      parsedOriginXML?.AddressValidateResponse?.Address[0]?.ReturnText &&
      !rateData?.whereFrom?.data?.additionalAddress
    ) {
      throw new BadRequestException(
        'USPS quote failed, additional address is necessary.',
      );
    }

    return rateWithAddressValidated;
  }

  public async commitmentAndServices(
    rateReturn: NewRateShipmentReturnDTO,
    origin: string,
    destiny: string,
    dateFormatted: string,
    outsideUs: boolean,
    shipmentDate: string,
  ): Promise<{
    scheduleDeliveryDate: string;
    dropoffAddresses: NewRateShipmentReturnDropOffLocationDTO[];
    estimatedDeliveryDates: {
      minDeliveryDate: string;
      maxDeliveryDate: string;
    };
  }> {
    try {
      const requestBody = this.uspsHelper.formatCommitmentServices(
        rateReturn,
        origin,
        outsideUs ? '33126' : destiny,
        dateFormatted,
      );

      const { data } = await lastValueFrom(
        this.http.get(`${this.baseUrl}/ShippingAPI.dll`, {
          params: requestBody,
        }),
      );

      let parsedOriginXML: USPSServicesCommitmentResponse;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedOriginXML = parsed;
          parsingXMLError = false;
        } else {
          parsedOriginXML = null;
          parsingXMLError = true;
        }
      });

      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to get commitments and services at USPS',
        });
      }

      const scheduleDeliveryDate =
        rateReturn.service_code !== '77' &&
        rateReturn.rate_type !== 'Priority Mail Express International'
          ? parsedOriginXML?.SDCGetLocationsResponse?.Expedited[0]
              ?.Commitment[0]?.Location[0]?.SDD[0]
          : null;

      const street =
        parsedOriginXML?.SDCGetLocationsResponse?.Expedited[0]?.Commitment[0]
          ?.Location[0]?.Street[0];

      const state =
        parsedOriginXML?.SDCGetLocationsResponse?.Expedited[0]?.Commitment[0]
          ?.Location[0]?.State[0];

      const postal_code =
        parsedOriginXML?.SDCGetLocationsResponse?.Expedited[0]?.Commitment[0]
          ?.Location[0]?.ZIP[0];

      const city =
        parsedOriginXML?.SDCGetLocationsResponse?.Expedited[0]?.Commitment[0]
          ?.Location[0]?.City[0];

      const dropoffAddresses: NewRateShipmentReturnDTO['company']['drop_off'] =
        [
          {
            address: { street, state, postal_code, country: 'US', city },
            phone_number: '',
            company_name: '',
          },
        ];

      const formatToDate = parseISO(shipmentDate);

      const estimatedDeliveryDates =
        rateReturn?.service_code === '77'
          ? {
              minDeliveryDate: format(
                addBusinessDays(formatToDate, 2),
                'yyyy-MM-dd',
              ),
              maxDeliveryDate: format(
                addBusinessDays(formatToDate, 8),
                'yyyy-MM-dd',
              ),
            }
          : rateReturn?.rate_type === 'Priority Mail Express International'
          ? {
              minDeliveryDate: format(
                addBusinessDays(formatToDate, 3),
                'yyyy-MM-dd',
              ),
              maxDeliveryDate: format(
                addBusinessDays(formatToDate, 5),
                'yyyy-MM-dd',
              ),
            }
          : null;

      return {
        scheduleDeliveryDate,
        dropoffAddresses,
        estimatedDeliveryDates,
      };
    } catch (error) {
      return error;
    }
  }

  public async pickup(ratePayload: NewRateShipmentDTO) {
    const pickUpQuote = await this.pickUpAvailability(ratePayload);

    if (pickUpQuote?.CarrierPickupAvailabilityResponse?.CarrierRoute) {
      return { total: 3 };
    }

    return { total: 0 };
  }

  public async requestPickup(
    ratingPayload: NewRateShipmentDTO,
    sender: CheckoutParcelMember,
    serviceCode: string,
  ) {
    const pickupData = this.uspsHelper.formatSchedulePickup(
      ratingPayload.whereFrom.data,
      sender,
      serviceCode,
    );

    const { data } = await lastValueFrom(
      this.http.get(`${this.baseUrl}/ShippingAPI.dll`, {
        params: pickupData,
      }),
    );

    let parsedXML: USPSSchedulePickupResponse;
    let parsingXMLError = false;

    parseString(data, (err, parsed) => {
      if (!err) {
        parsedXML = parsed;
        parsingXMLError = false;
      } else {
        parsedXML = null;
        parsingXMLError = true;
      }
    });
    if (parsingXMLError) {
      throw new BadRequestException({
        message: 'Unable to quote packages at USPS',
      });
    }

    return parsedXML?.CarrierPickupScheduleResponse?.ConfirmationNumber?.[0];
  }

  public async cancelPickupRequest(confirmationNumber: string) {
    const cancePickupPayload = await this.uspsHelper.formatCancelPickupPayload(
      confirmationNumber,
    );

    const { data } = await lastValueFrom(
      this.http.get(`${this.baseUrl}/ShippingAPI.dll`, {
        params: cancePickupPayload,
      }),
    );

    let parsedXML;
    let parsingXMLError = false;

    parseString(data, (err, parsed) => {
      if (!err) {
        parsedXML = parsed;
        parsingXMLError = false;
      } else {
        parsedXML = null;
        parsingXMLError = true;
      }
    });
    if (parsingXMLError) {
      throw new BadRequestException({
        message: 'Unable to quote packages at USPS',
      });
    }
  }

  public async cancelShipment(barcodeNumber: string) {
    const canceShipmentPayload =
      await this.uspsHelper.formatCancelPickupPayload(barcodeNumber);

    const { data } = await lastValueFrom(
      this.http.get(`${this.baseUrl}/ShippingAPI.dll`, {
        params: canceShipmentPayload,
      }),
    );

    let parsedXML;
    let parsingXMLError = false;

    parseString(data, (err, parsed) => {
      if (!err) {
        parsedXML = parsed;
        parsingXMLError = false;
      } else {
        parsedXML = null;
        parsingXMLError = true;
      }
    });
    if (parsingXMLError) {
      throw new BadRequestException({
        message: 'Unable to cancel shipment at USPS',
      });
    }

    throw new BadRequestException('Shipment cancelled due operational issues.');
  }
}
