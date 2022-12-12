import { BadRequestException, Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutParcelMember } from '../checkout/interface/checkout.interface';
import { DhlService } from '../couriers/dhl/dhl.service';
import {
  NewRateShipmentAddressDataDTO,
  NewRateShipmentDTO,
} from '../couriers/dto/newCouriers.dto';
import { FedexService } from '../couriers/fedex/fedex.service';
import { SkyPostalService } from '../couriers/sky-postal/sky-postal.service';
import { UpsService } from '../couriers/ups/ups.service';

@Injectable()
export class UniversalTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upsService: UpsService,
    private readonly dhlService: DhlService,
    private readonly skypostalService: SkyPostalService,
    private readonly fedexService: FedexService,
  ) {}

  private async getParcelMembers(bookingMembers) {
    let sender: CheckoutParcelMember;
    let recipient: CheckoutParcelMember;

    bookingMembers.map((bookingMember) => {
      if (bookingMember.parcel_members?.subject_role_types.name === 'Sender') {
        sender = {
          ...bookingMember.parcel_members,
        };
      } else if (
        bookingMember.parcel_members?.subject_role_types.name === 'Recipient'
      ) {
        recipient = {
          ...bookingMember.parcel_members,
        };
      }
    });

    return { sender, recipient };
  }

  public async universalTracking(trackingNumber: string) {
    try {
      const tracking = trackingNumber;

      const findTracking = await this.prisma.parcel_bookings.findFirst({
        where: { tracking_code_id: trackingNumber },
        include: {
          tracking_code: {
            include: {
              feedbacks: true,
            },
          },
          parcel_rate_sources: true,
          parcel_member_parcel_bookings: {
            include: {
              parcel_members: {
                include: {
                  subject_role_types: true,
                },
              },
            },
          },
        },
      });

      if (!findTracking || !findTracking?.parcel_rate_sources?.name) {
        throw new BadRequestException(
          'Tracking not found or parcel source not found!',
        );
      }

      const findAliroksUniversalTracking =
        await this.prisma.tracking_code.findUnique({
          where: { tracking_code: tracking },
        });

      if (!findAliroksUniversalTracking) {
        throw new BadRequestException('Universal tracking code not found!');
      }

      const { sender, recipient } = await this.getParcelMembers(
        findTracking.parcel_member_parcel_bookings,
      );

      const labelCreationDate = format(findTracking?.created_at, 'yyyy-MM-dd');

      const quote: NewRateShipmentDTO = findTracking?.quote as any;

      const destiny: NewRateShipmentAddressDataDTO = quote?.whereTo?.data;
      const origin: NewRateShipmentAddressDataDTO = quote?.whereFrom?.data;

      const courier = findTracking?.parcel_rate_sources?.name?.toUpperCase();

      const senderName = sender.first_name
        ? sender.first_name
        : sender.company_name ?? '';

      const recipientName = recipient.first_name
        ? recipient.first_name
        : recipient.company_name ?? '';

      const metadata = JSON.parse(JSON.stringify(findTracking.metadata));

      const estimatedDate = findTracking?.estimated_date
        ? format(findTracking?.estimated_date, 'yyyy-MM-dd')
        : '';

      let trackingData = {
        service_code: metadata?.service_code,
        company: metadata.company,
        parcel_rate_source_uuid:
          findTracking.parcel_rate_sources.parcel_rate_source_uuid,
        sender_name: senderName,
        feedbacks: findTracking.tracking_code.feedbacks
          ? [...[findTracking.tracking_code.feedbacks]]
          : [],
        recipient_name: recipientName,
        courier: courier,
        origin: `${origin?.city} ${
          origin?.zipCode
        }, ${origin?.state?.toUpperCase()} - ${origin?.country.toUpperCase()}`,
        destiny: `${destiny?.city} ${
          destiny?.zipCode
        }, ${destiny?.state?.toUpperCase()} - ${destiny?.country.toUpperCase()}`,
        trackingNumber: trackingNumber,
        estimatedDeliveryDate: estimatedDate,
        events: [],
      };

      switch (findTracking?.parcel_rate_sources?.name?.toLowerCase()) {
        case 'ups':
          trackingData = {
            ...trackingData,
            events:
              (await this.upsService.tracking(findTracking?.p_parcel_id))
                ?.events ?? [],
          };
          break;
        case 'dhl':
          trackingData = {
            ...trackingData,
            events:
              (await this.dhlService.tracking(findTracking?.p_parcel_id))
                ?.events ?? [],
          };
          break;
        case 'skypostal':
          trackingData = {
            ...trackingData,
            events:
              (await this.skypostalService.tracking(findTracking?.p_parcel_id))
                ?.events ?? [],
          };
          break;
        case 'fedex':
          const fedexEvents = (
            await this.fedexService.trackingRest(findTracking?.p_parcel_id)
          )?.events;
          trackingData = {
            ...trackingData,
            events: fedexEvents.reverse() ?? [],
          };
          break;

        default:
          break;
      }

      trackingData.events = [
        {
          date: labelCreationDate,
          description: 'Label Created',
          status: 'LABEL_CREATED',
        },
        ...trackingData?.events,
      ];

      return trackingData;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }
  }
}
