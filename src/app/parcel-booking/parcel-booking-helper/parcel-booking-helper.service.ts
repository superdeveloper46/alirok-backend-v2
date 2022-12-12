import {
  locations,
  parcel_members,
  postal_codes,
  Prisma,
  PrismaClient,
  subject_role_types,
  users,
} from '@generated/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DhlService } from '../../couriers/dhl/dhl.service';
import { SendleService } from '../../couriers/sendle/sendle.service';
import { UpsService } from '../../couriers/ups/ups.service';
import { UspsService } from '../../couriers/usps/usps.service';
import { AddressService } from '../../../common/address/address.service';
import { StripeService } from '../../../vendors/stripe/stripe.service';
import { Stripe } from 'stripe';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  NewCreateParcelBookingActorDTO,
  NewCreateParcelBookingAddressDataDTO,
  NewCreateParcelBookingDTO,
  NewCreateParcelBookingUserDTO,
} from '../dto/new-parcel-booking.dto';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../../../app/couriers/dto/newCouriers.dto';
import { parseISO } from 'date-fns';
import {
  IPickupAvailabilityData,
  IReturnMaskedAddressData,
  IReturnMaskedData,
} from '../interface/parcel-booking.interface';
import { location_administrative_divisions } from '@generated/client';
import { ProfitService } from '../../../app/misc/profit/profit.service';
import { FedexService } from '../../../app/couriers/fedex/fedex.service';
import { ParcelBookingPaymentStatus } from '../../accounts/dto/accounts.dto';
import { SkyPostalService } from '../../couriers/sky-postal/sky-postal.service';
import { CheckoutParcelMember } from '../../checkout/interface/checkout.interface';
import { UPSPickup } from '../../couriers/ups/interface';
import { v4 as uuidv4 } from 'uuid';
import { ClearLaneService } from 'src/app/couriers/clear-lane/clear-lane.service';
import { BpsService } from 'src/app/couriers/bps/bps.service';
import { CorreiosService } from 'src/app/couriers/correios/correios.service';
import { GltService } from 'src/app/couriers/glt/glt.service';
import { MailAmericasService } from 'src/app/couriers/mail-americas/mail-americas.service';

const unitsToCents = (units) => units * 100;
const centsToUnits = (cents) => cents / 100;

function getAmountCents(value) {
  const amount = Math.trunc(unitsToCents(value));
  return Number(amount);
}

@Injectable()
export class ParcelBookingHelperService {
  constructor(
    private readonly upsService: UpsService,
    private readonly profitService: ProfitService,
    private readonly uspsService: UspsService,
    private readonly fedexService: FedexService,
    private readonly dhlService: DhlService,
    private readonly skyPostalService: SkyPostalService,
    private readonly clearLaneService: ClearLaneService,
    private readonly bpsService: BpsService,
    private readonly correiosService: CorreiosService,
    private readonly gltService: GltService,
    private readonly mailAmericasService: MailAmericasService,
    private readonly stripeService: StripeService,
    private readonly address: AddressService,
    private readonly prisma: PrismaService,
    private readonly sendleService: SendleService,
  ) {}

  private async courierRates(
    courier: string,
    quote: NewRateShipmentDTO,
    serviceCode: any,
    productCode?: string,
    order?: NewRateShipmentReturnDTO,
    senderEmail?: string,
    sender?: NewCreateParcelBookingActorDTO,
    receiver?: NewCreateParcelBookingActorDTO,
  ) {
    console.log('courier', courier);
    switch (courier) {
      case 'ups':
        return await this.upsService.rateWithType(quote, serviceCode);
        break;
      case 'dhl':
        return await this.dhlService.rateWithType(quote, serviceCode);
        break;
      case 'skypostal':
        return await this.skyPostalService.rateWithType(
          quote,
          Number(serviceCode),
          order,
        );
        break;
      case 'usps':
        return await this.uspsService.rateWithType(quote, serviceCode);
        break;
      case 'fedex':
        return await this.fedexService.rateWithTypeRest(
          quote,
          serviceCode,
          order,
          senderEmail,
        );
        break;
      case 'clearlane':
        return await this.clearLaneService.rateWithType(
          quote,
          order,
          serviceCode,
        );
        break;
      case 'bps':
        return await this.bpsService.rateStaticWithType(
          quote,
          order,
          serviceCode,
        );
        break;
      case 'correios':
        return await this.correiosService.rateWithType(
          quote,
          order,
          serviceCode,
        );
        break;
      case 'glt':
        return await this.gltService.rateWithType(
          quote,
          serviceCode,
          order,
          sender,
          receiver,
        );
        break;
      case 'mail americas':
        return await this.mailAmericasService.rateWithType(
          quote,
          serviceCode,
          order,
        );
        break;
      case 'sendle':
        return await this.sendleService.rateWithType(quote, serviceCode);
        break;
      default:
        return null;
        break;
    }
  }

  public async createPartialParcelBooking(
    createData: NewCreateParcelBookingDTO,
  ) {
    return await this.prisma.$transaction(
      async (prisma) => {
        let sender = createData?.sender;
        let recipient = createData?.recipient;
        let third_party = createData.user;

        try {
          const findUser = await this.getUser(prisma, createData.user.uuid);
          console.timeLog('create parcel booking', 'findUser');

          const courier = createData.order.company.name.toLowerCase();

          const findParcelRateSource = await this.getParcelRateSource(
            prisma,
            courier,
          );

          console.timeLog('create parcel booking', 'findParcelRateSource');

          const { parcel_rate_source_uuid } = await this.getParcelRateSource(
            prisma,
            courier,
          );
          console.timeLog('create parcel booking', 'parcel_rate_source_uuid');

          const subjectRoleType = await this.subjectRoleTypes(prisma);
          console.timeLog('create parcel booking', 'subjectRoleType');

          const { senderFound, recipientFound, thirdPartyFound } =
            await this.handlePlayers(
              prisma,
              sender,
              recipient,
              third_party,
              subjectRoleType,
            );

          console.timeLog('create parcel booking', 'handlePlayers');

          const { senderSync, recipientSync, thirdPartySync } =
            await this.handleSyncs(prisma, sender, recipient, third_party);

          console.timeLog('create parcel booking', 'handleSyncs');

          const members = [];

          if (
            sender?.email &&
            sender?.phone?.number &&
            sender?.phone?.countryCode
          ) {
            const handleSender = await this.handleSender(
              prisma,
              senderFound,
              sender,
              subjectRoleType,
              senderSync,
            );

            console.timeLog('create parcel booking', 'handleSender');

            members.push(handleSender.member);
            sender = handleSender.sender;
          }

          if (
            recipient?.email &&
            recipient?.phone?.number &&
            recipient?.phone?.countryCode
          ) {
            const handleRecipient = await this.handleRecipient(
              prisma,
              recipientFound,
              recipient,
              subjectRoleType,
              recipientSync,
            );

            console.timeLog('create parcel booking', 'handleRecipient');

            members.push(handleRecipient.member);
            recipient = handleRecipient.recipient;
          }

          const isThirdParty =
            sender.email !== createData.user.email &&
            recipient.email !== createData.user.email;

          if (createData?.user?.third_party || isThirdParty) {
            const handleThirdParty = await this.handleThirdParty(
              prisma,
              thirdPartyFound,
              third_party,
              subjectRoleType,
              thirdPartySync,
            );

            console.timeLog('create parcel booking', 'handleThirdParty');

            if (handleThirdParty.member) {
              members.push(handleThirdParty.member);
              third_party = handleThirdParty.third_party;
            }
          }

          // Get the total amount and profit
          const totalAmount = (
            (createData.order?.services || []).map((services) => {
              return (
                (services.items || []).map((item) => {
                  if (
                    (item.required || item.selected) &&
                    (item.name || '').toLowerCase() != 'payment processing'
                  ) {
                    return item?.price?.value || 0;
                  } else {
                    return 0;
                  }
                }) || []
              ).reduce((acc, item) => acc + item, 0);
            }) || []
          ).reduce((acc, item) => acc + item, 0);

          const profitAmount = (
            (createData.order?.services || []).map((services) => {
              return (
                (services.items || []).map((item) => {
                  if (
                    (item.required || item.selected) &&
                    (item.name || '').toLowerCase() != 'payment processing'
                  ) {
                    return item?.price?.tmpValue || 0;
                  } else {
                    return 0;
                  }
                }) || []
              ).reduce((acc, item) => acc + item, 0);
            }) || []
          ).reduce((acc, item) => acc + item, 0);

          const paymentMethodCharges = (
            (createData.order?.services || []).map((services) => {
              return (
                (services.items || []).map((item) => {
                  if (
                    (item.required || item.selected) &&
                    (item.name || '').toLowerCase() == 'payment processing'
                  ) {
                    return item?.price?.value || 0;
                  } else {
                    return 0;
                  }
                }) || []
              ).reduce((acc, item) => acc + item, 0);
            }) || []
          ).reduce((acc, item) => acc + item, 0);

          const parcelBooking = await prisma.parcel_bookings.create({
            data: {
              user_uuid: createData.user.uuid,
              parcel_booking_uuid: uuidv4(),
              payment_intent_id: '',
              quote: createData.quote as any,
              metadata: createData.order as any,
              parcel_rate_source_uuid: parcel_rate_source_uuid,
              estimated_date: null,
              payable_status: ParcelBookingPaymentStatus.OPEN,
              receivable_status: ParcelBookingPaymentStatus.OPEN,
              total_amount: totalAmount,
              profit_amount: profitAmount,
              payment_method_charges: paymentMethodCharges,
              created_at: new Date(),
            },
          });
          console.timeLog('create parcel booking', 'parcelBooking');

          if (members) {
            await this.handleRelationShips(
              prisma,
              members,
              parcelBooking.parcel_booking_uuid,
            );

            console.timeLog('create parcel booking', 'handleRelationShips');
          }

          if (sender?.email && recipient?.email && !createData.draft) {
            const { parcelFreightAmount } = await this.getQuote(
              findParcelRateSource.name,
              createData.quote,
              createData.order.service_code as any,
              createData.order.service_code as any,
              createData.order,
              sender.email,
              sender,
              recipient,
            );

            console.timeLog('create parcel booking', 'parcelFreightAmount');

            const handleStripe = await this.handleStripe(
              createData.order,
              createData.quote,
              parcelFreightAmount,
              findUser,
              createData.user?.email,
              prisma,
            );
            console.timeLog('create parcel booking', 'handleStripe');

            const estimated_date = createData.order.delivery?.date
              ? parseISO(createData.order.delivery.date as any)
              : null;

            await prisma.parcel_bookings.update({
              data: {
                payment_intent_id: handleStripe.paymentIntent.id,
                estimated_date,
              },
              where: {
                parcel_booking_uuid: parcelBooking.parcel_booking_uuid,
              },
            });

            console.timeLog('create parcel booking', 'updateBooking');

            const formattedResponse = this.parcelBookingResponse(
              parcelBooking.parcel_booking_uuid,
              handleStripe.parcelAmount,
              handleStripe.parcelAmount,
              handleStripe.paymentMethodFee,
            );
            console.timeLog(
              'create parcel booking',
              'create partial parcel booking',
            );
            console.timeEnd('create parcel booking');

            return { data: formattedResponse };
          } else {
            console.timeLog(
              'create parcel booking',
              'create partial parcel booking',
            );
            console.timeEnd('create parcel booking');

            return { parcel_booking_uuid: parcelBooking.parcel_booking_uuid };
          }
        } catch (error) {
          throw error;
        }
      },
      { maxWait: 25000, timeout: 50000 },
    );
  }

  public async updateParcelBooking(createData: NewCreateParcelBookingDTO) {
    const { user, uuid, draft } = createData;
    return await this.prisma.$transaction(
      async (prisma) => {
        let sender = createData?.sender;
        let recipient = createData?.recipient;
        let third_party = createData?.user;

        try {
          const findParcelBooking = await this.findParcelBooking(uuid, prisma);
          console.timeLog('create parcel booking', 'findParcelBooking');

          const order: NewRateShipmentReturnDTO =
            findParcelBooking.metadata as any;
          const quote: NewRateShipmentDTO = findParcelBooking.quote as any;
          const findUser = await this.getUser(prisma, user.uuid);
          const courier = createData.order.company.name.toLowerCase();

          const findParcelRateSource = await this.getParcelRateSource(
            prisma,
            courier,
          );
          console.timeLog('create parcel booking', 'findParcelRateSource');

          const subjectRoleType = await this.subjectRoleTypes(prisma);
          console.timeLog('create parcel booking', 'subjectRoleType');

          const { senderFound, recipientFound, thirdPartyFound } =
            await this.handlePlayers(
              prisma,
              sender,
              recipient,
              third_party,
              subjectRoleType,
            );

          console.timeLog('create parcel booking', 'handlePlayers');

          const { senderSync, recipientSync, thirdPartySync } =
            await this.handleSyncs(prisma, sender, recipient, third_party);

          console.timeLog('create parcel booking', 'handleSyncs');

          const allMembers = await this.handleParcelMembers(findParcelBooking);
          console.timeLog('create parcel booking', 'handleParcelMembers');

          const needNewMember = await this.handleUpdateMembers(
            prisma,
            allMembers,
            sender,
            recipient,
            third_party,
            senderSync,
            recipientSync,
            findParcelBooking.parcel_booking_uuid,
          );

          console.timeLog('create parcel booking', 'handleUpdateMembers');

          const members = [];

          if (
            sender?.email &&
            sender?.phone?.number &&
            sender?.phone?.countryCode &&
            needNewMember.senderNeed
          ) {
            const handleSender = await this.handleSender(
              prisma,
              senderFound,
              sender,
              subjectRoleType,
              senderSync,
            );
            console.timeLog('create parcel booking', 'handleSender');

            members.push(handleSender.member);
            sender = handleSender.sender;
          }

          if (
            recipient?.email &&
            recipient?.phone?.number &&
            recipient?.phone?.countryCode &&
            needNewMember.recipientNeed
          ) {
            const handleRecipient = await this.handleRecipient(
              prisma,
              recipientFound,
              recipient,
              subjectRoleType,
              recipientSync,
            );
            console.timeLog('create parcel booking', 'handleRecipient');

            members.push(handleRecipient.member);
            recipient = handleRecipient.recipient;
          }

          const isThirdParty =
            sender.email !== createData.user.email &&
            recipient.email !== createData.user.email;

          if (
            third_party?.third_party &&
            needNewMember.thirdPartyNeed &&
            isThirdParty
          ) {
            const handleThirdParty = await this.handleThirdParty(
              prisma,
              thirdPartyFound,
              third_party,
              subjectRoleType,
              thirdPartySync,
            );
            console.timeLog('create parcel booking', 'handleThirdParty');

            if (handleThirdParty.member) {
              members.push(handleThirdParty.member);
              third_party = handleThirdParty.third_party;
            }
          }

          if (members) {
            await this.handleRelationShips(
              prisma,
              members,
              findParcelBooking.parcel_booking_uuid,
            );
            console.timeLog('create parcel booking', 'handleRelationShips');
          }

          if (
            sender?.email &&
            sender?.phone?.number &&
            sender?.phone?.countryCode &&
            recipient?.email &&
            recipient?.phone?.number &&
            recipient?.phone?.countryCode &&
            !draft
          ) {
            console.log(sender.email);
            const { parcelFreightAmount } = await this.getQuote(
              findParcelRateSource.name,
              quote,
              order.service_code as any,
              '',
              order,
              sender.email,
            );
            console.timeLog('create parcel booking', 'parcelFreightAmount');

            const handleStripe = await this.handleStripe(
              order,
              quote,
              parcelFreightAmount,
              findUser,
              createData.user?.email,
              prisma,
            );
            console.timeLog('create parcel booking', 'handleStripe');

            const estimated_date = order.delivery?.date
              ? parseISO(order.delivery.date as any)
              : null;

            await prisma.parcel_bookings.update({
              data: {
                payment_intent_id: handleStripe.paymentIntent.id,
                estimated_date,
              },
              where: {
                parcel_booking_uuid: findParcelBooking.parcel_booking_uuid,
              },
            });

            console.timeLog('create parcel booking', 'updateBooking');

            const formattedResponse = this.parcelBookingResponse(
              findParcelBooking.parcel_booking_uuid,
              handleStripe.parcelAmount,
              handleStripe.parcelAmount,
              handleStripe.paymentMethodFee,
            );

            console.timeLog('create parcel booking', 'update parcel booking');
            console.timeEnd('create parcel booking');

            return { data: formattedResponse };
          } else {
            console.timeLog('create parcel booking', 'update parcel booking');
            console.timeEnd('create parcel booking');

            return {
              parcel_booking_uuid: findParcelBooking.parcel_booking_uuid,
            };
          }
        } catch (error) {
          console.log(error);

          throw new BadRequestException(
            error?.message || 'Error in parcel-booking creation!',
          );
        }
      },
      { maxWait: 10000, timeout: 25000 },
    );
  }

  public async findParcelBooking(
    uuid: string,
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
        where: { parcel_booking_uuid: uuid },
        include: {
          users: true,
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

      if (!booking) throw new BadRequestException('Parcel booking not found!');

      return booking;
    } catch (error) {
      throw error;
    }
  }

  public async compareMembers(
    bookingMember?: CheckoutParcelMember,
    actualMember?: NewCreateParcelBookingActorDTO,
  ) {
    let isSame = false;

    const bookingAddress = this.address.formatLocation(bookingMember.locations);
    const isSameSenderFoundLocation = this.address.isSameLocation(
      bookingAddress,
      actualMember?.address,
    );

    if (bookingMember.pre_filled !== actualMember.pre_filled) {
      return isSame;
    }

    if (actualMember.pre_filled === 'ADDRESS') {
      isSame =
        bookingMember.type === actualMember.type &&
        bookingMember.pre_filled === actualMember.pre_filled &&
        bookingMember.first_name === actualMember.firstName &&
        bookingMember.tax_id === actualMember.taxId &&
        bookingMember.email === actualMember.email &&
        bookingMember.phone.countryCode === actualMember.phone.countryCode &&
        bookingMember.phone.number === actualMember.phone.number &&
        bookingMember.company_name === actualMember.companyName &&
        isSameSenderFoundLocation;
    } else if (actualMember.pre_filled === 'USER') {
      isSame = bookingMember.user_uuid === actualMember.userId;
    } else if (actualMember.pre_filled === 'COMPANY') {
      isSame =
        bookingMember.company_uuid === actualMember.companyId &&
        bookingMember.first_name === actualMember.firstName &&
        bookingMember.last_name === actualMember.lastName;
    } else {
      isSame = bookingMember.parcel_member_uuid === actualMember.memberId;
    }

    return isSame;
  }

  public async handleUpdateMembers(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    bookingMembers: {
      sender?: CheckoutParcelMember;
      recipient?: CheckoutParcelMember;
      thirdParty?: CheckoutParcelMember;
    },
    sender: NewCreateParcelBookingActorDTO | undefined,
    recipient: NewCreateParcelBookingActorDTO | undefined,
    third_party: NewCreateParcelBookingUserDTO | null,
    senderSync: { user_uuid?: string; company_uuid?: string },
    recipientSync: { user_uuid?: string; company_uuid?: string },
    bookingUuid: string,
  ) {
    const senderSame =
      sender && bookingMembers.sender
        ? await this.compareMembers(bookingMembers.sender, sender)
        : true;
    const recipientSame =
      recipient && bookingMembers.recipient
        ? await this.compareMembers(bookingMembers.recipient, recipient)
        : true;
    const thirdPartySame =
      third_party && bookingMembers.thirdParty
        ? bookingMembers.thirdParty.email === third_party.email
        : true;

    const syncSenderUserId = sender.userId
      ? sender.userId
      : senderSync?.user_uuid;
    const syncSenderCompanyId = sender.companyId
      ? sender.companyId
      : senderSync?.company_uuid;

    const syncRecipientUserId = recipient.userId
      ? recipient.userId
      : recipientSync?.user_uuid;
    const syncRecipientCompanyId = recipient.companyId
      ? recipient.companyId
      : recipientSync?.company_uuid;

    const memberUpdate: {
      senderNeed: boolean;
      recipientNeed: boolean;
      thirdPartyNeed: boolean;
    } = {
      senderNeed: true,
      recipientNeed: true,
      thirdPartyNeed: true,
    };

    if (bookingMembers.sender && !senderSame) {
      console.log('sender different');

      const memberRelationships =
        await prisma.parcel_member_parcel_bookings.findMany({
          where: {
            parcel_member_uuid: bookingMembers.sender.parcel_member_uuid,
          },
        });

      if (memberRelationships?.length > 1) {
        const usedMember = memberRelationships.find(
          (item) => item.parcel_booking_uuid === bookingUuid,
        );

        if (usedMember) {
          console.log('sender delete member');
          await prisma.parcel_member_parcel_bookings.delete({
            where: {
              parcel_member_parcel_booking_uuid:
                usedMember.parcel_member_parcel_booking_uuid,
            },
          });
          memberUpdate.senderNeed = true;
        } else {
          memberUpdate.senderNeed = false;
        }
      } else if (sender.pre_filled === 'ADDRESS') {
        console.log('sender update');

        await prisma.parcel_members.update({
          data: {
            user_uuid: syncSenderUserId ?? null,
            company_uuid: syncSenderCompanyId ?? null,
            tax_id: sender.taxId,
            email: sender.email,
            first_name: sender?.firstName,
            last_name: sender?.lastName,
            company_name: sender?.companyName,
            full_name: `${sender?.firstName} ${sender?.lastName}`,
            phone: sender?.phone as any,
            is_residential_address: sender.address.addressType !== 'commercial',
            type: sender.type ?? 'INDIVIDUAL',
            pre_filled: sender.pre_filled ?? 'ADDRESS',
          },
          where: {
            parcel_member_uuid: bookingMembers.sender.parcel_member_uuid,
          },
        });

        memberUpdate.senderNeed = false;
      }
    }

    if (bookingMembers.sender && senderSame) {
      memberUpdate.senderNeed = false;
    }

    if (bookingMembers.recipient && !recipientSame) {
      console.log('recipient different');
      const memberRelationships =
        await prisma.parcel_member_parcel_bookings.findMany({
          where: {
            parcel_member_uuid: bookingMembers.recipient.parcel_member_uuid,
          },
        });

      if (memberRelationships?.length > 1) {
        const usedMember = memberRelationships.find(
          (item) => item.parcel_booking_uuid === bookingUuid,
        );

        if (usedMember) {
          console.log('recipient delete member');

          await prisma.parcel_member_parcel_bookings.delete({
            where: {
              parcel_member_parcel_booking_uuid:
                usedMember.parcel_member_parcel_booking_uuid,
            },
          });
          memberUpdate.recipientNeed = true;
        } else {
          memberUpdate.recipientNeed = false;
        }
      } else if (recipient.pre_filled === 'ADDRESS') {
        console.log('recipient update');
        await prisma.parcel_members.update({
          data: {
            user_uuid: syncRecipientUserId ?? null,
            company_uuid: syncRecipientCompanyId ?? null,
            tax_id: recipient.taxId,
            email: recipient.email,
            first_name: recipient?.firstName,
            last_name: recipient?.lastName,
            company_name: recipient?.companyName,
            full_name: `${recipient?.firstName} ${recipient?.lastName}`,
            phone: recipient?.phone as any,
            is_residential_address:
              recipient.address.addressType !== 'commercial',
            type: recipient.type ?? 'INDIVIDUAL',
            pre_filled: recipient.pre_filled ?? 'ADDRESS',
          },
          where: {
            parcel_member_uuid: bookingMembers.recipient.parcel_member_uuid,
          },
        });

        memberUpdate.recipientNeed = false;
      }
    }

    if (bookingMembers.recipient && recipientSame) {
      memberUpdate.recipientNeed = false;
    }

    if (bookingMembers.thirdParty && !thirdPartySame) {
      console.log('third party different');
      const memberRelationships =
        await prisma.parcel_member_parcel_bookings.findMany({
          where: {
            parcel_member_uuid: bookingMembers.thirdParty.parcel_member_uuid,
          },
        });

      if (memberRelationships.length > 1) {
        const usedMember = memberRelationships.find(
          (item) => item.parcel_booking_uuid === bookingUuid,
        );

        if (usedMember) {
          await prisma.parcel_member_parcel_bookings.delete({
            where: {
              parcel_member_parcel_booking_uuid:
                usedMember.parcel_member_parcel_booking_uuid,
            },
          });
          memberUpdate.thirdPartyNeed = true;
        } else {
          memberUpdate.thirdPartyNeed = false;
        }
      } else {
        console.log('third update');
        await prisma.parcel_members.update({
          data: {
            email: third_party.email,
            user_uuid: third_party.uuid,
          },
          where: {
            parcel_member_uuid: bookingMembers.thirdParty.parcel_member_uuid,
          },
        });

        memberUpdate.thirdPartyNeed = false;
      }
    }

    if (bookingMembers.thirdParty && thirdPartySame) {
      memberUpdate.thirdPartyNeed = false;
    }

    return memberUpdate;
  }

  public async handleParcelMembers(parcelBooking) {
    let sender: CheckoutParcelMember;
    let recipient: CheckoutParcelMember;
    let thirdParty: CheckoutParcelMember;

    const parcelMembers = parcelBooking.parcel_member_parcel_bookings;

    for (const item of parcelMembers) {
      switch (item.parcel_members.subject_role_types.name) {
        case 'Sender':
          sender = item.parcel_members;
          break;
        case 'Recipient':
          recipient = item.parcel_members;
          break;
        case '3rd Party':
          thirdParty = item.parcel_members;
          break;
        default:
          break;
      }
    }

    return { sender, recipient, thirdParty };
  }

  public formatMembersToActors(
    member: CheckoutParcelMember,
    quote: NewRateShipmentDTO,
  ): NewCreateParcelBookingActorDTO {
    const memberRole = member?.subject_role_types?.name;

    const address =
      memberRole === 'Sender' ? quote?.whereFrom?.data : quote?.whereTo?.data;

    let formattedAddress: NewCreateParcelBookingAddressDataDTO;

    if (address?.userId || address?.companyId) {
      formattedAddress = address?.userId
        ? { userId: address.userId, ...formattedAddress }
        : address.companyId
        ? { companyId: address.companyId, ...formattedAddress }
        : { memberId: address.memberId, ...formattedAddress };
    } else {
      formattedAddress = {
        addressType: address?.addressType,
        additionalAddress: address?.additionalAddress,
        street: address?.street,
        state: address?.state,
        country: address?.country,
        city: address?.city,
        zipCode: address?.zipCode,
        streetNumber: address?.streetNumber,
        complementAddress: address?.additionalAddress,
      };
    }

    return {
      userId: member?.user_uuid,
      companyId: member?.company_uuid,
      memberId: member?.parcel_member_uuid,
      email: member?.email,
      firstName: member?.first_name,
      lastName: member?.last_name,
      companyName: member?.company_name,
      phone: {
        number: member?.phone?.number,
        countryCode: member?.phone?.countryCode,
      },
      taxId: member?.tax_id,
      type: member?.type ?? 'INDIVIDUAL',
      pre_filled: member?.pre_filled ?? 'ADDRESS',
      address: formattedAddress,
    };
  }

  public async getUser(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    id: string,
  ) {
    const user = await prisma.users.findFirst({ where: { user_uuid: id } });
    if (!user) {
      const message = 'User not found';
      throw new BadRequestException({ message });
    }

    return user;
  }

  public async getParcelRateSource(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    rateSource: string,
  ) {
    if (rateSource === 'sky postal') rateSource = 'skypostal';
    if (rateSource === 'clear lane freight') rateSource = 'clearlane';

    const parcelRateSource = await prisma.parcel_rate_sources.findFirst({
      where: {
        name: { contains: rateSource },
      },
    });
    if (!parcelRateSource) {
      const message = 'Parcel Rate Source not found';
      throw new BadRequestException({ message });
    }

    return parcelRateSource;
  }

  public async subjectRoleTypes(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    const subjectRoleTypes = await prisma.subject_role_types.findMany();

    const senderUuid = subjectRoleTypes.find(
      (item) => item.name === 'Sender',
    )?.subject_role_type_uuid;
    const recipientUuid = subjectRoleTypes.find(
      (item) => item.name === 'Recipient',
    )?.subject_role_type_uuid;
    const thirdPartyUuid = subjectRoleTypes.find(
      (item) => item.name === '3rd Party',
    )?.subject_role_type_uuid;

    return {
      senderUuid,
      recipientUuid,
      thirdPartyUuid,
    };
  }

  public async validateUSPSPhone(createData: NewCreateParcelBookingDTO) {
    const isDomestic =
      createData.quote.whereFrom.data.country ===
      createData.quote.whereTo.data.country;

    const senderPhone = createData?.sender?.phone?.number;
    const senderPrefix = createData.sender.phone.countryCode;

    const recipientPhone = createData?.recipient?.phone?.number;
    const recipientPrefix = createData.recipient.phone.countryCode;

    if (isDomestic) {
      if (senderPhone.length > 10 || senderPrefix !== '1') {
        throw new BadRequestException(
          'Only USA number format are accepted to this parcel',
        );
      } else if (recipientPhone.length > 10 || recipientPrefix !== '1') {
        throw new BadRequestException(
          'Only USA number format are accepted to this parcel',
        );
      }
    } else {
      if (senderPhone.length > 10 || senderPrefix !== '1') {
        throw new BadRequestException(
          'Only USA number format are accepted to this parcel',
        );
      } else if (recipientPhone.length > 30) {
        throw new BadRequestException(
          'Only USA number format are accepted to this parcel',
        );
      }
    }
  }

  public async getQuote(
    rateSource: string,
    quote: NewRateShipmentDTO,
    serviceCode: string,
    productCode?: string,
    order?: NewRateShipmentReturnDTO,
    senderEmail?: string,
    sender?: NewCreateParcelBookingActorDTO,
    receiver?: NewCreateParcelBookingActorDTO,
  ) {
    const parcelFreightAmount = await this.courierRates(
      rateSource,
      quote,
      serviceCode,
      productCode,
      order,
      senderEmail,
      sender,
      receiver,
    );

    console.log('parcelFreightAmount', parcelFreightAmount);

    if (typeof parcelFreightAmount !== 'number') {
      throw new BadRequestException({ message: 'Quote fails' });
    }

    return { parcelFreightAmount };
  }

  private async calculatePickup(
    pickupData: IPickupAvailabilityData,
    courier: string,
    quote: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
  ) {
    let data: any = { total: 0 };
    switch (courier) {
      case 'ups':
        data = await this.upsService.pickup(pickupData);
        break;
      case 'fedex':
        data = await this.fedexService.pickup(quote, order);
        break;
      case 'usps':
        data = await this.uspsService.pickup(quote);
        break;
      case 'dhl':
        data = await this.dhlService.pickup(quote, order);
        break;
      default:
        break;
    }
    return data?.total;
  }

  public async handleStripe(
    metadata: NewRateShipmentReturnDTO,
    quote: NewRateShipmentDTO,
    parcelFreightAmount: number,
    user: users,
    email: string,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    const pickupSelected = metadata?.services?.find(
      (i) => i.name === 'Pick-up',
    );

    const isFirstMile = pickupSelected?.items.find(
      (i) => i.name === 'First Mile',
    );
    const pickupBody: UPSPickup = {
      address: {
        address: quote?.whereFrom?.formattedAddress,
        city: quote?.whereFrom?.data?.city,
        complement_address: quote?.whereFrom?.data?.additionalAddress,
        country: quote?.whereFrom?.data?.country,
        is_residential_address:
          quote?.whereFrom?.data?.addressType === 'residential',
        postal_code: quote?.whereFrom?.data?.zipCode,
        state: quote?.whereFrom?.data?.state,
        street: quote?.whereFrom?.data?.street,
        street_number: quote?.whereFrom?.data?.streetNumber,
      },
      pickup_date: quote?.shipDate?.data?.date as any,
    };

    let pickupAmount = 0;
    let freightCost = 0;

    if (isFirstMile) {
      const firstMilePickUp = pickupSelected.items.find(
        (i) => i.name === 'Pick-up',
      );
      pickupAmount = firstMilePickUp?.selected
        ? await this.calculatePickup(
            pickupBody,
            pickupSelected?.company?.name?.toLowerCase(),
            quote,
            metadata,
          )
        : 0;
    } else if (pickupSelected && !isFirstMile) {
      pickupAmount = pickupSelected?.items[0]?.selected
        ? await this.calculatePickup(
            pickupBody,
            pickupSelected?.company?.name?.toLowerCase(),
            quote,
            metadata,
          )
        : 0;
    }

    const findProfit = await this.profitService.getProfitModal('Parcel');
    const findLandProfit = await this.profitService.getProfitModal('Land');
    const findAirProfit = await this.profitService.getProfitModal('Parcel');

    if (!quote.category) {
      throw new BadRequestException('Shipment category not found!');
    }

    if (quote.category === 'parcel') {
      pickupAmount =
        pickupAmount > 0
          ? await this.profitService.totalWithProfit(
              {
                modal: 'Parcel',
                profit: findProfit,
                price: Number(pickupAmount),
                courier: metadata.company.name,
              },
              true,
            )
          : 0;

      freightCost = findProfit
        ? await this.profitService.totalWithProfit(
            {
              modal: 'Parcel',
              profit: findProfit,
              price: Number(parcelFreightAmount),
              courier: metadata.company.name,
            },
            false,
          )
        : parcelFreightAmount;

      freightCost = freightCost + pickupAmount;
    } else if (quote.category === 'land') {
      console.log('freightCos before', freightCost);

      freightCost = findLandProfit
        ? await this.profitService.totalWithProfit(
            {
              modal: 'Land',
              profit: findLandProfit,
              price: Number(parcelFreightAmount),
              courier: metadata.company.name,
            },
            false,
          )
        : parcelFreightAmount;

      console.log('freightCost', freightCost);

      const choosedQuoteServices = metadata.services;

      const additionalValueServicesCost = 10;

      const valueServices = choosedQuoteServices.find(
        (i) => i.name === 'Value Services',
      );

      if (valueServices) {
        const liftgatePicup = valueServices.items.find(
          (i) => i.name === 'Liftgate Service Pickup',
        );

        if (liftgatePicup.selected || liftgatePicup.required) {
          freightCost +=
            liftgatePicup.price.value + additionalValueServicesCost;
        }

        const limitedAccessPickup = valueServices.items.find(
          (i) => i.name === 'Limited Access Service Pickup',
        );

        if (limitedAccessPickup.selected || limitedAccessPickup.required) {
          freightCost +=
            limitedAccessPickup.price.value + additionalValueServicesCost;
        }

        const residentialPickup = valueServices.items.find(
          (i) => i.name === 'Residential Pickup',
        );

        if (residentialPickup.selected || residentialPickup.required) {
          freightCost +=
            residentialPickup.price.value + additionalValueServicesCost;
        }

        const insidePickup = valueServices.items.find(
          (i) => i.name === 'Inside Pickup',
        );

        if (insidePickup.selected || insidePickup.required) {
          freightCost += insidePickup.price.value + additionalValueServicesCost;
        }

        const lifgateDelivery = valueServices.items.find(
          (i) => i.name === 'Liftgate Service Delivery',
        );

        if (lifgateDelivery.selected || lifgateDelivery.required) {
          freightCost +=
            lifgateDelivery.price.value + additionalValueServicesCost;
        }

        const limitedAccessDelivery = valueServices.items.find(
          (i) => i.name === 'Limited Access Service Delivery',
        );

        if (limitedAccessDelivery.selected || limitedAccessDelivery.required) {
          freightCost +=
            limitedAccessDelivery.price.value + additionalValueServicesCost;
        }

        const residentialDelivery = valueServices.items.find(
          (i) => i.name === 'Residential Delivery',
        );

        if (residentialDelivery.selected || residentialDelivery.required) {
          freightCost +=
            residentialDelivery.price.value + additionalValueServicesCost;
        }

        const insideDelivery = valueServices.items.find(
          (i) => i.name === 'Inside Delivery',
        );

        if (insideDelivery.selected || insideDelivery.required) {
          freightCost +=
            insideDelivery.price.value + additionalValueServicesCost;
        }
      }
    } else if (quote.category === 'air') {
      pickupAmount =
        pickupAmount > 0
          ? await this.profitService.totalWithProfit(
              {
                modal: 'Air',
                profit: findAirProfit,
                price: Number(pickupAmount),
                courier: metadata.company.name,
              },
              true,
            )
          : 0;

      freightCost = findAirProfit
        ? await this.profitService.totalWithProfit(
            {
              modal: 'Air',
              profit: findAirProfit,
              price: Number(parcelFreightAmount),
              courier: metadata.company.name,
            },
            false,
          )
        : parcelFreightAmount;

      freightCost = freightCost + pickupAmount;
      
      const choosedQuoteServices = metadata.services;

      const pickupServices = choosedQuoteServices.find(
        (i) => i.name === 'Pick-Up',
      );

      if (pickupServices) {
        const liftgatePicup = pickupServices.items.find(
          (i) => i.name === 'Liftgate Service Pickup',
        ); 

        if (liftgatePicup.selected || liftgatePicup.required) {
          freightCost += liftgatePicup.price.value;
        }

        const limitedAccessPickup = pickupServices.items.find(
          (i) => i.name === 'Limited Access Service Pickup',
        );

        if (limitedAccessPickup.selected || limitedAccessPickup.required) {
          freightCost += limitedAccessPickup.price.value;
        }
      }
    }

    const stripeFixedFee = 0.3;
    const stripeVariableFee = 0.0399;

    const amount = (freightCost + stripeFixedFee) / (1 - stripeVariableFee);
    const paymentMethodFee = amount - freightCost;

    const amountCents = getAmountCents(amount);
    const subTotal = centsToUnits(amountCents);
    const parcelAmount = subTotal;

    let stripeCustomer;

    if (!user.stripe_customer_id) {
      stripeCustomer = await this.stripeService.createCustomer();
      await prisma.users.update({
        where: { user_uuid: user.user_uuid },
        data: {
          stripe_customer_id: stripeCustomer.id,
        },
      });
    }

    const paymentIntentsBody: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency: 'usd',
      payment_method_types: ['card'],
      receipt_email: email,
      customer: stripeCustomer?.id || user.stripe_customer_id,
      setup_future_usage: 'off_session',
    };

    const paymentIntent = await this.stripeService.createPaymentIntent(
      paymentIntentsBody,
    );

    return { paymentIntent, paymentMethodFee, parcelAmount };
  }

  public async handleNewBooking(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    metadata,
    parcelFreightAmount,
    stripe,
    rateSource,
    { user_uuid, quote, estimated_date },
  ) {
    const metadataWithParcel = Object.assign({}, metadata, {
      parcel_price: parcelFreightAmount,
    });

    const parcelBooking = await prisma.parcel_bookings.create({
      data: {
        user_uuid,
        parcel_booking_uuid: uuidv4(),
        payment_intent_id: stripe.paymentIntent.id,
        quote: quote,
        metadata: metadataWithParcel,
        parcel_rate_source_uuid: rateSource.parcel_rate_source_uuid as never,
        estimated_date,
        created_at: new Date(),
      },
    });

    return parcelBooking;
  }

  private membersFilter = async (
    member: NewCreateParcelBookingActorDTO,
    role_type_uuid: string,
  ) => {
    if (member.memberId && member.pre_filled === 'MEMBER') {
      return {
        AND: [
          { parcel_member_uuid: member.memberId },
          { subject_role_type_uuid: role_type_uuid },
        ],
      };
    }

    const filter: any = [
      { email: member.email },
      { first_name: member.firstName },
      { last_name: member.lastName },
      { tax_id: member.taxId },
      { pre_filled: member.pre_filled === 'AIRPORT' ? 'ADDRESS' : member.pre_filled },
      { subject_role_type_uuid: role_type_uuid },
      { type: member.type },
    ];

    if (member?.companyName && member?.pre_filled === 'COMPANY') {
      filter.push({ company_name: member?.companyName });
    }

    if (member?.userId) {
      filter.push({ user_uuid: member?.userId });
    }

    if (member?.companyId) {
      filter.push({ company_uuid: member.companyId });
    }

    return { AND: [...filter] };
  };

  public async handlePlayers(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    sender: NewCreateParcelBookingActorDTO,
    recipient: NewCreateParcelBookingActorDTO,
    thirdParty: NewCreateParcelBookingUserDTO | null,
    subjectRoleType: {
      senderUuid: string;
      recipientUuid: string;
      thirdPartyUuid: string;
    },
  ) {
    let thirdPartyFound = null;

    const senderFound = await prisma.parcel_members.findFirst({
      where: await this.membersFilter(sender, subjectRoleType.senderUuid),
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
    });

    const recipientFound = await prisma.parcel_members.findFirst({
      where: await this.membersFilter(recipient, subjectRoleType.recipientUuid),
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
    });

    if (thirdParty?.uuid) {
      thirdPartyFound = thirdParty
        ? await prisma.parcel_members.findFirst({
            where: {
              email: thirdParty?.email,
              subject_role_type_uuid: subjectRoleType?.thirdPartyUuid,
              user_uuid: thirdParty?.uuid,
            },
          })
        : null;
    }
    return { senderFound, recipientFound, thirdPartyFound };
  }

  private async findCompany(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    member: NewCreateParcelBookingActorDTO,
  ) {
    if (!member?.taxId && !member?.companyId) {
      return null;
    }

    const companyInfo = member?.companyId
      ? { company_uuid: member?.companyId }
      : { tax_id: member?.taxId };

    return await prisma.companies.findUnique({
      where: {
        ...companyInfo,
      },
    });
  }

  private async findUser(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    member,
  ) {
    return await prisma.users.findUnique({ where: { email: member?.email } });
  }

  public async handleSyncs(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    sender: NewCreateParcelBookingActorDTO,
    recipient: NewCreateParcelBookingActorDTO,
    thirdParty: NewCreateParcelBookingUserDTO,
  ) {
    let senderSync = null;
    let recipientSync = null;
    let thirdPartySync = null;

    if (sender?.email) {
      senderSync =
        sender?.type === 'CORPORATION'
          ? await this.findCompany(prisma, sender)
          : await this.findUser(prisma, sender);
    }
    if (recipient?.email) {
      recipientSync =
        recipient?.type === 'CORPORATION'
          ? await this.findCompany(prisma, recipient)
          : await this.findUser(prisma, recipient);
    }
    if (thirdParty?.email) {
      thirdPartySync = null;
    }

    return { senderSync, recipientSync, thirdPartySync };
  }

  public async handleSender(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    senderFound: parcel_members & {
      locations: locations & {
        location_administrative_divisions: location_administrative_divisions[];
        postal_codes: postal_codes;
      };
      subject_role_types: subject_role_types;
    },
    sender: NewCreateParcelBookingActorDTO,
    subjectRoleType,
    senderSync,
  ) {
    let member = null;
    let existSender = false;

    if (senderFound) {
      const senderFoundLocation = this.address.formatLocation(
        senderFound.locations,
      );
      const isSameSenderFoundLocation = this.address.isSameLocation(
        senderFoundLocation,
        sender?.address,
      );

      if (isSameSenderFoundLocation) {
        member = senderFound;
        existSender = true;
      }
    }

    const syncUserId = sender.userId ? sender.userId : senderSync?.user_uuid;
    const syncCompanyId = sender.companyId
      ? sender.companyId
      : senderSync?.company_uuid;

    if (!existSender) {
      const senderLocation = await this.address.create(sender?.address, prisma);

      const senderCreated = await prisma.parcel_members.create({
        data: {
          email: sender?.email,
          parcel_member_uuid: uuidv4(),
          first_name: sender?.firstName,
          last_name: sender?.lastName,
          company_name: sender?.companyName,
          full_name: `${sender?.firstName} ${sender?.lastName}`,
          tax_id: sender?.taxId,
          phone: sender?.phone as any,
          is_residential_address: sender.address.addressType !== 'commercial',
          location_uuid: senderLocation?.location_uuid,
          subject_role_type_uuid: subjectRoleType.senderUuid,
          user_uuid: syncUserId ?? null,
          company_uuid: syncCompanyId ?? null,
          type: sender.type ?? 'INDIVIDUAL',
          pre_filled: sender.pre_filled ?? 'ADDRESS',
        },
      });

      member = senderCreated;
    }

    return { member, sender };
  }

  public async handleRecipient(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    recipientFound: parcel_members & {
      locations: locations & {
        postal_codes: postal_codes;
      };
      subject_role_types: subject_role_types;
    },
    recipient: NewCreateParcelBookingActorDTO,
    subjectRoleType,
    recipientSync,
  ) {
    let member = null;
    let existRecipient = false;

    if (recipientFound) {
      const recipientFoundLocation = this.address.formatLocation(
        recipientFound.locations,
      );

      const isSameRecipientFoundLocation = this.address.isSameLocation(
        recipientFoundLocation,
        recipient.address,
      );

      if (isSameRecipientFoundLocation) {
        member = recipientFound;
        existRecipient = true;
      }
    }

    const syncUserId = recipient.userId
      ? recipient.userId
      : recipientSync?.user_uuid;
    const syncCompanyId = recipient.companyId
      ? recipient.companyId
      : recipientSync?.company_uuid;

    if (!existRecipient) {
      const recipientLocation = await this.address.create(
        recipient.address,
        prisma,
      );

      const recipientCreated = await prisma.parcel_members.create({
        data: {
          email: recipient?.email,
          full_name: `${recipient?.firstName} ${recipient?.lastName}`,
          first_name: recipient?.firstName,
          last_name: recipient?.lastName,
          company_name: recipient?.companyName,
          tax_id: recipient?.taxId,
          parcel_member_uuid: uuidv4(),
          phone: recipient?.phone as any,
          is_residential_address:
            recipient.address.addressType !== 'commercial',
          location_uuid: recipientLocation.location_uuid,
          subject_role_type_uuid: subjectRoleType.recipientUuid,
          user_uuid: syncUserId ?? null,
          company_uuid: syncCompanyId ?? null,
          type: recipient.type ?? 'INDIVIDUAL',
          pre_filled: recipient.pre_filled ?? 'ADDRESS',
        },
      });

      member = recipientCreated;
    }

    return { member, recipient };
  }

  public async handleThirdParty(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    thirdPartyFound,
    third_party: NewCreateParcelBookingUserDTO,
    subjectRoleType,
    thirdPartySync,
  ) {
    let member = null;
    let existThirdParty = false;

    if (thirdPartyFound) {
      member = thirdPartyFound;
      existThirdParty = true;
    }

    if (!existThirdParty) {
      const thirdPartyCreated = await prisma.parcel_members.create({
        data: {
          email: third_party?.email,
          parcel_member_uuid: uuidv4(),
          subject_role_type_uuid: subjectRoleType?.thirdPartyUuid,
          user_uuid: third_party?.uuid,
        },
      });
      member = thirdPartyCreated;
    }

    return { member, third_party };
  }

  public async handleRelationShips(
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
    members,
    bookingUuid: string,
  ) {
    const relationships = members.map(({ parcel_member_uuid }) => ({
      parcel_member_parcel_booking_uuid: uuidv4(),
      parcel_member_uuid,
      parcel_booking_uuid: bookingUuid,
    }));

    await prisma.parcel_member_parcel_bookings.createMany({
      data: relationships,
    });
  }

  public parcelBookingResponse(
    bookingUuid,
    parcelAmount,
    subTotal,
    paymentMethodFee,
  ) {
    return {
      parcel_booking_uuid: bookingUuid,
      billing: {
        parcel: Number(parcelAmount.toFixed(2)),
        sub_total: Number(subTotal.toFixed(2)),
        payment_method_fee: Number(paymentMethodFee?.toFixed(2)),
        total: Number(subTotal.toFixed(2)),
        currency: {
          code: 'USD',
          symbol: '$',
        },
      },
    };
  }

  public async findUserData(userId: string): Promise<IReturnMaskedData> {
    const { phone, email, tax_id, first_name, last_name } =
      await this.prisma.users.findUnique({
        where: {
          user_uuid: userId,
        },
      });

    const formattedPhone = (phone) => {
      return {
        countryCode: phone?.prefix ?? phone?.countryCode,
        number: phone?.number,
      };
    };

    return {
      phone: formattedPhone(phone),
      email,
      taxId: tax_id,
      firstName: first_name,
      lastName: last_name,
    };
  }

  public async findUserAddressData(
    userId: string,
  ): Promise<IReturnMaskedAddressData> {
    const { locations } = await this.prisma.users.findUnique({
      where: {
        user_uuid: userId,
      },
      include: {
        locations: {
          include: {
            postal_codes: true,
            location_administrative_divisions: {
              include: {
                administrative_divisions: {
                  include: {
                    administrative_division_types: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!locations) {
      throw new BadRequestException('User or address was not found!');
    }

    const cityObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'city',
      );

    const streetObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'street',
      );

    const stateObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'state',
      );

    const countryObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'country',
      );

    const postalCodeObj = locations && locations.postal_codes;

    return (
      cityObj &&
      streetObj &&
      stateObj &&
      countryObj && {
        additionalAddress: locations.complement,
        streetNumber: locations.street_number,
        zipCode: postalCodeObj.value,
        city: cityObj && cityObj.administrative_divisions.value,
        street: streetObj && streetObj.administrative_divisions.value,
        state: stateObj && stateObj.administrative_divisions.value,
        country: countryObj && countryObj.administrative_divisions.value,
      }
    );
  }

  public async findCompanyData(companyId: string): Promise<IReturnMaskedData> {
    const {
      email,
      tax_id,
      phone,
      legal_name,
      users: { first_name, last_name },
    } = await this.prisma.companies.findUnique({
      where: {
        company_uuid: companyId,
      },
      include: {
        users: true,
      },
    });

    const formattedPhone = (phone) => {
      return {
        countryCode: phone?.prefix ?? phone?.countryCode,
        number: phone?.number,
      };
    };

    return {
      phone: formattedPhone(phone),
      email,
      taxId: tax_id,
      firstName: first_name,
      lastName: last_name,
      companyName: legal_name,
    };
  }

  public async findCompanyAddressData(
    companyId: string,
  ): Promise<IReturnMaskedAddressData> {
    const { locations } = await this.prisma.companies.findUnique({
      where: {
        company_uuid: companyId,
      },
      include: {
        users: true,
        locations: {
          include: {
            postal_codes: true,
            location_administrative_divisions: {
              include: {
                administrative_divisions: {
                  include: {
                    administrative_division_types: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!locations) {
      throw new BadRequestException('Company or address was not found!');
    }

    const cityObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'city',
      );

    const streetObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'street',
      );

    const stateObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'state',
      );

    const countryObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'country',
      );

    const postalCodeObj = locations && locations.postal_codes;

    return (
      cityObj &&
      streetObj &&
      stateObj &&
      countryObj && {
        additionalAddress: locations.complement,
        streetNumber: locations.street_number,
        zipCode: postalCodeObj.value,
        city: cityObj && cityObj.administrative_divisions.value,
        street: streetObj && streetObj.administrative_divisions.value,
        state: stateObj && stateObj.administrative_divisions.value,
        country: countryObj && countryObj.administrative_divisions.value,
      }
    );
  }

  public async findMemberData(memberId: string): Promise<IReturnMaskedData> {
    const {
      email,
      phone,
      tax_id,
      full_name,
      first_name,
      last_name,
      company_name,
    } = await this.prisma.parcel_members.findUnique({
      where: {
        parcel_member_uuid: memberId,
      },
    });

    const formattedPhone = (phone) => {
      return {
        countryCode: phone?.prefix ?? phone?.countryCode,
        number: phone?.number,
      };
    };

    return {
      email,
      phone: formattedPhone(phone),
      taxId: tax_id,
      firstName: first_name ? first_name : full_name?.split(' ')[0],
      lastName: last_name ? last_name : full_name?.split(' ')[1],
      companyName: company_name ? company_name : full_name,
    };
  }

  public async findMemberAddressData(
    memberId: string,
  ): Promise<IReturnMaskedAddressData> {
    const { locations } = await this.prisma.parcel_members.findUnique({
      where: {
        parcel_member_uuid: memberId,
      },
      include: {
        locations: {
          include: {
            postal_codes: true,
            location_administrative_divisions: {
              include: {
                administrative_divisions: {
                  include: {
                    administrative_division_types: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!locations) {
      throw new BadRequestException('Member or address was not found!');
    }

    const cityObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'city',
      );

    const streetObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'street',
      );

    const stateObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'state',
      );

    const countryObj =
      locations &&
      locations.location_administrative_divisions &&
      locations.location_administrative_divisions.find(
        (e) =>
          e.administrative_divisions.administrative_division_types.name ===
          'country',
      );

    const postalCodeObj = locations && locations.postal_codes;

    return (
      cityObj &&
      streetObj &&
      stateObj &&
      countryObj && {
        additionalAddress: locations.complement,
        streetNumber: locations.street_number,
        zipCode: postalCodeObj.value,
        city: cityObj && cityObj.administrative_divisions.value,
        street: streetObj && streetObj.administrative_divisions.value,
        state: stateObj && stateObj.administrative_divisions.value,
        country: countryObj && countryObj.administrative_divisions.value,
      }
    );
  }
}
