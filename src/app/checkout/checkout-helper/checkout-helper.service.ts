import {
  parcel_bookings,
  parcel_members,
  payment_methods,
  Prisma,
  PrismaClient,
  users,
} from '@generated/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { SendgridService } from '../../../vendors/sendgrid/sendgrid.service';
import { DhlService } from '../../../app/couriers/dhl/dhl.service';
import { UpsService } from '../../../app/couriers/ups/ups.service';
import { UspsService } from '../../../app/couriers/usps/usps.service';
import { AddressService } from '../../../app/misc/address/address.service';
import { StripeService } from '../../../vendors/stripe/stripe.service';
import { CheckoutParcelMember } from '../interface/checkout.interface';
import { ObjectHelperService } from '../../../app/misc/object-helper/object-helper.service';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../../prisma/prisma.service';
import { format } from 'date-fns';
import { SkyPostalService } from '../../../app/couriers/sky-postal/sky-postal.service';
import { S3Service } from '../../../vendors/s3/s3.service';
import { FedexService } from '../../../app/couriers/fedex/fedex.service';
import { ConfigService } from '@nestjs/config';
import { BpsService } from 'src/app/couriers/bps/bps.service';
import { GltService } from 'src/app/couriers/glt/glt.service';
import { ClearLaneService } from 'src/app/couriers/clear-lane/clear-lane.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from 'src/app/couriers/dto/newCouriers.dto';
import { MailAmericasService } from 'src/app/couriers/mail-americas/mail-americas.service';

@Injectable()
export class CheckoutHelperService {
  private ENVIRONMENT: string;

  constructor(
    private readonly DHLService: DhlService,
    private readonly USPSService: UspsService,
    private readonly UPSService: UpsService,
    private readonly SkyPostalService: SkyPostalService,
    private readonly FedexService: FedexService,
    private readonly BpsService: BpsService,
    private readonly GltService: GltService,
    private readonly MailAmericasService: MailAmericasService,
    private readonly ClearlaneService: ClearLaneService,
    private readonly stripeService: StripeService,
    private readonly addressService: AddressService,
    private readonly sendgridService: SendgridService,
    private readonly objectHelper: ObjectHelperService,
    private readonly S3Service: S3Service,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.ENVIRONMENT = configService.get('ENVIRONMENT');
  }

  public formattedPlayer(dbData) {
    return {
      ...dbData,
      email: dbData?.email,
      tax_id: dbData?.tax_id,
      phone: dbData?.phone,
    };
  }

  public async findParcelBooking(
    parcelBookingId: string,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      const booking = await prisma.parcel_bookings.findUnique({
        where: { parcel_booking_uuid: parcelBookingId },
        include: {
          tracking_code: true,
          payment_methods: true,
          parcel_rate_sources: true,
          parcel_member_parcel_bookings: {
            include: {
              parcel_bookings: true,
              parcel_members: {
                include: {
                  subject_role_types: true,
                  locations: {
                    include: {
                      postal_codes: true,
                      location_administrative_divisions: {
                        include: {
                          administrative_divisions: {
                            include: { administrative_division_types: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!booking) {
        throw new BadRequestException('Booking not found!');
      }

      return booking;
    } catch (error) {
      throw error;
    }
  }

  public async findUser(
    userId,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    const user = await prisma.users.findUnique({
      where: { user_uuid: userId },
    });

    if (!user) throw new BadRequestException('User not found!');

    return user;
  }

  public async findParcelRateSource(
    parcelRateSourceId: string,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    const rateSource = await prisma.parcel_rate_sources.findUnique({
      where: { parcel_rate_source_uuid: parcelRateSourceId },
    });

    if (!rateSource)
      throw new BadRequestException('Parcel Rate Source not found!');

    return rateSource;
  }

  public async findParcelRateHandler(
    name: string,
    parcelBooking: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    let carrierReturn;

    if (name === 'sky postal') name === 'sky postal';
    switch (name) {
      case 'ups':
        carrierReturn = await this.UPSService.shipment(parcelBooking, {
          sender,
          recipient,
        });
        break;
      case 'dhl':
        carrierReturn = await this.DHLService.shipment(parcelBooking, {
          sender,
          recipient,
        });
        break;
      case 'skypostal':
        carrierReturn = await this.SkyPostalService.shipment(parcelBooking, {
          sender,
          recipient,
        });
        break;
      case 'usps':
        carrierReturn = await this.USPSService.shipment(parcelBooking, {
          sender,
          recipient,
        });
        break;
      case 'fedex':
        carrierReturn = await this.FedexService.shipmentRest(parcelBooking, {
          sender,
          recipient,
        });
        break;
      case 'bps':
        carrierReturn = await this.BpsService.shipment(parcelBooking, {
          sender,
          recipient,
        });
      case 'clearlane':
        carrierReturn = await this.ClearlaneService.shipping(parcelBooking, {
          sender,
          recipient,
        });
      case 'glt':
        carrierReturn = await this.GltService.shipping(parcelBooking, {
          sender,
          recipient,
        });
        break;
      case 'mail americas':
        carrierReturn = await this.MailAmericasService.shipping(parcelBooking, {
          sender,
          recipient,
        });
        break;

      default:
        throw new BadRequestException('Parcel handler not found!');
        break;
    }

    return {
      ...carrierReturn,
      invoice_url: carrierReturn?.invoice_url ?? '',
      ...(name === 'dhl'
        ? { dhlConfirmationNumber: carrierReturn.dhlConfirmationNumber }
        : {}),
    };
  }

  public async storePickupMetadata(
    parcelBookingId: string,
    pickupData: any,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      return await prisma.parcel_bookings.update({
        where: { parcel_booking_uuid: parcelBookingId },
        data: { pickup_metadata: pickupData },
      });
    } catch (error) {
      throw error;
    }
  }

  public async handlePayment({
    c3p_payment_method_id,
    paymentMethodUuid,
    prisma,
    userId,
    parcelTracking,
    parcelBooking,
    shipmentRequest,
  }: {
    userId: string;
    c3p_payment_method_id: string;
    paymentMethodUuid: string;
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >;
    parcelTracking: string;
    parcelBooking: parcel_bookings;
    shipmentRequest: {
      id: string;
      tracking_number: string;
      label_url: string;
      invoice_url: string;
      bill_of_lading_url: string;
    };
  }) {
    try {
      const paymentMethodWhere: payment_methods =
        this.objectHelper.removeUndefinedFields({
          user_uuid: userId,
          c3p_payment_method_id: c3p_payment_method_id,
          payment_method_uuid: paymentMethodUuid,
        });

      let paymentMethod = await prisma.payment_methods.findFirst({
        where: {
          AND: [paymentMethodWhere],
        },
      });

      if (!paymentMethod) {
        paymentMethodWhere.payment_method_uuid = uuidv4();

        paymentMethod = await prisma.payment_methods.create({
          data: paymentMethodWhere,
        });
      }

      if (!paymentMethod?.c3p_payment_method_id)
        throw new BadRequestException('Payment not available!');

      const paymentIntentId = await parcelBooking.payment_intent_id;

      await this.stripeService.updatePaymentIntent({
        paymentId: paymentIntentId,
        description: `Tracking No. ${parcelTracking}`,
      });

      const paymentIntent = await this.stripeService.confirmPayment({
        paymentMethodId: paymentMethod?.c3p_payment_method_id,
        paymentIntentId: paymentIntentId,
      });

      if (paymentIntent?.status !== 'succeeded') {
        throw new BadRequestException({ status: paymentIntent?.status });
      }

      const cardNetwork =
        paymentIntent?.charges?.data?.[0]?.payment_method_details?.card
          ?.network;
      const last4Digits =
        paymentIntent?.charges?.data?.[0]?.payment_method_details?.card?.last4;
      const receiptUrl = paymentIntent?.charges?.data?.[0]?.receipt_url;

      await prisma.parcel_bookings.update({
        where: { parcel_booking_uuid: parcelBooking.parcel_booking_uuid },
        data: {
          payment_method_uuid: paymentMethod.payment_method_uuid,
          confirmed: true,
          p_parcel_id: shipmentRequest.id,
          bill_of_lading_url: shipmentRequest.bill_of_lading_url,
          invoice_url: shipmentRequest.invoice_url,
          label_url: shipmentRequest.label_url,
          receipt_url: receiptUrl,
          agree_to_payment_terms: true,
        },
      });

      if (
        paymentMethod.card_network !== cardNetwork ||
        paymentMethod.last_4_digits !== last4Digits
      ) {
        await prisma.payment_methods.update({
          data: {
            card_network: cardNetwork,
            last_4_digits: last4Digits,
          },
          where: { payment_method_uuid: paymentMethod?.payment_method_uuid },
        });
      }

      return { paymentIntent, receiptUrl, cardNetwork, last4Digits };
    } catch (error) {
      throw error;
    }
  }

  public async handleEmails({
    request,
    senderEmailName,
    recipientEmailName,
    shipmentRequest,
    user,
    receiptUrl,
    sender,
    recipient,
    thirdParty,
    recipientLocation,
    senderLocation,
    parcelBookingId,
    estimate_delivery,
    universal_tracking,
    category,
  }: {
    request: Request;
    sender: CheckoutParcelMember;
    recipient: CheckoutParcelMember;
    thirdParty;
    senderLocation;
    recipientLocation;
    senderEmailName: string;
    recipientEmailName: string;
    shipmentRequest: {
      id: string;
      tracking_number: string;
      label_url: string;
      invoice_url: string;
    };
    user: users;
    receiptUrl: string;
    parcelBookingId;
    estimate_delivery: Date;
    universal_tracking: string;
    category: string;
  }) {
    try {
      if (user?.email) {
        const ROK_APP_REDIRECT_URL = (parcel_booking_uuid) =>
          `${request.get('origin')}/forms/${parcel_booking_uuid}`;

        const parcelCheckoutHolderEmail = {
          to: user?.email,
          templateId: 'd-b968de9a71384138a4a86e13647565ae',
          subject: `Parcel by Alirok.com from ${senderEmailName} to ${recipientEmailName} | tracking No. ${universal_tracking}`,
          data: {
            trackingNumber: universal_tracking,
            invoiceLink: ROK_APP_REDIRECT_URL(parcelBookingId),
            labelLink: ROK_APP_REDIRECT_URL(parcelBookingId),
            receiptLink: receiptUrl,
            senderName: senderEmailName,
            recipientName: recipientEmailName,
            senderAddress: this.addressService.formattedAddress(senderLocation),
            recipientAddress:
              this.addressService.formattedAddress(recipientLocation),
            logInLink: `${request.get('origin')}/access`,
            buttonText: 'See tracking',
            buttonLink: `${request.get(
              'origin',
            )}/tracking/${universal_tracking}`,
          },
        };

        const landCheckoutHolderEmail = {
          to: user?.email,
          templateId: 'd-5de1cc4ec7224f9884195818ae58044d',
          subject: `Shipment by Alirok.com from ${senderEmailName} to ${recipientEmailName} | tracking No. ${universal_tracking}`,
          data: {
            trackingNumber: universal_tracking,
            invoiceLink: ROK_APP_REDIRECT_URL(parcelBookingId),
            labelLink: ROK_APP_REDIRECT_URL(parcelBookingId),
            receiptLink: receiptUrl,
            senderName: senderEmailName,
            recipientName: recipientEmailName,
            senderAddress: this.addressService.formattedAddress(senderLocation),
            recipientAddress:
              this.addressService.formattedAddress(recipientLocation),
            logInLink: `${request.get('origin')}/access`,
            buttonText: 'See tracking',
            buttonLink: `${request.get(
              'origin',
            )}/tracking/${universal_tracking}`,
          },
        };

        await this.sendgridService.send(
          category === 'land'
            ? landCheckoutHolderEmail
            : parcelCheckoutHolderEmail,
        );
      }

      const toRecipientAnd3rdParty = [{ email: recipient?.email }];

      if (thirdParty && recipient?.email !== thirdParty?.email) {
        toRecipientAnd3rdParty.push({ email: thirdParty?.email });
      }

      const estimated_date = format(estimate_delivery, 'MMM-dd');

      if (toRecipientAnd3rdParty.length > 0) {
        const parcelCheckoutRecipientEmail = {
          to: toRecipientAnd3rdParty,
          subject: `Shipment by Alirok.com from ${senderEmailName} to ${recipientEmailName} | tracking No. ${universal_tracking}`,
          templateId: 'd-ae484bb446104206b4a02e337756ab10',
          data: {
            buttonLink: `${request.get(
              'origin',
            )}/tracking/${universal_tracking}`,
            header: `Hi ${recipient?.first_name ?? recipient?.full_name}`,
            body: `You shipment will arrive on ${estimated_date}`,
            buttonText: 'See tracking',
            avatar: '',
          },
        };

        await this.sendgridService.send(parcelCheckoutRecipientEmail);
      }

      const newUserList = [];

      const userSender = await this.prisma.users.findUnique({
        where: { email: sender.email },
      });

      const userRecipient = await this.prisma.users.findUnique({
        where: { email: recipient.email },
      });

      if (!userSender) {
        newUserList.push(sender);
      }

      if (
        !userRecipient &&
        sender.email.toLowerCase() != recipient.email.toLowerCase()
      ) {
        newUserList.push(recipient);
      }

      if (newUserList.length > 0) {
        for (const member of newUserList) {
          const newUserCheckoutEmail = {
            to: member.email,
            subject: `You have a new shipment, please confirm your address`,
            templateId: 'd-0f88383f611747b892b1a1e3f6445c22',
            data: {
              buttonLink: `${request.get('origin')}/user-confirmation/${
                member.parcel_member_uuid
              }`,
              header: `Quote. Book. Ship at Alirok.com!`,
              body: 'Confirm your information and track all your shipments from a single place!',
              buttonText: 'Confirm now',
              avatar: '',
            },
          };

          await this.sendgridService.send(newUserCheckoutEmail);
        }
      }

      return;
    } catch (error) {
      return error;
    }
  }

  public async handleMembers(parcelBooking) {
    let sender: CheckoutParcelMember;
    let recipient: CheckoutParcelMember;
    let thirdParty: CheckoutParcelMember;

    const parcelMembers = parcelBooking.parcel_member_parcel_bookings;

    for (const item of parcelMembers) {
      switch (item.parcel_members.subject_role_types.name) {
        case 'Sender':
          sender = this.formattedPlayer(item.parcel_members);
          break;
        case 'Recipient':
          recipient = this.formattedPlayer(item.parcel_members);
          break;
        case '3rd Party':
          thirdParty = item?.parcel_members;
          break;
        default:
          break;
      }
    }

    return { sender, recipient, thirdParty };
  }

  public formatMembers({
    sender,
    recipient,
  }: {
    sender: CheckoutParcelMember;
    recipient: CheckoutParcelMember;
  }) {
    try {
      const senderLocation = this.addressService.formatLocation(
        sender.locations as any,
      );
      const recipientLocation = this.addressService.formatLocation(
        recipient.locations as any,
      );

      const senderFirstName = sender?.first_name ?? sender?.full_name;
      const senderFullName = sender?.full_name ?? sender?.first_name;
      const recipientFirstName = recipient?.first_name ?? recipient?.first_name;
      const recipientFullName = recipient?.full_name ?? recipient?.full_name;

      return {
        senderLocation,
        recipientLocation,
        senderFirstName,
        senderFullName,
        recipientFirstName,
        recipientFullName,
      };
    } catch (error) {
      return error;
    }
  }

  public async saveCustomInvoice(file: string, packageID: string) {
    const store = await this.S3Service.put({
      file: Buffer.from(file, 'base64'),
      contentType: 'application/pdf',
      folder: 'documents/invoices',
      name: `${packageID}.pdf`,
    });

    return store;
  }

  public async saveCustomBL(file: string, packageID: string) {
    const store = await this.S3Service.put({
      file: Buffer.from(file, 'base64'),
      contentType: 'application/pdf',
      folder: 'documents/bill-of-lading',
      name: `${packageID}.pdf`,
    });

    return store;
  }

  public async saveCustomLabel(file: string, packageID: string) {
    const store = await this.S3Service.put({
      file: Buffer.from(file, 'base64'),
      contentType: 'application/pdf',
      folder: 'documents/labels',
      name: `${packageID}.pdf`,
    });

    return store;
  }

  public async cancelPickup(
    courier: string,
    pickupData: any,
    parcelBookingId: string,
    pickupDate: Date,
    quote: NewRateShipmentDTO,
    dhlConfirmationPickup: string,
  ) {
    switch (courier.toUpperCase()) {
      case 'FEDEX':
        return await this.FedexService.cancelPickupRequest(
          pickupData,
          parcelBookingId,
          pickupDate,
        );
      case 'USPS':
        return await this.USPSService.cancelPickupRequest(pickupData);
      case 'DHL':
        return await this.DHLService.cancelPickupRequest(dhlConfirmationPickup);
      case 'UPS':
        return await this.UPSService.cancelPickupRequest(pickupData.PRN);
      default:
        break;
    }
  }

  public async cancelShipment(
    courier: string,
    rateData: NewRateShipmentDTO,
    shipmentId: string,
  ) {
    switch (courier.toUpperCase()) {
      case 'FEDEX':
        return await this.FedexService.cancelShipment(rateData, shipmentId);
      case 'USPS':
        return await this.USPSService.cancelShipment(shipmentId);
      case 'UPS':
        return await this.UPSService.cancelShipment(shipmentId);
      default:
        break;
    }
  }

  public async requestPickup(
    courier: string,
    pickupData: any,
    quote: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    sender: CheckoutParcelMember,
  ) {
    switch (courier.toUpperCase()) {
      case 'FEDEX':
        return await this.FedexService.pickRequest(pickupData);
        break;
      case 'UPS':
        return await this.UPSService.requestPickup(pickupData);
        break;
      case 'USPS':
        return await this.USPSService.requestPickup(
          quote,
          sender,
          order.service_code,
        );
        break;

      default:
        break;
    }
  }
}
