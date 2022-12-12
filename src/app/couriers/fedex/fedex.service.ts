import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import {
  NewRateShipmentDTO,
  NewRateShipmentFiltersDTO,
  NewRateShipmentReturnDropOffLocationDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
} from '../dto/newCouriers.dto';
import { FedexHelperService } from './fedex-helper/fedex-helper.service';
import { parseString } from 'xml2js';
import {
  FedexDropoffLocationsReturn,
  FedexDropoffLocationsReturnRest,
  FedexJsonAuth,
  FedexPickUpAvaibilityRestReturn,
  FedexPickUpAvaibilityReturn,
  FedexPickupRequestReturn,
  FedexRatingReturnJson,
  FedexRequestsTypes,
  FedexShipmentReturnJson,
  FedexTrackingReturn,
} from './interface/fedex.interface';
import { parcel_bookings } from '@generated/client';
import { S3Service } from '../../../vendors/s3/s3.service';
import { CheckoutParcelMember } from '../../checkout/interface/checkout.interface';
import { NewCheckoutParcelBookingDTO } from '../../checkout/dto/new-checkout.dto';
import { PDFDocument } from 'pdf-lib';
import { DocumentHelperService } from 'src/app/misc/document-helper/document-helper.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { format, parseISO } from 'date-fns';
import { IPickupAvailabilityData } from 'src/app/parcel-booking/interface/parcel-booking.interface';

@Injectable()
export class FedexService {
  private FEDEX_API_URL: string;
  private FEDEX_API_JSON_URL: string;

  constructor(
    private readonly fedexHelper: FedexHelperService,
    private readonly prisma: PrismaService,
    private readonly s3service: S3Service,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    private readonly documentHelper: DocumentHelperService,
  ) {
    this.FEDEX_API_URL = configService.get('FEDEX_API_URL');
    this.FEDEX_API_JSON_URL = configService.get('FEDEX_API_JSON_URL');
  }

  private status = {
    IN: 'LABEL_CREATED',
    PU: 'PICK_UP',
    DE: 'TRANSIT',
    IT: 'TRANSIT',
    DL: 'DELIVERED',
  };

  public async authFedexJsonAPi(): Promise<FedexJsonAuth> {
    try {
      const { fedexClientId, fedexSecretKey } =
        this.fedexHelper.returnFedexJsonSecrets();

      const payload = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: fedexClientId,
        client_secret: fedexSecretKey,
      });

      const { data } = await lastValueFrom(
        this.http.post<FedexJsonAuth>(
          `${this.FEDEX_API_JSON_URL}/oauth/token`,
          payload,
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      return data;
    } catch (error) {
      return error;
    }
  }

  public async rateFedexRest(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    try {
      if (
        rateData?.whatsInside.data.length > 1 ||
        rateData?.whatsInside.data[0].pieces > 1
      ) {
        throw new BadRequestException('Multi-piece shipment not ready');
      }
      const getFedexRequests = this.fedexHelper.fedexRequests(rateData);

      const fedexAuth = await this.authFedexJsonAPi();

      const responses: NewRateShipmentReturnDTO[] = [];

      if (
        rateData.whatsInside.data.length > 1 ||
        rateData.whatsInside.data[0].pieces > 1
      ) {
        throw new BadRequestException('Multiple packages not available!');
      }

      for (const iterator of getFedexRequests.services) {
        const getFedexPayload = this.fedexHelper.fedexQuotePayloadRest(
          iterator,
          rateData,
        );

        console.log('fedex rate payload', JSON.stringify(getFedexPayload));

        const { data } = await lastValueFrom(
          this.http.post<FedexRatingReturnJson>(
            `${this.FEDEX_API_JSON_URL}/rate/v1/rates/quotes`,
            getFedexPayload,
            {
              headers: {
                Authorization: `Bearer ${fedexAuth.access_token}`,
              },
            },
          ),
        );

        const dropoffLocations = await this.dropoffsRest(rateData, iterator);

        const pickupAvaibility = await this.pickUpAvailabilityRest(
          rateData,
          iterator,
        );

        const formattedResponse = this.fedexHelper.fedexJsonQuoteFormatted(
          data,
          rateData?.category,
          iterator,
          dropoffLocations ?? [],
          pickupAvaibility,
        );

        formattedResponse && responses.push(formattedResponse);
      }

      return { data: responses ?? null };
    } catch (error) {
      console.log('fedex error', error);
      return error;
    }
  }

  public async rateWithTypeRest(
    rateData: NewRateShipmentDTO,
    serviceCode: string,
    order: NewRateShipmentReturnDTO,
    senderEmail: string,
  ) {
    try {
      console.log(senderEmail);

      /* if (
        (senderEmail !== 'alirok@alirok.com' && rateData.category === 'land') ||
        (serviceCode === 'FEDEX_1_DAY_FREIGHT' &&
          senderEmail !== 'alirok@alirok.com')
      ) {
        throw new BadRequestException('Booking failed, Code 2');
      } */

      const getFedexRequests = this.fedexHelper.fedexRequests(rateData);

      getFedexRequests.services = getFedexRequests?.services?.filter(
        (services) => services.serviceCode === serviceCode,
      );

      if (getFedexRequests?.services?.length === 0) {
        throw new BadRequestException('Booking failed!');
      }

      const fedexAuth = await this.authFedexJsonAPi();

      const responses: NewRateShipmentReturnDTO[] = [];

      for (const iterator of getFedexRequests.services) {
        const getFedexPayload = this.fedexHelper.fedexQuotePayloadRest(
          iterator,
          rateData,
        );

        const { data } = await lastValueFrom(
          this.http.post<FedexRatingReturnJson>(
            `${this.FEDEX_API_JSON_URL}/rate/v1/rates/quotes`,
            getFedexPayload,
            {
              headers: {
                Authorization: `Bearer ${fedexAuth.access_token}`,
              },
            },
          ),
        );

        const pickupAvaibility = await this.pickUpAvailabilityRest(
          rateData,
          iterator,
        );

        const formattedResponse = this.fedexHelper.fedexJsonQuoteFormatted(
          data,
          rateData?.category,
          iterator,
          [],
          pickupAvaibility,
        );

        responses.push(formattedResponse);
      }

      let totalPrice = 0;

      const choosedQuote = responses.find(
        (i) => i.service_code === serviceCode,
      );

      if (!choosedQuote) {
        throw new BadRequestException('Booking failed. Cod #2');
      }

      const choosedQuoteServices = choosedQuote.services;

      if (rateData.category === 'land') {
        const landFreight = choosedQuoteServices
          .find((i) => i.name === 'Land Freight')
          .items.find((i) => i.name === 'Land Freight');

        if (!landFreight.selected && !landFreight.required) {
          throw new BadRequestException('Booking Failed. Cod #4');
        }

        totalPrice = landFreight.price.value;
      } else {
        const parcelFreight = choosedQuoteServices
          .find((i) => i.name === 'Parcel Freight')
          .items.find((i) => i.name === 'Parcel Freight');

        if (!parcelFreight.selected && !parcelFreight.required) {
          throw new BadRequestException('Booking Failed. Cod #4');
        }

        totalPrice = parcelFreight.price.value;
      }

      return totalPrice;
    } catch (error) {
      console.log(error?.response?.data);
      return error;
    }
  }

  public async shipmentRest(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    let trackingNumber = '';
    const order: NewRateShipmentReturnDTO = shipmentBody?.metadata as any;
    const rateData: NewRateShipmentDTO = shipmentBody?.quote as any;
    try {
      const fedexAuth = await this.authFedexJsonAPi();

      console.log('sender.phone', sender.phone);
      console.log('recipient.phone', recipient.phone);

      const getFedexPayload = this.fedexHelper.fedexShipmentPayloadRest(
        shipmentBody,
        {
          sender,
          recipient,
        },
      );

      console.log(JSON.stringify(getFedexPayload));

      const { data } = await lastValueFrom(
        this.http.post<FedexShipmentReturnJson>(
          `${this.FEDEX_API_JSON_URL}/ship/v1/shipments`,
          getFedexPayload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      const shipmentResponse = data.output.transactionShipments[0];

      trackingNumber = shipmentResponse.masterTrackingNumber;

      const PackageID =
        rateData.category === 'land'
          ? `ALIROK${String(shipmentBody.parcel_serial_number).padStart(
              7,
              '0',
            )}L`
          : `ALIROK${String(shipmentBody.parcel_serial_number).padStart(
              7,
              '0',
            )}P`;

      const allLabelsFileTipe = shipmentResponse.pieceResponses.map((i) =>
        i.packageDocuments.find((a) => a.contentType === 'LABEL')
          ? i.packageDocuments
          : null,
      );

      const formattedAllLabels: any = [].concat(
        ...allLabelsFileTipe.map((i) => i),
      );

      const mergedLabels = await this.makeFedexLabels(formattedAllLabels);

      const labelUrl = await this.s3service.put({
        file: Buffer.from(mergedLabels, 'base64'),
        contentType: 'application/pdf',
        folder: 'documents/labels',
        name: `${PackageID}.pdf`,
      });

      let invoiceUrl = '';

      if (getFedexPayload?.requestedShipment?.customsClearanceDetail) {
        invoiceUrl = await this.s3service.put({
          file: Buffer.from(
            shipmentResponse.shipmentDocuments[0].encodedLabel,
            'base64',
          ),
          contentType: 'application/pdf',
          folder: 'documents/invoices',
          name: `${PackageID}.pdf`,
        });
      }

      let requestPickup;

      if (
        getFedexPayload.requestedShipment.pickupType ===
        'CONTACT_FEDEX_TO_SCHEDULE'
      ) {
        requestPickup = this.fedexHelper.makePickupRequestPayload(
          order,
          rateData,
          sender,
          getFedexPayload.requestedShipment?.expressFreightDetail
            ?.bookingConfirmationNumber,
        );
      }

      return {
        id: shipmentResponse.pieceResponses[0].trackingNumber,
        shipmentId: trackingNumber,
        tracking_number: shipmentResponse.pieceResponses[0].trackingNumber,
        label_url: labelUrl,
        invoice_url: invoiceUrl,
        receipt_url: '',
        PackageID,
        requestPickup,
      };
    } catch (error) {
      if (trackingNumber) {
        return await this.cancelShipment(rateData, trackingNumber);
      }
      throw error;
    }
  }

  private async makeFedexLabels(
    labelsData: [
      {
        contentType: 'LABEL';
        copiesToPrint: 1;
        encodedLabel: string;
        docType: 'PDF';
      },
    ],
  ) {
    try {
      const pdfDoc = await PDFDocument.create();
      for (const iterator of labelsData) {
        const label = Buffer.from(iterator.encodedLabel, 'base64');
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

  public async shipmentRestFirstMile(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
    firsMileCourier,
    trackingReference,
  ) {
    try {
      const order: NewRateShipmentReturnDTO = shipmentBody.metadata as any;
      let quote: any = shipmentBody.quote as any;

      let firstMileDropoffAddress;

      switch (firsMileCourier) {
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
      const fedexAuth = await this.authFedexJsonAPi();

      const getFedexPayload = this.fedexHelper.fedexShipmentPayloadRest(
        { ...shipmentBody, quote },
        {
          sender,
          recipient,
        },
        true,
        trackingReference,
        firsMileCourier,
      );

      const { data } = await lastValueFrom(
        this.http.post<FedexShipmentReturnJson>(
          `${this.FEDEX_API_JSON_URL}/ship/v1/shipments`,
          getFedexPayload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      const shipmentResponse = data.output.transactionShipments[0];

      return {
        tracking_number: shipmentResponse.pieceResponses[0].trackingNumber,
        label_base64:
          shipmentResponse.pieceResponses[0].packageDocuments[0].encodedLabel,
      };

      return data;
    } catch (error) {
      return error;
    }
  }

  public async trackingRest(trackingNumber: string) {
    try {
      const getTrackingPayload = {
        includeDetailedScans: true,
        trackingInfo: [
          {
            trackingNumberInfo: {
              trackingNumber: trackingNumber,
            },
          },
        ],
      };

      const fedexAuth = await this.authFedexJsonAPi();

      const { data } = await lastValueFrom(
        this.http.post<FedexTrackingReturn>(
          `${this.FEDEX_API_JSON_URL}/track/v1/trackingnumbers`,
          getTrackingPayload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      let events = [];

      if (
        data?.output?.completeTrackResults?.[0]?.trackResults?.[0]?.scanEvents
          ?.length
      ) {
        events =
          data.output.completeTrackResults[0].trackResults[0].scanEvents.map(
            (i) => ({
              date: format(parseISO(i.date), 'yyyy-MM-dd'),
              description: i.eventDescription ?? 'No description',
              status: this.status[i?.derivedStatusCode] ?? 'No Status',
              rawStatus: i?.derivedStatusCode ?? 'No Raw Status',
            }),
          );
      }

      //  const reorderEvents = events.reverse();

      return { events };
    } catch (error) {
      return error;
    }
  }

  public async dropoffsRest(
    dropoffRequest: NewRateShipmentDTO,
    service: FedexRequestsTypes,
  ): Promise<NewRateShipmentReturnDropOffLocationDTO[]> {
    try {
      const fedexAuth = await this.authFedexJsonAPi();

      const payload = this.fedexHelper.makeRestDropoffPayload(
        dropoffRequest,
        service,
      );

      const { data } = await lastValueFrom(
        this.http.post<FedexDropoffLocationsReturnRest>(
          `${this.FEDEX_API_JSON_URL}/location/v1/locations`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      const formattedDropoffs = this.fedexHelper.formatDropoffAddresses(data);

      return formattedDropoffs;
    } catch (error) {
      return [];
    }
  }

  public async pickUpAvailabilityRest(
    pickupData: NewRateShipmentDTO,
    service: FedexRequestsTypes,
  ): Promise<NewRateShipmentReturnServiceDTO[]> {
    try {
      const fedexAuth = await this.authFedexJsonAPi();

      const payload = this.fedexHelper.makeRestPickupRequest(
        pickupData,
        service,
      );

      if (service.serviceCode !== 'FEDEX_GROUND') {
        const { data } = await lastValueFrom(
          this.http.post<FedexPickUpAvaibilityRestReturn>(
            `${this.FEDEX_API_JSON_URL}/pickup/v1/pickups/availabilities`,
            payload,
            {
              headers: {
                Authorization: `Bearer ${fedexAuth.access_token}`,
              },
            },
          ),
        );

        const formattedPickup = this.fedexHelper.formatPickupAvailabilityRest(
          service.serviceCode,
          payload?.dispatchDate,
          pickupData,
          data,
        );

        return formattedPickup;
      } else return null;
    } catch (error) {
      console.log(error?.response?.data);
      throw error;
    }
  }

  public async pickRequest(payload: any) {
    try {
      const fedexAuth = await this.authFedexJsonAPi();

      console.log('payload pickup', JSON.stringify(payload));

      const { data } = await lastValueFrom(
        this.http.post<FedexPickupRequestReturn>(
          `${this.FEDEX_API_JSON_URL}/pickup/v1/pickups`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      console.log('pickup request error', error?.response?.data?.errors);
      throw error;
    }
  }

  public async cancelPickupRequest(
    pickupData: FedexPickupRequestReturn,
    parcelBookingId: string,
    pickupDate: Date,
  ) {
    try {
      const fedexAuth = await this.authFedexJsonAPi();

      const formattedDate = format(pickupDate, 'yyyy-MM-dd');

      const payload = this.fedexHelper.makeFedexPickUpCancelPayload(
        pickupData,
        formattedDate,
      );

      const { data } = await lastValueFrom(
        this.http.put<FedexPickupRequestReturn>(
          `${this.FEDEX_API_JSON_URL}/pickup/v1/pickups/cancel`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      const metadata = { canceledPickup: data, requestedPickup: pickupData };

      await this.prisma.parcel_bookings.update({
        where: { parcel_booking_uuid: parcelBookingId },
        data: { pickup_metadata: metadata as any },
      });

      return data;
    } catch (error) {
      console.log(error?.response?.data?.errors);
      throw error;
    }
  }

  public async pickup(
    ratePayload: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
  ) {
    const getFedexRequests = this.fedexHelper.fedexRequests(ratePayload);

    const fedexService = getFedexRequests?.services?.find(
      (services) => services.serviceCode === order.service_code,
    );

    const pickupAvaibility = await this.pickUpAvailabilityRest(
      ratePayload,
      fedexService,
    );

    if (pickupAvaibility[0]?.items) {
      return { total: pickupAvaibility[0]?.items[0]?.price?.value || 0 };
    }

    return { total: 0 };
  }

  public async cancelShipment(
    quote: NewRateShipmentDTO,
    trackingNumber: string,
  ) {
    try {
      const originCountry = quote?.whereFrom?.data?.country;

      const fedexAuth = await this.authFedexJsonAPi();

      const payload = this.fedexHelper.makeFedexCancelShipmentPayload(
        originCountry,
        trackingNumber,
      );

      const { data } = await lastValueFrom(
        this.http.put(
          `${this.FEDEX_API_JSON_URL}/ship/v1/shipments/cancel`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${fedexAuth.access_token}`,
            },
          },
        ),
      );

      if (data?.output?.cancelledShipment) {
        throw new BadRequestException(
          'Shipment cancelled due operational issues.',
        );
      }
    } catch (error) {
      throw new BadRequestException('Not possible to cancel the shipment!');
    }
  }
}
