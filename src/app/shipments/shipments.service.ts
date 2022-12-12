import { BadRequestException, Injectable } from '@nestjs/common';
import {
  parcel_bookings,
  Prisma,
  shipment_statuses,
  users,
} from '@generated/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  OwnerRequest,
  ShipmentDetails,
  Member,
} from './dto/list-shipments.dto';
import { ConfigService } from '@nestjs/config';
import { UpdateDataDto } from './dto/update-shipment.dto';

@Injectable()
export class ShipmentsService {
  private BUCKET_NAME: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }

  async handle(
    currentUser: users,
    currentCompanyUuid: string,
    { owner }: { owner: string },
  ) {
    const ownerRequest =
      owner !== 'company'
        ? { user_uuid: currentUser?.user_uuid }
        : { company_uuid: currentCompanyUuid };

    if (!ownerRequest.user_uuid && !ownerRequest.company_uuid) {
      throw new BadRequestException('Shipment owner is not specified');
    }
    try {
      const parcelBookings: any = await this.getAllParcelBookings(
        ownerRequest,
        owner,
      );

      const normalizedData = await this.normalizeShipments(parcelBookings);

      return [...normalizedData];
    } catch (error) {
      return error;
    }
  }

  private async isSameCountry(origin, destination, whereFrom, whereTo) {
    let isSame: boolean;
    if (whereFrom && whereTo) {
      isSame = whereFrom.country !== whereTo.country;
    } else {
      isSame = origin.country !== destination.country;
    }

    return isSame;
  }

  private filterMember(members: Member[], type: string) {
    return members?.find(
      (member) => member.subject_role_types.name.toLowerCase().trim() === type,
    );
  }

  async normalizeShipments(parcelBookings: ShipmentDetails[]) {
    const formatted = parcelBookings.map((booking) => {
      const {
        label_url,
        invoice_url,
        shipment_statuses,
        parcel_booking_uuid,
        p_parcel_id: tracking_number,
        parcel_member_parcel_bookings,
        tracking_code_id,
        user_uuid,
        estimated_date,
        delivered_date,
        quote: {
          packages_meta,
          origin,
          destination,
          whereFrom,
          whereTo,
          whatsInside,
          ship_date,
          shipDate,
          packages,
          type,
          category,
        },
      } = booking.parcel_bookings;

      const categoryTab = category ?? 'parcel';

      const members = parcel_member_parcel_bookings.flatMap((member) => {
        return member.parcel_members;
      });

      const sender = this.filterMember(members, 'sender');
      const recipient = this.filterMember(members, 'recipient');
      const third_party = this.filterMember(members, '3rd party');

      const originAndDestinationAreDifferent = this.isSameCountry(
        origin,
        destination,
        whereFrom,
        whereTo,
      );

      const parsedLabel =
        label_url &&
        label_url.indexOf('ALIROK') !== -1 &&
        `https://${
          this.BUCKET_NAME
        }.s3.us-east-1.amazonaws.com/documents/labels/${
          label_url.match(/(ALIROK.*).pdf/)[1]
        }.pdf`;

      const parsedInvoice =
        invoice_url &&
        invoice_url.indexOf('ALIROK') !== -1 &&
        originAndDestinationAreDifferent
          ? `https://${
              this.BUCKET_NAME
            }.s3.us-east-1.amazonaws.com/documents/invoices/${
              invoice_url.match(/(ALIROK.*).pdf/)[1]
            }.pdf`
          : undefined;

      let package_labels;
      if (whatsInside) {
        package_labels =
          type == 'package' && originAndDestinationAreDifferent
            ? whatsInside.data.flatMap(({ items }) =>
                items?.map(({ description }) => description),
              )
            : '';
      } else {
        package_labels =
          packages_meta?.type !== 'envelope'
            ? packages.flatMap(({ items }) =>
                items?.map(({ commodity }) => commodity?.label),
              )
            : 'Documents';
      }

      const v2_packages_meta = whatsInside && {
        package_quantity: whatsInside.data.reduce(
          (acc, next) => acc + next.pieces,
          0,
        ),
        type: type,
        weight_total: whatsInside.data.reduce(
          (acc, next) => acc + next.weight.value,
          0,
        ),
        weight_unit: whatsInside.data[0].weight.unit,
      };

      const packages_meta_data = packages_meta
        ? packages_meta
        : v2_packages_meta;

      const ship_date_data = shipDate ? shipDate.data.date : ship_date;

      return {
        parcel_booking_uuid,
        user_uuid,
        tracking_number,
        universal_tracking: tracking_code_id,
        shipment_status: shipment_statuses?.name ?? 'New shipment',
        sender: {
          full_name: sender?.full_name,
          photo: sender?.users?.photo ?? sender?.companies?.logo,
        },
        recipient: {
          full_name: recipient?.full_name,
          photo: recipient?.users?.photo ?? recipient?.companies?.logo,
        },
        third_party: {
          full_name: third_party?.full_name,
          photo: third_party?.users?.photo ?? third_party?.companies?.logo,
        },
        estimated_date,
        delivered_date,
        ship_date: ship_date_data,
        packages_meta: packages_meta_data,
        package_labels,
        links: {
          label_url: parsedLabel,
          invoice_url: parsedInvoice,
        },
        category: categoryTab,
      };
    });

    return formatted.filter(
      (e, i) =>
        formatted.findIndex(
          (a) => a['parcel_booking_uuid'] === e['parcel_booking_uuid'],
        ) === i,
    );
  }

  async getAllParcelBookings(ownerRequest: OwnerRequest, owner: string) {
    const ownerData =
      owner !== 'company'
        ? { user_uuid: ownerRequest.user_uuid }
        : { company_uuid: ownerRequest.company_uuid };

    const members = await this.prisma.parcel_members.findMany({
      where: ownerData,
      select: {
        parcel_member_parcel_bookings: {
          select: {
            parcel_bookings: {
              select: {
                shipment_statuses: true,
                parcel_booking_uuid: true,
                user_uuid: true,
                p_parcel_id: true,
                estimated_date: true,
                quote: true,
                parcel_serial_number: true,
                tracking_code_id: true,
                delivered_date: true,
                invoice_url: true,
                label_url: true,
                parcel_member_parcel_bookings: {
                  select: {
                    parcel_members: {
                      select: {
                        full_name: true,
                        subject_role_types: true,
                        users: {
                          select: {
                            photo: true,
                          },
                        },
                        companies: {
                          select: {
                            logo: true,
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
      },
    });

    const memberBookings = members.flatMap((item) => {
      return item.parcel_member_parcel_bookings;
    });

    return memberBookings;
  }

  async updateShipmentStatus(updateData: UpdateDataDto) {
    try {
      const booking = await this.prisma.parcel_bookings.findUnique({
        where: {
          parcel_booking_uuid: updateData.parcel_booking_uuid,
        },
        select: {
          shipment_statuses: true,
        },
      });

      if (
        booking.shipment_statuses &&
        booking.shipment_statuses.name.toLocaleLowerCase() === 'delivered'
      ) {
        return { message: 'delivered' };
      }

      if (
        booking.shipment_statuses &&
        booking.shipment_statuses.name.toLocaleLowerCase() ===
          updateData.next_status.toLocaleLowerCase()
      ) {
        return { message: 'already updated' };
      }

      const statusList = await this.prisma.shipment_statuses.findMany();

      const nextStatus = statusList.find(
        (item) =>
          item.name.toLocaleLowerCase() ===
          updateData.next_status.toLocaleLowerCase(),
      );

      if (!nextStatus) {
        throw new BadRequestException({ message: 'new status not provided' });
      }

      const shipment = await this.prisma.parcel_bookings.update({
        where: {
          parcel_booking_uuid: updateData.parcel_booking_uuid,
        },
        data: { shipment_status_uuid: nextStatus.shipment_status_uuid },
      });

      return shipment;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  formatShipment(
    booking: parcel_bookings & {
      shipment_statuses: shipment_statuses;
    },
  ) {
    const order: any = booking.metadata;

    return {
      parcel_booking_uuid: booking.parcel_booking_uuid,
      quote: booking.quote,
      rate_type: order.rate_type || '',
      tracking_code_id: booking.tracking_code_id,
      user_uuid: booking.user_uuid,
      shipment_status: booking.shipment_statuses.name,
    };
  }

  async getShipmentQuoteById(booking_uuid: string) {
    try {
      if (!booking_uuid) {
        throw new BadRequestException('Booking id is missing');
      }

      const shipment: parcel_bookings & {
        shipment_statuses: shipment_statuses;
      } = await this.prisma.parcel_bookings.findUnique({
        where: {
          parcel_booking_uuid: booking_uuid,
        },
        include: {
          shipment_statuses: true,
        },
      });

      return this.formatShipment(shipment);
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
