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
} from '../dto/newCouriers.dto';
import { UpsService } from '../ups/ups.service';
import {
  SkyPostalGetCityCode,
  SkyPostalGetCityCodeReturn,
  SkyPostalLabelsMerge,
  SkyPostalRateRequest,
  SkyPostalRateRequestReturn,
  SkyPostalRateRequestReturnData,
  SkyPostalShipmentCancelRequest,
  SkyPostalShipmentCancelReturn,
  SkyPostalShipmentRequest,
  SkyPostalShipmentReturn,
  SkyPostalTrackingRequest,
  SkyPostalTrackingReturn,
} from './interface/sky-postal.interface';
import { SkyPostalHelperService } from './sky-postal-helper/sky-postal-helper.service';
import { PDFDocument } from 'pdf-lib';
import { UspsService } from '../usps/usps.service';
import { CheckoutParcelMember } from '../../checkout/interface/checkout.interface';
import { DocumentHelperService } from '../../misc/document-helper/document-helper.service';
import { S3Service } from '../../../vendors/s3/s3.service';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import { FedexService } from '../fedex/fedex.service';

@Injectable()
export class SkyPostalService {
  private SKYPOSTAL_API_URL: string;

  constructor(
    private readonly skyPostalHelper: SkyPostalHelperService,
    private readonly configService: ConfigService,
    private readonly http: HttpService,
    private readonly formatter: FormattersService,
    private readonly upsService: UpsService,
    private readonly uspsService: UspsService,
    private readonly fedexService: FedexService,
    private readonly documentHelper: DocumentHelperService,
    private readonly s3Service: S3Service,
  ) {
    this.SKYPOSTAL_API_URL = configService.get('SKYPOSTAL_API_URL');
  }
  private status = {
    DRC: 'LABEL_CREATED',
    DCO: 'LABEL_CREATED',
    REC: 'PICK_UP',
    PRO: 'TRANSIT',
    AUW: 'TRANSIT',
    MNF: 'TRANSIT',
    DLY: 'TRANSIT',
    ATC: 'TRANSIT',
    CEN: 'TRANSIT',
    CCH: 'TRANSIT',
    TTC: 'TRANSIT',
    INT: 'TRANSIT',
    OUT: 'TRANSIT',
    DEL: 'DELIVERED',
  };

  async rate(rateData: NewRateShipmentDTO) {
    try {
      const getSkyPostalReqData =
        this.skyPostalHelper.skyPostalReqData(rateData);

      if (getSkyPostalReqData?.length === 0) {
        throw new BadRequestException('Not possible to quote skypostal!');
      }

      const responses: SkyPostalRateRequestReturnData[] = [];

      const city_code = await this.getCityCode(
        {
          user_info: this.skyPostalHelper.generateUserInfo(),
          zip_code_info: {
            country_iso_code: rateData?.whereTo?.data?.country,
            zip_code: rateData?.whereTo?.data?.zipCode,
          },
        },
        rateData?.whereTo?.data?.city,
      );

      for (const iterator of getSkyPostalReqData) {
        try {
          const requestBody: SkyPostalRateRequest[] =
            this.skyPostalHelper.generateBody(
              rateData,
              iterator?.rateServiceCode,
              iterator?.incoterm,
              Number(city_code),
            );

          const { data } = await lastValueFrom(
            this.http.post<SkyPostalRateRequestReturn>(
              `${this.SKYPOSTAL_API_URL}/wcf-services/service-shipment.svc/shipment/get-shipment-rate`,
              requestBody[0],
            ),
          );

          if (!data?.data[0]?._verify)
            throw new BadGatewayException('Skypostal quote with error');

          const rating = {
            ...data.data[0],
            incoterm: iterator.incoterm,
            rateServiceCode: iterator.rateServiceCode,
            description: iterator.description,
            daysInTransit: iterator.daysInTransit,
          };

          responses.push(rating);
        } catch (error) {
          return error;
        }
      }

      const { dropOffLocation, services } =
        await this.skyPostalHelper.servicesSkyPostal('usps', rateData, true);

      const formattedResponse: NewRateShipmentReturnDTO[] = [];

      for (const iterator of services) {
        const formatResponse =
          await this.skyPostalHelper.formatSkypostalResponse(
            responses,
            rateData,
            [iterator],
            dropOffLocation,
          );

        formatResponse.forEach((i) => formattedResponse?.push(i));
      }

      return { data: formattedResponse };
    } catch (error) {
      return error;
    }
  }

  async rateWithType(
    rateData: NewRateShipmentDTO,
    serviceCode: number,
    order: NewRateShipmentReturnDTO,
  ) {
    try {
      let getSkyPostalReqData = this.skyPostalHelper.skyPostalReqData(rateData);

      getSkyPostalReqData = getSkyPostalReqData.filter(
        (i) => i.rateServiceCode === serviceCode,
      );

      if (getSkyPostalReqData?.length === 0) {
        throw new BadRequestException('Not possible to quote skypostal!');
      }

      const responses: SkyPostalRateRequestReturnData[] = [];

      const city_code = await this.getCityCode(
        {
          user_info: this.skyPostalHelper.generateUserInfo(),
          zip_code_info: {
            country_iso_code: rateData?.whereTo?.data?.country,
            zip_code: rateData?.whereTo?.data?.zipCode,
          },
        },
        rateData?.whereTo?.data?.city,
      );

      for (const iterator of getSkyPostalReqData) {
        try {
          const requestBody: SkyPostalRateRequest[] =
            this.skyPostalHelper.generateBody(
              rateData,
              iterator?.rateServiceCode,
              iterator?.incoterm,
              Number(city_code),
            );

          const { data } = await lastValueFrom(
            this.http.post<SkyPostalRateRequestReturn>(
              `${this.SKYPOSTAL_API_URL}/wcf-services/service-shipment.svc/shipment/get-shipment-rate`,
              requestBody[0],
            ),
          );

          const rating = {
            ...data.data[0],
            incoterm: iterator.incoterm,
            rateServiceCode: iterator.rateServiceCode,
            description: iterator.description,
            daysInTransit: iterator.daysInTransit,
          };

          responses.push(rating);
        } catch (error) {
          return error;
        }
      }

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

      const { dropOffLocation, services } =
        await this.skyPostalHelper.servicesSkyPostal(
          firstMileCourier?.toLowerCase(),
          rateData,
          false,
        );

      const formatResponse = await this.skyPostalHelper.formatSkypostalResponse(
        responses,
        rateData,
        services,
        dropOffLocation,
      );

      let totalAmount = formatResponse[0].services.find(
        (i) => i.name === 'Parcel Freight',
      ).items[0].price.value;
      const findActualDuties = formatResponse[0].services.find(
        (i) => i.name === 'Duties & Taxes',
      );

      let findActualFirstMileFreight;
      let findActualFirstMilePickup;

      for (const data of formatResponse[0].services) {
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

  async shipment(
    parcelBooking: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    console.time('labels');
    console.log('skypostal shipment start');
    try {
      const order: NewRateShipmentReturnDTO = parcelBooking.metadata as any;
      const quote: NewRateShipmentDTO = parcelBooking.quote as any;
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

      const city_code = await this.getCityCode(
        {
          user_info: this.skyPostalHelper.generateUserInfo(),
          zip_code_info: {
            country_iso_code: quote?.whereTo?.data?.country,
            zip_code: quote?.whereTo?.data?.zipCode,
          },
        },
        quote?.whereTo?.data?.city,
      );

      console.log('cityCode', city_code);

      const requestBody: SkyPostalShipmentRequest =
        this.skyPostalHelper.formatShipment(
          parcelBooking,
          sender,
          recipient,
          firstMileCourier,
          Number(city_code),
        );

      console.log('requestBody', requestBody);

      const { data } = await lastValueFrom(
        this.http.post<SkyPostalShipmentReturn>(
          `${this.SKYPOSTAL_API_URL}/wcf-services/service-shipment.svc/shipment/new-shipment`,
          requestBody,
        ),
      );

      if (!data?.data[0]?._verify) {
        console.log('skypostal error', JSON.stringify(data));
      }

      const skyPostalLabel = data.data[0].label_image;

      const skyPostalInvoice = data?.data[0]?.label_invoice_url;
      if (!skyPostalLabel)
        throw new BadRequestException('Skypostal shipment request failed!');
      console.timeLog('labels', 'skypostal label');

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
        console.timeLog('labels', 'instructions');

        labels.push({
          labelBase64: base64File,
        });

        instructionsFile = base64File;
      }

      onlyLabels.push({
        labelBase64:
          firstMile?.selected &&
          firstMileCourier?.toLocaleLowerCase() !== 'fedex'
            ? await this.formatter.rotateImage(
                Buffer.from(skyPostalLabel, 'base64'),
                90,
              )
            : skyPostalLabel,
        courier: 'skypostal',
      });

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
              parcelBooking,
              {
                sender,
                recipient,
              },
              'skypostal',
              String(
                data?.data[0]?.label_tracking_number_01
                  ? data?.data[0]?.label_tracking_number_01
                  : data?.data[0]?.trck_nmr_fol,
              ),
            );

            firstMileTrackingNumber = tracking_number;
            firstMileLabelBase64 = label_base64;
            console.timeLog('labels', 'ups label');

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
              parcelBooking,
              {
                sender,
                recipient,
              },
              'skypostal',
              String(
                data?.data[0]?.label_tracking_number_01
                  ? data?.data[0]?.label_tracking_number_01
                  : data?.data[0]?.trck_nmr_fol,
              ),
            );

            firstMileTrackingNumber = uspsShipping.tracking_number;

            const convertedLabelInPng = await this.formatter.convertBtwTiffPng(
              Buffer.from(uspsShipping.label_base64, 'base64'),
            );

            firstMileLabelBase64 = await this.formatter.rotateImage(
              Buffer.from(convertedLabelInPng.split(',').pop(), 'base64'),
              90,
            );

            console.timeLog('labels', 'usps label');

            onlyLabels.push({
              labelBase64: firstMileLabelBase64,
              courier: 'usps',
            });

            break;

          case 'fedex':
            const fedexShipping = await this.fedexService.shipmentRestFirstMile(
              parcelBooking,
              {
                sender,
                recipient,
              },
              'skypostal',
              String(
                data?.data[0]?.label_tracking_number_01
                  ? data?.data[0]?.label_tracking_number_01
                  : data?.data[0]?.trck_nmr_fol,
              ),
            );

            firstMileTrackingNumber = fedexShipping.tracking_number;

            firstMileLabelBase64 = fedexShipping.label_base64;
            console.timeLog('labels', 'fedex label');

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
        masterLabel = await (await this.makeSkyPostalLabels(onlyLabels))
          .split(',')
          .pop();
      }
      console.timeLog('labels', 'make master label');
      const toMergeFiles: SkyPostalLabelsMerge[] = [];

      if (firstMile?.selected) {
        toMergeFiles.push({ labelBase64: instructionsFile });
      }

      toMergeFiles.push({ labelBase64: masterLabel });

      const mergeInstructions = await this.makeSkyPostalLabels(toMergeFiles);
      console.timeLog('labels', 'make master label with instructions');

      const PackageID = `ALIROK${String(
        parcelBooking.parcel_serial_number,
      ).padStart(7, '0')}P`;

      const labelUrl = await this.s3Service.put({
        file: Buffer.from(mergeInstructions, 'base64'),
        contentType: 'application/pdf',
        folder: 'documents/labels',
        name: `${PackageID}.pdf`,
      });
      console.timeLog('labels', 'save files on s3');
      console.timeEnd('labels');
      return {
        id: String(data.data[0].trck_nmr_fol),
        tracking_number: String(data.data[0].trck_nmr_fol),
        tracking_number_first_mile: String(firstMileTrackingNumber),
        label_url: labelUrl,
        receipt_url: '',
        PackageID,
      };
    } catch (error) {
      console.timeEnd('labels');
      throw error;
    }
  }

  private async makeSkyPostalLabels(labelsBase64: SkyPostalLabelsMerge[]) {
    try {
      const pdfDoc = await PDFDocument.create();
      for (const iterator of labelsBase64) {
        console.log('iterator', iterator?.courier);
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

  async cancelShipment(cancelShipData: any) {
    try {
      // generate body
      let requestBody: SkyPostalShipmentCancelRequest;

      const { data } = await lastValueFrom(
        this.http.post<SkyPostalShipmentCancelReturn>(
          `${this.SKYPOSTAL_API_URL}/wcf-services/service-shipment.svc/shipment/delete-pre-shipment`,
          requestBody,
        ),
      );

      //format response to generic

      return data;
    } catch (error) {
      return error;
    }
  }

  async tracking(trackingData: string) {
    try {
      const requestBody: SkyPostalTrackingRequest = {
        trck_nmr_fol: parseInt(trackingData),
        user_info: this.skyPostalHelper.generateUserInfo(),
      };

      const { data } = await lastValueFrom(
        this.http.post<SkyPostalTrackingReturn>(
          `${this.SKYPOSTAL_API_URL}/wcf-services/service-tracking.svc/tracking/by-trck-nmr-fol`,
          requestBody,
        ),
      );

      const events = data.data.map((i) => ({
        date: i.entry_date_db_str,
        description: i.track_description,
        status: this.status[i.track_cdg],
        rawStatus: i.track_cdg,
      }));

      const reorderEvents = events.reverse();

      return { events: reorderEvents ?? [] };
    } catch (error) {
      return error;
    }
  }

  async getCityCode(
    getData: SkyPostalGetCityCode,
    cityName?: string,
  ): Promise<string | number> {
    try {
      const isoCountry = getData.zip_code_info.country_iso_code;

      const cityCodesFromApi = ['BR', 'MX', 'CR', 'CL'];

      if (!cityCodesFromApi.includes(isoCountry)) {
        return await this.skyPostalHelper.getCityCodeFromCSV(getData, cityName);
      } else {
        const { data } = await lastValueFrom(
          this.http.post<SkyPostalGetCityCodeReturn>(
            `${this.SKYPOSTAL_API_URL}/wcf-services/service-geographic.svc/geographic/get-zipcode-info`,
            getData,
          ),
        );

        return data?.data[0]?.city_code ?? 0;
      }
    } catch (error) {
      console.log('error', error);
      return error;
    }
  }
}
