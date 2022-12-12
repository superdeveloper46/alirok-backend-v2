import { parcel_bookings } from '@generated/client';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { S3Service } from '../../../vendors/s3/s3.service';
import { CheckoutParcelMember } from '../../../../src/app/checkout/interface/checkout.interface';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
} from '../dto/newCouriers.dto';
import { BpsHelperService } from './bps-helper/bps-helper.service';
import {
  IBPSAcceptedCountryList,
  IBPSAcceptedCountryStateList,
  IBPSAuth,
  IBPSRatingPayload,
  IBPSServiceListReturn,
  IBPSSeviceValidationReturn,
  IBPSShipmentRequest,
  IBPSShipmentReturn,
  IBPSTrackingReturn,
} from './interface/bps.interface';
import { SkyPostalLabelsMerge } from '../sky-postal/interface/sky-postal.interface';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import { UpsService } from '../ups/ups.service';
import { UspsService } from '../usps/usps.service';
import { FedexService } from '../fedex/fedex.service';
import { PDFDocument } from 'pdf-lib';
import { DocumentHelperService } from 'src/app/misc/document-helper/document-helper.service';

@Injectable()
export class BpsService {
  private BPS_API_URL: string;
  private BPS_USERNAME: string;
  private BPS_PASSWORD: string;

  constructor(
    private readonly bpsHelper: BpsHelperService,
    private readonly s3service: S3Service,
    private readonly upsService: UpsService,
    private readonly uspsService: UspsService,
    private readonly fedexService: FedexService,
    private readonly s3Service: S3Service,
    private readonly http: HttpService,
    private readonly documentHelper: DocumentHelperService,
    private readonly formatterService: FormattersService,
    private readonly configService: ConfigService,
  ) {
    this.BPS_API_URL = configService.get('BPS_API_URL');
    this.BPS_USERNAME = configService.get('BPS_USERNAME');
    this.BPS_PASSWORD = configService.get('BPS_PASSWORD');
  }

  private async authenticate() {
    try {
      const authPayload = {
        username: this.BPS_USERNAME,
        password: this.BPS_PASSWORD,
      };

      const { data } = await lastValueFrom(
        this.http.post<IBPSAuth>(
          `${this.BPS_API_URL}/auth/token.json`,
          authPayload,
        ),
      );

      return {
        authData: data,
        token: `Bearer ${data?.accessToken}`,
      };
    } catch (error) {
      throw error;
    }
  }

  public async serviceList({
    origin,
    destiny,
  }: {
    origin: string;
    destiny: string;
  }) {
    try {
      const authPayload = await this.authenticate();

      const { data } = await lastValueFrom(
        this.http.get<IBPSServiceListReturn[]>(
          `${this.BPS_API_URL}/get/services.json?origin_country=${origin}&destination_country=${destiny}`,
          {
            headers: {
              Authorization: authPayload.token,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  public async serviceValidationList(serviceCode: string) {
    try {
      const authPayload = await this.authenticate();

      const urlQuery = new URLSearchParams();

      urlQuery.append('service_id', serviceCode);

      const { data } = await lastValueFrom(
        this.http.get<IBPSSeviceValidationReturn>(
          `${this.BPS_API_URL}/get/service_validation_rules.json${urlQuery}`,
          {
            headers: {
              Authorization: authPayload.token,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  public async serviceValidationCountry(country: string) {
    try {
      const authPayload = await this.authenticate();

      const { data } = await lastValueFrom(
        this.http.get<IBPSAcceptedCountryList[]>(
          `${this.BPS_API_URL}/get/countries.json`,
          {
            headers: {
              Authorization: authPayload.token,
            },
          },
        ),
      );

      return !data.some((i) => i.iso_code === country);
    } catch (error) {
      throw error;
    }
  }

  public async serviceValidationCountryState(
    destinationCountry: string,
    destinationState: string,
  ) {
    try {
      const authPayload = await this.authenticate();

      const urlQuery = new URLSearchParams();

      urlQuery.append('country_iso_code', destinationCountry);

      const { data } = await lastValueFrom(
        this.http.get<IBPSAcceptedCountryStateList[]>(
          `${this.BPS_API_URL}/get/country/states.json${urlQuery}`,
          {
            headers: {
              Authorization: authPayload.token,
            },
          },
        ),
      );

      return !data.some((i) => i.name === destinationState);
    } catch (error) {
      throw error;
    }
  }

  public async rating(rateData: NewRateShipmentDTO) {
    try {
      const authPayload = await this.authenticate();

      const serviceList = await this.serviceList({
        origin: rateData.whereFrom.data.country,
        destiny: rateData.whereTo.data.country,
      });

      const ratings: IBPSAuth[] = [];

      for (const iterator of serviceList) {
        const ratingPayload: IBPSRatingPayload =
          await this.bpsHelper.buildRatingPayload(rateData, iterator.code);

        const { data } = await lastValueFrom(
          this.http.post(
            `${this.BPS_API_URL}/rates/calculator.json`,
            ratingPayload,
            {
              headers: {
                Authorization: authPayload.token,
              },
            },
          ),
        );

        ratings.push(data);
      }

      return ratings;
    } catch (error) {
      throw error;
    }
  }

  private bpsWeightValidation(rateData: NewRateShipmentDTO) {
    const destinyCountry = rateData.whereTo.data.country;
    const weightUnit = rateData.whatsInside.data[0].weight.unit;
    const weightLb =
      weightUnit === 'lb'
        ? rateData.whatsInside.data[0].weight.value
        : this.formatterService.convertKgsToLbs(
            rateData.whatsInside.data[0].weight.value,
          );
    if (destinyCountry === 'BR') {
      if (weightLb < 0.25) {
        return false;
      }

      if (weightLb > 66) {
        return false;
      }
    }

    if (destinyCountry === 'MX') {
      if (weightLb < 1) {
        return false;
      }
      if (weightLb > 150) {
        return false;
      }
    }

    return true;
  }

  private bpsAcceptedCountries(country: string) {
    switch (country) {
      case 'BR':
        return true;
        break;
      case 'MX':
        return true;
        break;

      default:
        return false;
        break;
    }
  }

  private bpsDimensionValidation(rateData: NewRateShipmentDTO) {
    const shipPackage = rateData.whatsInside.data[0];
    const dimensionUnit = shipPackage.dimensions.unit;
    const destinyCountry = rateData.whereTo.data.country;

    const heightCm =
      dimensionUnit === 'in'
        ? this.formatterService.convertInchesInCM(shipPackage.dimensions.height)
        : shipPackage.dimensions.height;
    const widhtCm =
      dimensionUnit === 'in'
        ? this.formatterService.convertInchesInCM(shipPackage.dimensions.width)
        : shipPackage.dimensions.width;
    const lenghtCm =
      dimensionUnit === 'in'
        ? this.formatterService.convertInchesInCM(shipPackage.dimensions.length)
        : shipPackage.dimensions.length;

    if (destinyCountry === 'BR') {
      if (lenghtCm < 16 || widhtCm < 11) {
        return false;
      }

      if (lenghtCm + widhtCm + heightCm >= 200) {
        return false;
      }

      if (lenghtCm > 105 || widhtCm > 105 || heightCm > 105) {
        return false;
      }
    }

    if (destinyCountry === 'MX') {
      if (lenghtCm < 16 || widhtCm < 11) {
        return false;
      }

      if (lenghtCm + widhtCm + heightCm >= 609) {
        return false;
      }

      if (lenghtCm > 203 || widhtCm > 203 || heightCm > 203) {
        return false;
      }
    }

    return true;
  }

  public bpsMexicoDutiesAndTaxes(rateData: NewRateShipmentDTO) {
    const destinationCountry = rateData.whereTo.data.country;

    if (destinationCountry !== 'MX') {
      throw new BadRequestException(
        'This calculation is only for Mexico shipments!',
      );
    }

    const shipPackage = rateData.whatsInside.data[0];

    let totalAmount = 0;

    for (const item of shipPackage.items) {
      totalAmount += item.price.value;
    }

    if (totalAmount < 50) {
      return 0;
    }

    if (totalAmount > 50 && totalAmount < 117) {
      return totalAmount + totalAmount * 0.17;
    }

    if (totalAmount > 117 && totalAmount < 1000) {
      return totalAmount + totalAmount * 0.19;
    }

    if (totalAmount > 1000) {
      throw new BadRequestException(
        'Total items cost is above taxation limits for Mexico!',
      );
    }

    return 0;
  }

  public async ratingStatic(rateData: NewRateShipmentDTO) {
    if (
      rateData.whatsInside.data.length > 1 ||
      rateData.whatsInside.data[0].pieces > 1
    ) {
      return new BadRequestException(
        'Working only with one package per shipment!',
      );
    }

    try {
      if (!this.bpsAcceptedCountries(rateData.whereTo.data.country)) {
        return new BadRequestException(
          'BPS does not provide rates for this country!',
        );
      }

      if (!this.bpsWeightValidation(rateData)) {
        return new BadRequestException('BPS minimum weight validation!');
      }

      if (
        await this.serviceValidationCountry(rateData?.whereTo?.data?.country)
      ) {
        return new BadRequestException(
          'BPS does not provide rates for this country!',
        );
      }

      if (
        await this.serviceValidationCountryState(
          rateData?.whereTo?.data?.country,
          rateData?.whereTo?.data?.state,
        )
      ) {
        return new BadRequestException(
          'BPS does not provide rates for this country!',
        );
      }

      if (!this.bpsDimensionValidation(rateData)) {
        return new BadRequestException('Dimesion or Weight validation');
      }

      const company = {
        logo_url: 'https://static.alirok.io/collections/logos/bps_logo.png',
        name: 'BPS',
        rating: 0,
        drop_off: [
          {
            company_name: 'BPS - Bringer Parcel Service',
            phone_number: 'empty',
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

      const bpsTypes = this.bpsHelper.getBpsRatingTypes(
        rateData.whereTo.data.country,
      );

      const bpsFreight = this.bpsHelper.staticBpsParcelFreight(
        rateData,
        bpsTypes,
      );

      const responses: NewRateShipmentReturnDTO[] = [];

      const bpsFirstMile = await this.bpsHelper.servicesBps(
        'ups',
        rateData,
        true,
        false,
      );

      for (const firstMiles of bpsFirstMile.services) {
        for (const iterator of bpsFreight) {
          const bpsService: NewRateShipmentReturnDTO = iterator;

          const formattedData: NewRateShipmentReturnDTO = {
            company,
            delivery: {
              date: null,
              days_in_transit: 13,
            },
            price: bpsService?.price,
            rate_type: bpsService?.rate_type,
            service_code: bpsService?.service_code,
            services: [firstMiles, ...bpsService.services],
          };

          responses.push(formattedData);
        }
      }

      return { data: responses };
    } catch (error) {
      return error;
    }
  }

  public async rateStaticWithType(
    rateData: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    serviceCode: string,
  ) {
    if (
      rateData.whatsInside.data.length > 1 ||
      rateData.whatsInside.data[0].pieces > 1
    ) {
      return new BadRequestException(
        'Working only with one package per shipment!',
      );
    }
    try {
      if (!this.bpsAcceptedCountries(rateData.whereTo.data.country)) {
        return new BadRequestException(
          'BPS does not provide rates for this country!',
        );
      }

      if (!this.bpsWeightValidation(rateData)) {
        return new BadRequestException('BPS minimum weight validation!');
      }

      if (
        await this.serviceValidationCountry(rateData?.whereTo?.data?.country)
      ) {
        return new BadRequestException(
          'BPS does not provide rates for this country!',
        );
      }

      if (!this.bpsDimensionValidation(rateData)) {
        return new BadRequestException('Dimesion or Weight validation');
      }

      const company = {
        logo_url: 'https://static.alirok.io/collections/logos/bps_logo.png',
        name: 'BPS',
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
              country: 'US',
            },
          },
        ],
      };

      const bpsTypes = this.bpsHelper
        .getBpsRatingTypes(rateData.whereTo.data.country)
        .filter((i) => i.rateType === serviceCode);

      console.log('bpsTypes', bpsTypes);

      const bpsFreight = this.bpsHelper.staticBpsParcelFreight(
        rateData,
        bpsTypes,
      );

      console.log('bpsFreight', bpsFreight);

      const responses: NewRateShipmentReturnDTO[] = [];

      let firstMile: NewRateShipmentReturnServiceServiceItemDTO;
      let firstMilePickUp;
      let firstMileCourier;

      for (const data of order.services) {
        if (
          data?.items?.find((i) => i.name === 'First Mile')?.selected ||
          data?.items?.find((i) => i.name === 'First Mile')?.required
        ) {
          firstMile = data?.items?.find((i) => i.name === 'First Mile');
          firstMileCourier = data?.company?.name;
        }

        if (
          data?.items?.find((i) => i.name === 'Pick-up')?.selected ||
          data?.items?.find((i) => i.name === 'Pick-up')?.required
        ) {
          firstMilePickUp = data?.items?.find((i) => i.name === 'Pick-up');
        }
      }

      const bpsFirstMile = await this.bpsHelper.servicesBps(
        firstMileCourier?.toLowerCase(),
        rateData,
        false,
        false,
      );

      console.log('bpsFirstMile', bpsFirstMile);

      if (firstMile?.selected || firstMile?.required) {
        for (const firstMiles of bpsFirstMile.services) {
          for (const iterator of bpsFreight) {
            const bpsService: NewRateShipmentReturnDTO = iterator;

            const formattedData: NewRateShipmentReturnDTO = {
              company,
              delivery: {
                date: null,
                days_in_transit: 13,
              },
              price: bpsService?.price,
              rate_type: bpsService?.rate_type,
              service_code: bpsService?.service_code,
              services: [firstMiles, ...bpsService.services],
            };
            console.log('formattedData', formattedData);
            responses.push(formattedData);
          }
        }
      } else {
        for (const iterator of bpsFreight) {
          const bpsService: NewRateShipmentReturnDTO = iterator;

          const formattedData: NewRateShipmentReturnDTO = {
            company,
            delivery: {
              date: null,
              days_in_transit: 13,
            },
            price: bpsService?.price,
            rate_type: bpsService?.rate_type,
            service_code: bpsService?.service_code,
            services: [...bpsService.services],
          };
          console.log('formattedData', formattedData);
          responses.push(formattedData);
        }
      }

      console.log(responses);

      let totalAmount = responses[0].services.find(
        (i) => i.name === 'Parcel Freight',
      ).items[0].price.value;
      const findActualDuties = responses[0].services.find(
        (i) => i.name === 'Duties & Taxes',
      );

      let findActualFirstMileFreight;
      let findActualFirstMilePickup;

      for (const data of responses[0].services) {
        if (data?.company?.name === firstMileCourier) {
          findActualFirstMileFreight = data?.items?.find(
            (i) => i.name === 'First Mile',
          );

          findActualFirstMilePickup = data?.items?.find(
            (i) => i.name === 'Pick-up',
          );
        }
      }

      const findDuties = order.services.find(
        (i) => i.name === 'Duties & Taxes',
      );

      if (
        findDuties?.items[0]?.selected ||
        findActualDuties?.items[0]?.required
      ) {
        totalAmount += findActualDuties.items[0].price.value;
      }

      if (firstMile?.selected) {
        totalAmount += findActualFirstMileFreight?.price?.value;

        // if (firstMilePickUp?.selected) {
        //   totalAmount += findActualFirstMilePickup?.price?.value;
        // }
      }

      return totalAmount;
    } catch (error) {
      return error;
    }
  }

  public async rateWithType(
    rateData: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    serviceCode: string,
  ) {
    try {
      const authPayload = await this.authenticate();

      const serviceList = (
        await this.serviceList({
          origin: rateData.whereFrom.data.country,
          destiny: rateData.whereTo.data.country,
        })
      )?.filter((i) => i.code === serviceCode);

      const ratings: IBPSAuth[] = [];

      for (const iterator of serviceList) {
        const ratingPayload: IBPSRatingPayload =
          await this.bpsHelper.buildRatingPayload(rateData, iterator.code);

        const { data } = await lastValueFrom(
          this.http.post(
            `${this.BPS_API_URL}/rates/calculator.json`,
            ratingPayload,
            {
              headers: {
                Authorization: authPayload.token,
              },
            },
          ),
        );

        ratings.push(data);
      }

      return ratings;
    } catch (error) {
      throw error;
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
      const order: NewRateShipmentReturnDTO = shipmentBody.metadata as any;
      const quote: NewRateShipmentDTO = shipmentBody.quote as any;
      let firstMile;
      let firstMilePickUp;
      let firstMileCourier;

      for (const data of order.services) {
        if (data?.items?.find((i) => i.name === 'First Mile')?.selected) {
          firstMile = data?.items?.find((i) => i.name === 'First Mile');
          firstMileCourier = data?.company?.name;
        }

        if (data?.items?.find((i) => i.name === 'Pick-up')?.selected) {
          firstMilePickUp = data?.items?.find((i) => i.name === 'Pick-up');
        }
      }

      const authPayload = await this.authenticate();

      const shippingPayload: IBPSShipmentRequest =
        this.bpsHelper.buildShippingPayload(
          sender,
          recipient,
          shipmentBody.quote as any,
          shipmentBody.metadata as any,
        );

      const { data } = await lastValueFrom(
        this.http.post<IBPSShipmentReturn>(
          `${this.BPS_API_URL}/create/parcel/complete.json`,
          shippingPayload,
          {
            headers: {
              Authorization: authPayload.token,
            },
          },
        ),
      );

      const parcelTrackingNumber = data.label.trackingNumber;

      if (data?.id) {
        const parcel = await this.retrieveLabelPDF(String(data.id));
        let firstMileLabelBase64 = '';
        let firstMileTrackingNumber = '';
        const labels: SkyPostalLabelsMerge[] = [];
        const onlyLabels: SkyPostalLabelsMerge[] = [];
        let instructionsFile = '';

        if (firstMile?.selected) {
          const response = await lastValueFrom(
            this.http.get(
              'https://static.alirok.io/collections/images/FM_Instructions.pdf',
              {
                responseType: 'arraybuffer',
              },
            ),
          );

          const base64File = Buffer.from(response.data, 'binary').toString(
            'base64',
          );

          labels.push({
            labelBase64: base64File,
          });

          instructionsFile = base64File;
        }

        if (firstMile?.selected) {
          switch (firstMileCourier.toLowerCase()) {
            case 'ups':
              const {
                shipTo,
                shipFrom,
                label_base64,
                order,
                packages,
                quote,
                shipper,
                tracking_number,
              } = await this.upsService.firstMileShipment(
                shipmentBody,
                {
                  sender,
                  recipient,
                },
                'bps',
                String(parcelTrackingNumber),
              );

              firstMileTrackingNumber = tracking_number;
              firstMileLabelBase64 = label_base64;

              if (firstMilePickUp?.selected) {
                await this.upsService.requestPickup({
                  shipper,
                  order,
                  packages,
                  quote,
                  shipFrom,
                  shipTo,
                  trackingNumber: tracking_number,
                });
              }

              onlyLabels.push({
                labelBase64: firstMileLabelBase64.split(',').pop(),
                courier: 'ups',
              });
              break;

            case 'usps':
              const uspsShipping = await this.uspsService.firstMileShipment(
                shipmentBody,
                {
                  sender,
                  recipient,
                },
                'bps',
                String(parcelTrackingNumber),
              );

              firstMileTrackingNumber = uspsShipping.tracking_number;

              const convertedLabelInPng =
                await this.formatterService.convertBtwTiffPng(
                  Buffer.from(uspsShipping.label_base64, 'base64'),
                );

              firstMileLabelBase64 = await this.formatterService.rotateImage(
                Buffer.from(convertedLabelInPng.split(',').pop(), 'base64'),
                90,
              );

              onlyLabels.push({
                labelBase64: firstMileLabelBase64,
                courier: 'usps',
              });

              break;

            case 'fedex':
              const fedexShipping =
                await this.fedexService.shipmentRestFirstMile(
                  shipmentBody,
                  {
                    sender,
                    recipient,
                  },
                  'bps',
                  String(parcelTrackingNumber),
                );

              firstMileTrackingNumber = fedexShipping.tracking_number;

              firstMileLabelBase64 = fedexShipping.label_base64;

              onlyLabels.push({
                labelBase64: firstMileLabelBase64,
                courier: 'fedex',
              });

            default:
              break;
          }
        }

        let masterLabel;

        if (
          firstMile?.selected &&
          firstMileCourier.toLocaleLowerCase() !== 'fedex'
        ) {
          masterLabel = await (await this.mergePngLabels(onlyLabels))
            .split(',')
            .pop();
        } else {
          masterLabel = await (await this.makeBpsLabels(onlyLabels))
            .split(',')
            .pop();
        }
        const toMergeFiles: SkyPostalLabelsMerge[] = [];

        if (firstMile?.selected) {
          toMergeFiles.push({ labelBase64: instructionsFile });
        }

        toMergeFiles.push({
          labelBase64: Buffer.from(parcel, 'binary').toString('base64'),
          courier: 'bps',
        });

        toMergeFiles.push({ labelBase64: masterLabel });

        const mergeInstructions = await this.makeBpsLabels(toMergeFiles);

        const PackageID =
          quote.category === 'land'
            ? `ALIROK${String(shipmentBody.parcel_serial_number).padStart(
                7,
                '0',
              )}L`
            : `ALIROK${String(shipmentBody.parcel_serial_number).padStart(
                7,
                '0',
              )}P`;

        const labelUrl = await this.s3Service.put({
          file: Buffer.from(mergeInstructions, 'base64'),
          contentType: 'application/pdf',
          folder: 'documents/labels',
          name: `${PackageID}.pdf`,
        });

        return {
          id: data.externalReferenceCode,
          tracking_number: parcelTrackingNumber,
          tracking_number_first_mile: String(firstMileTrackingNumber),
          label_url: labelUrl,
          receipt_url: '',
          PackageID,
        };
      }

      return data;
    } catch (error) {
      console.log(error.response?.data?.data);
      throw error;
    }
  }

  public async tracking(parcelId: string) {
    try {
      const authPayload = await this.authenticate();

      const { data } = await lastValueFrom(
        this.http.post<IBPSTrackingReturn>(
          `${this.BPS_API_URL}/parcel/tracking/scan.json`,
          { parcelId },
          {
            headers: {
              Authorization: authPayload.token,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  public async retrieveLabelPDF(parcelId: string) {
    try {
      const authPayload = await this.authenticate();

      const urlQuery = new URLSearchParams();

      urlQuery.append('id', parcelId);

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.BPS_API_URL}/get/parcel/labels.json?${urlQuery}`,
          { parcelId },
          {
            responseType: 'arraybuffer',
            headers: {
              Authorization: authPayload.token,
              ContentType: 'application/pdf',
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  private async makeBpsLabels(labelsBase64: SkyPostalLabelsMerge[]) {
    try {
      const pdfDoc = await PDFDocument.create();
      for (const iterator of labelsBase64) {
        const label = Buffer.from(iterator.labelBase64, 'base64');
        const pdf = await PDFDocument.load(label);
        const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          pdfDoc.addPage(page);
        });
      }
      const mergedPdfFile = await pdfDoc.save();
      const labelsFormattedPdf =
        this.documentHelper.uInt8ArrayToBase64(mergedPdfFile);
      return labelsFormattedPdf;
    } catch (error) {
      throw error;
    }
  }

  public async mergePngLabels(labels: SkyPostalLabelsMerge[]) {
    const trackingsArray: SkyPostalLabelsMerge[] = Array.isArray(labels)
      ? labels
      : [labels];

    const pdfDocument = new DocumentHelperService();

    for (const [index, data] of trackingsArray.entries()) {
      const label = data.labelBase64;

      const DOC_MARGIN_X = 7;
      const DOC_MARGIN_Y = 7;
      const DOC_MAX_WIDTH = 190;
      const DOC_MAX_HEIGHT = 290;

      const DOC_IMAGE_WIDTH = DOC_MAX_WIDTH - DOC_MARGIN_X * 2;
      const DOC_IMAGE_HEIGHT = (DOC_MAX_HEIGHT - DOC_MARGIN_Y * 4) / 2;

      const DOC_IMAGE_POSITIONS = {
        TOP: DOC_MARGIN_Y,
        BOTTOM: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 3,
      };

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
}
