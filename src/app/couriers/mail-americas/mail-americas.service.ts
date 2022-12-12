import { parcel_bookings } from '@generated/client';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../../vendors/s3/s3.service';
import { CheckoutParcelMember } from '../../../../src/app/checkout/interface/checkout.interface';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
} from '../dto/newCouriers.dto';
import { lastValueFrom } from 'rxjs';
import {
  IMailAmericasShipmentReturn,
  IMailAmericasShippingPayload,
} from './interface/mail-americas.interface';
import { MailAmericasHelperService } from './mail-americas-helper/mail-americas-helper.service';
import { format } from 'path';
import { SkyPostalLabelsMerge } from '../sky-postal/interface/sky-postal.interface';

@Injectable()
export class MailAmericasService {
  private MAIL_AMERICAS_TOKEN: string;
  private MAIL_AMERICAS_URL: string;

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    private readonly s3service: S3Service,
    private readonly mailAmericasHelper: MailAmericasHelperService,
  ) {
    this.MAIL_AMERICAS_TOKEN = configService.get('MAIL_AMERICAS_TOKEN');
    this.MAIL_AMERICAS_URL = configService.get('MAIL_AMERICAS_URL');
  }

  public async rate(rateData: NewRateShipmentDTO) {
    try {
      const quotes = this.mailAmericasHelper.ratingPayload(rateData);

      const { dropOffLocation, services } =
        await this.mailAmericasHelper.servicesFirstMile('usps', rateData, true);

      const quotesFormatted: NewRateShipmentReturnDTO[] = [];

      console.log(services.length);

      for (const service of services) {
        console.log('service', service.company.name);
        for (const quote of quotes) {
          console.log('inside quote');
          const actualQuote = quote;

          const formattedServices = [...actualQuote.services, service];

          actualQuote.services = formattedServices.reverse();

          quotesFormatted.push(actualQuote);
        }
      }

      return { data: quotesFormatted };
    } catch (error) {
      console.log('error', error);
      return error;
    }
  }

  public async rateWithType(
    rateData: NewRateShipmentDTO,
    serviceCode: number,
    order: NewRateShipmentReturnDTO,
  ) {
    try {
      let totalAmount = this.mailAmericasHelper.rateWithType(order, rateData);

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
        await this.mailAmericasHelper.servicesFirstMile(
          firstMileCourier?.toLowerCase(),
          rateData,
          false,
        );

      let findActualFirstMileFreight;
      let findActualFirstMilePickup;

      for (const data of services) {
        if (data?.company?.name === firstMileCourier) {
          findActualFirstMileFreight = data?.items?.find(
            (i) => i.name === 'First Mile',
          );

          findActualFirstMilePickup = data?.items?.find(
            (i) => i.name === 'Pick-up',
          );
        }
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

  public async shipping(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    try {
      const order: NewRateShipmentReturnDTO = shipmentBody.metadata as any;
      const quote: NewRateShipmentDTO = shipmentBody.quote as any;
      let firstMile: NewRateShipmentReturnServiceServiceItemDTO;
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
      const payload: IMailAmericasShippingPayload =
        this.mailAmericasHelper.shipmentPayload(shipmentBody, {
          sender,
          recipient,
        });

      console.log('payload', JSON.stringify(payload));

      const { data } = await lastValueFrom(
        this.http.post<IMailAmericasShipmentReturn>(
          `${this.MAIL_AMERICAS_URL}/api/v1/admission?access_token=${this.MAIL_AMERICAS_TOKEN}`,
          payload,
        ),
      );

      if (data.error || !data.data?.label) {
        console.log(JSON.stringify(data));
        throw new BadRequestException('Mail Americas label failed.');
      }

      const toMergeFiles =
        await this.mailAmericasHelper.handleFirstMileShipments(
          firstMile,
          firstMilePickUp,
          firstMileCourier,
          data.data.label,
          data.data.tracking,
          shipmentBody,
          sender,
          recipient,
        );

      const mergeInstructions =
        await this.mailAmericasHelper.makeMailAmericasLabels(toMergeFiles);

      const PackageID = `ALIROK${String(
        shipmentBody.parcel_serial_number,
      ).padStart(7, '0')}P`;

      const labelUrl = await this.s3service.put({
        file: Buffer.from(mergeInstructions, 'base64'),
        contentType: 'application/pdf',
        folder: 'documents/labels',
        name: `${PackageID}.pdf`,
      });

      return {
        id: String(data.data.tracking),
        tracking_number: String(data.data.tracking),
        label_url: labelUrl,
        receipt_url: '',
        PackageID,
      };
    } catch (error) {
      console.log('error shipping mail americas', error);
      throw error;
    }
  }

  public async tracking(trackingNumber: string) {
    try {
      const payload = '';

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.MAIL_AMERICAS_URL}/api/v2/events?tracking=${trackingNumber}&access_token=${this.MAIL_AMERICAS_TOKEN}`,
          payload,
        ),
      );

      const formattedTracking = '';

      return formattedTracking;
    } catch (error) {
      return error;
    }
  }
}
