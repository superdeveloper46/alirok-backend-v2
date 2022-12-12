import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { sleepThread } from 'src/helpers/global-helpers';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CronJobsService {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCron() {
    // Find the all unused parcel rates since more than 1 day
    const pastTwoDays = new Date();
    pastTwoDays.setDate(pastTwoDays.getDate() - 2);

    const parcelData = await this.prisma.parcel_routes.findMany({
      select: {
        parcel_route_uuid: true,
      },
      where: {
        effective_on: null,
        created_at: {
          lt: pastTwoDays,
        },
      },
    });

    for (const row of parcelData) {
      const parcel_route_uuid = row.parcel_route_uuid;

      try {
        // Delete all the relations data
        await this.prisma.airport_location.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_first_miles.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_last_miles.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_drop_off_locations.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_histories.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.port_location.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_week_days.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_location_references.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_customers.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_rate_custom_fields.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_route_customer_types.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        await this.prisma.parcel_routes.deleteMany({
          where: {
            parcel_route_uuid: row.parcel_route_uuid,
          },
        });

        // console.log('Deleted data for ----->', parcel_route_uuid);

        // Let's get some rest please
        await sleepThread(2000);
      } catch (error) {
        console.log(
          'Error while deleting data for parcel route relations ----->',
          parcel_route_uuid,
        );
        console.log({ error });
      }
    }

    console.log('Cron Executed...');
  }
}
