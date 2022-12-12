import { Injectable, BadRequestException } from '@nestjs/common';
import { users } from '@generated/client';
import { format } from 'date-fns';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateParcelBookingStatusPayloadDTO } from './dto/accounts.dto';
import { AccountServiceType } from './interface/account.interface';
import { CARRIER_DETAILS } from '../../common/constants/global.constants';

@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService) {}

  async findAllPayableAndReceivable(
    serviceType: AccountServiceType,
    currentUser: users,
  ) {
    let result = [];

    let defaultSelect: any = {
      parcel_booking_uuid: true,
      created_at: true,
      p_parcel_id: true,
      total_amount: true,
      metadata: true,
      payment_method_charges: true,
      parcel_rate_sources: {
        select: {
          name: true,
        },
      },
      payment_methods: {
        select: {
          last_4_digits: true,
        },
      },
    };

    if (serviceType == 'payable') {
      defaultSelect = {
        ...defaultSelect,
        payable_status: true,
      };
    } else {
      defaultSelect = {
        ...defaultSelect,
        receivable_status: true,
        profit_amount: true,
        tracking_code_id: true,
        users: {
          select: {
            photo: true,
            first_name: true,
            last_name: true,
          },
        },
      };
    }

    try {
      // Find result
      const tmpResult = await this.prisma.parcel_bookings.findMany({
        select: { ...defaultSelect },
        where: {
          confirmed: true,
          user_uuid: currentUser.user_uuid,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Add required fields and remove unwanted fields from result JSON
      result = tmpResult.map((row: any) => {
        let tmpRow = {
          ...row,
          shipment_logo: row?.metadata?.company?.logo_url || '',
          currency: row?.metadata?.price?.currency || 'N/A',
          category: row?.metadata?.category || '',
          parcel_rate_sources: row?.parcel_rate_sources?.name || '',
          payment_methods: row?.payment_methods?.last_4_digits || '',
          status:
            serviceType == 'payable'
              ? row.payable_status
              : row.receivable_status,
          raw_created_at: row.created_at,
          created_at: format(row?.created_at as any, 'PP'),
        };

        if (serviceType == 'receivable') {
          tmpRow = {
            ...tmpRow,
            customer_photo: row?.users?.photo || '',
            customer_first_name: row?.users?.first_name || '',
            customer_last_name: row?.users?.last_name || '',
          };
        }

        if (serviceType == 'payable') {
          const payableLogo =
            (
              CARRIER_DETAILS.find(
                (cd) => cd.key == row?.parcel_rate_sources?.name,
              ) || {}
            ).LOGO_SM || '';

          tmpRow = { ...tmpRow, payable_logo: payableLogo };
        }

        // Remove unwanted rows and send the response
        return {
          ...tmpRow,
          payable_status: undefined,
          receivable_status: undefined,
          metadata: undefined,
          users: undefined,
        };
      });
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching account data!',
      );
    }

    return result;
  }

  async updateParcelBookingStatus(
    updateStatus: UpdateParcelBookingStatusPayloadDTO,
    statusType: string,
  ) {
    try {
      // Check if booking is available
      const bookingResult = await this.prisma.parcel_bookings.findFirst({
        where: {
          parcel_booking_uuid: updateStatus.uuid,
        },
      });

      if (!bookingResult) {
        throw new BadRequestException('Parcel booking not found');
      }

      const updateField =
        statusType == 'payable' ? 'payable_status' : 'receivable_status';

      // Update the record
      await this.prisma.parcel_bookings.update({
        where: {
          parcel_booking_uuid: updateStatus.uuid,
        },
        data: {
          [updateField]: updateStatus.status,
        },
      });

      return {
        message: 'Status updated',
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in updating status!',
      );
    }
  }

  async extractBookingData() {
    const bookingData = await this.prisma.parcel_bookings.findMany({
      orderBy: {
        created_at: 'desc',
      },
    });

    try {
      // Update the total amount
      bookingData.forEach(async (row: any) => {
        const totalAmount = (
          (row?.metadata?.services || []).map((services) => {
            return (
              (services.items || []).map((item) => item?.price?.value || 0) ||
              []
            ).reduce((acc, item) => acc + item, 0);
          }) || []
        ).reduce((acc, item) => acc + item, 0);

        if (row.parcel_booking_uuid) {
          await this.prisma.parcel_bookings.update({
            data: {
              total_amount: totalAmount,
            },
            where: {
              parcel_booking_uuid: row.parcel_booking_uuid,
            },
          });
        }
      });

      return {
        message: 'Extraction completed successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in extracting data from meta!',
      );
    }
  }
}
