import { courier } from '@generated/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CouriersService } from '../couriers/couriers.service';
import { CheckoutHelperService } from './checkout-helper/checkout-helper.service';
import { NewCheckoutParcelBookingDTO } from './dto/new-checkout.dto';
import { pdfInvoice } from '../misc/pdf-generator';
import { createAlirokLabel } from '../misc/generate-label';
import { generateBL } from '../misc/bill-of-lading';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../couriers/dto/newCouriers.dto';
import { parseISO } from 'date-fns';

const landFreightsWithAlirokDocs = ['clearlane', 'glt'];
@Injectable()
export class CheckoutService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly checkoutHelper: CheckoutHelperService,
    private readonly configService: ConfigService,
    private readonly couriesService: CouriersService,
    private readonly http: HttpService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async parcelCheckout(
    parcelBookingData: NewCheckoutParcelBookingDTO,
    request: Request,
  ) {
    console.time('checkout');
    return await this.prisma.$transaction(
      async (prisma) => {
        const parcelBookingId = parcelBookingData.parcelBookingId;
        let pickupData;

        const findParcelBooking = await this.checkoutHelper.findParcelBooking(
          parcelBookingId,
          prisma,
        );
        console.timeLog('checkout', 'findParcelBooking');

        if (findParcelBooking?.confirmed) {
          throw new BadRequestException(
            'Checkout already executed or booking not found!',
          );
        }

        const findUser = await this.checkoutHelper.findUser(
          findParcelBooking.user_uuid,
          prisma,
        );
        console.timeLog('checkout', 'findUser');

        const findParcelRateSource =
          await this.checkoutHelper.findParcelRateSource(
            findParcelBooking.parcel_rate_source_uuid,
            prisma,
          );
        console.timeLog('checkout', 'findParcelRateSource');

        const quote: NewRateShipmentDTO = findParcelBooking.quote as any;
        const order: NewRateShipmentReturnDTO =
          findParcelBooking.metadata as any;

        const { recipient, sender, thirdParty } =
          await this.checkoutHelper.handleMembers(findParcelBooking);
        console.timeLog('checkout', 'handleMembers');

        let findParcelRateHandler =
          await this.checkoutHelper.findParcelRateHandler(
            findParcelRateSource.name,
            findParcelBooking,
            { sender, recipient },
          );

        try {
          console.timeLog('checkout', 'findParcelRateHandler');

          const universalTracking =
            await this.couriesService.createUniversalTrackingCode(
              parcelBookingData.parcelBookingId,
              [
                {
                  courierTrackingCode: findParcelRateHandler.tracking_number,
                  courierType:
                    findParcelRateSource.name.toUpperCase() as courier,
                  segment: 'PARCEL_FREIGHT',
                },
              ],
            );
          console.timeLog('checkout', 'universalTracking');

          if (
            quote.category == 'land' &&
            landFreightsWithAlirokDocs.includes(findParcelRateSource.name)
          ) {
            const alirok_label64 = await createAlirokLabel(
              findParcelBooking,
              universalTracking.tracking_code,
              this.http,
            );

            const bl64: string = await generateBL(
              findParcelBooking,
              universalTracking.tracking_code,
              this.http,
            );

            const alirok_label_url = await this.checkoutHelper.saveCustomLabel(
              alirok_label64,
              findParcelRateHandler?.PackageID,
            );

            const bill_of_lading_url = await this.checkoutHelper.saveCustomBL(
              bl64,
              findParcelRateHandler?.PackageID,
            );

            findParcelRateHandler = {
              ...findParcelRateHandler,
              label_url: alirok_label_url,
              bill_of_lading_url: bill_of_lading_url,
            };
          }

          if (
            findParcelRateSource.name === 'skypostal' ||
            findParcelRateSource.name === 'mail americas'
          ) {
            const invoice64: string = await pdfInvoice(
              findParcelBooking,
              universalTracking.tracking_code,
              this.http,
            );
            console.timeLog('checkout', 'invoice64');

            const invoice_url = await this.checkoutHelper.saveCustomInvoice(
              invoice64,
              findParcelRateHandler?.PackageID,
            );
            console.timeLog('checkout', 'invoice_url');

            findParcelRateHandler = { ...findParcelRateHandler, invoice_url };
          }

          const handlePayment = await this.checkoutHelper.handlePayment({
            c3p_payment_method_id: parcelBookingData.paymentId,
            userId: findParcelBooking.user_uuid,
            prisma: prisma,
            paymentMethodUuid: parcelBookingData.paymentMethodId,
            parcelBooking: findParcelBooking,
            parcelTracking: universalTracking.tracking_code,
            shipmentRequest: { ...findParcelRateHandler },
          });
          console.timeLog('checkout', 'handlePayment');

          const {
            senderLocation,
            recipientLocation,
            senderFirstName,
            senderFullName,
            recipientFirstName,
            recipientFullName,
          } = this.checkoutHelper.formatMembers({ sender, recipient });
          console.timeLog('checkout', 'formatMembers');

          const senderEmailName = senderFirstName
            ? senderFirstName
            : senderFullName?.substr(0, senderFullName?.indexOf(' '));
          console.timeLog('checkout', 'senderEmailName');

          const recipientEmailName = recipientFirstName
            ? recipientFirstName
            : recipientFullName?.substr(0, recipientFullName?.indexOf(' '));
          console.timeLog('checkout', 'recipientEmailName');

          await this.checkoutHelper.handleEmails({
            request,
            senderLocation,
            recipientLocation,
            sender,
            recipient,
            thirdParty,
            user: findUser,
            parcelBookingId,
            receiptUrl: handlePayment.receiptUrl,
            senderEmailName,
            recipientEmailName,
            shipmentRequest: { ...findParcelRateHandler },
            estimate_delivery: findParcelBooking.estimated_date,
            universal_tracking: universalTracking.tracking_code,
            category: quote.category as string,
          });
          console.timeLog('checkout', 'handleEmails');

          if (findParcelRateHandler?.requestPickup) {
            pickupData = await this.checkoutHelper.requestPickup(
              findParcelRateSource.name,
              findParcelRateHandler?.requestPickup,
              quote,
              order,
              sender,
            );
            console.timeLog('checkout', 'pickupData');

            await this.checkoutHelper.storePickupMetadata(
              parcelBookingId,
              JSON.stringify(pickupData),
              prisma,
            );
          }
          console.timeLog('checkout', 'finish');
          console.timeEnd('checkout');

          delete findParcelRateHandler?.requestPickup;

          return {
            status: handlePayment.paymentIntent?.status,
            parcel: {
              ...findParcelRateHandler,
              receipt_url: handlePayment.receiptUrl,
            },
            card_network: handlePayment.cardNetwork,
            last_4_digits: handlePayment.last4Digits,
          };
        } catch (error) {
          if (findParcelRateHandler.shipmentId) {
            await this.checkoutHelper.cancelShipment(
              findParcelRateSource.name,
              quote,
              findParcelRateHandler.shipmentId,
            );
          }

          if (pickupData) {
            await this.checkoutHelper.cancelPickup(
              findParcelRateSource.name,
              pickupData,
              findParcelBooking.parcel_booking_uuid,
              parseISO(quote.shipDate.data.date),
              quote,
              findParcelRateHandler?.dispatchConfirmationNumber,
            );
            console.timeLog('checkout', 'cancelPickup');
          }
          console.timeEnd('checkout');

          throw new BadRequestException(error?.message || 'Checkout error');
        }
      },
      { maxWait: 120000, timeout: 180000 },
    );
  }

  async retrieveCheckoutData(id: string) {
    return await this.prisma.$transaction(async (prisma) => {
      try {
        const findParcelBooking = await this.checkoutHelper.findParcelBooking(
          id,
          prisma,
        );

        if (!findParcelBooking?.confirmed) {
          throw new BadRequestException(
            'This parcel booking was not confirmed!',
          );
        }

        const parsedLabel =
          findParcelBooking?.label_url &&
          `https://${
            this.BUCKET_NAME
          }.s3.us-east-1.amazonaws.com/documents/labels/${
            findParcelBooking.label_url.match(/(ALIROK.*).pdf/)[1]
          }.pdf`;

        const parsedInvoice =
          findParcelBooking?.invoice_url &&
          `https://${
            this.BUCKET_NAME
          }.s3.us-east-1.amazonaws.com/documents/invoices/${
            findParcelBooking.invoice_url.match(/(ALIROK.*).pdf/)[1]
          }.pdf`;

        const parsedBillOfLading =
          findParcelBooking?.bill_of_lading_url &&
          `https://${
            this.BUCKET_NAME
          }.s3.us-east-1.amazonaws.com/documents/bill-of-lading/${
            findParcelBooking.bill_of_lading_url.match(/(ALIROK.*).pdf/)[1]
          }.pdf`;

        return {
          status: 'succeeded',
          parcel: {
            tracking_number: findParcelBooking?.tracking_code_id,
            label_url: parsedLabel,
            invoice_url: parsedInvoice,
            receipt_url: findParcelBooking?.receipt_url,
            bill_of_lading_url: parsedBillOfLading,
          },
          card_network: findParcelBooking?.payment_methods?.card_network,
          last_4_digits: findParcelBooking?.payment_methods?.last_4_digits,
        };
      } catch (error) {
        throw error;
      }
    });
  }
}
