import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as _ from 'lodash';
import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  UpsertDropOffLocationDTO,
  DeleteDropOffLocationDTO,
  FetchDropOffLocationDTO,
} from './dto/drop-off-locations.dto';
import { AddressService } from '../misc/address/address.service';
import StringHelper from 'src/helpers/string-helpers';

@Injectable()
export class DropOffLocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
  ) {}

  async listDropOffLocation(currentCompany: string) {
    try {
      const dropOffLocations = await this.prisma.drop_off_locations.findMany({
        select: {
          drop_off_location_uuid: true,
          warehouse_types: true,
          additional_instructions: true,
          appointment_type: true,
          drop_off_location_modals: {
            select: {
              modals: {
                select: {
                  modal_uuid: true,
                },
              },
            },
          },
          drop_off_location_carrier_companies: {
            select: {
              companies: {
                select: {
                  legal_name: true,
                  logo: true,
                },
              },
            },
          },
          name: true,
          // locations: {
          //   select: {
          //     street_number: true,
          //     postal_codes: {
          //       select: {
          //         value: true,
          //       },
          //     },
          //     location_administrative_divisions: {
          //       select: {
          //         administrative_divisions: {
          //           select: {
          //             administrative_division_types: {
          //               select: {
          //                 name: true,
          //               },
          //             },
          //             value: true,
          //           },
          //         },
          //       },
          //     },
          //   },
          // },
          locations: {
            select: {
              raw_address: true,
            },
          },
          phone: true,
          email: true,
          drop_off_location_opening_hours: {
            select: {
              day_name: true,
              opening_time: true,
              closing_time: true,
              closed: true,
            },
          },
        },
        where: {
          company_uuid: currentCompany,
        },
      });

      return dropOffLocations.map((row) => {
        return {
          drop_off_location_uuid: row.drop_off_location_uuid,
          warehouse_type: row.warehouse_types.name,
          carrier: row.drop_off_location_carrier_companies.map(
            (row) => row.companies,
          ),
          warehouse: row.name,
          address: _.get(row, 'locations.raw_address.label', ''),
          phone: row.phone,
          email: row.email,
          drop_off_location_modals: row.drop_off_location_modals.map(
            (row) => row.modals.modal_uuid,
          ),
          additional_instructions: row.additional_instructions,
          appointment_type: StringHelper.toTitleCase(row.appointment_type),
          opening_days: row.drop_off_location_opening_hours.map((row) => ({
            ...row,
            opening_time: moment.utc(row.opening_time).format('hh:mm A'),
            closing_time: moment.utc(row.closing_time).format('hh:mm A'),
          })),
        };
      });
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error while listing a drop off location!',
      );
    }
  }

  async fetchDropOffLocation(
    currentCompany: string,
    { drop_off_location_uuid }: FetchDropOffLocationDTO,
  ) {
    try {
      const dropOffLocations = await this.prisma.drop_off_locations.findFirst({
        select: {
          drop_off_location_uuid: true,
          warehouse_type_uuid: true,
          drop_off_location_modals: {
            select: {
              modals: {
                select: {
                  name: true,
                  modal_uuid: true,
                },
              },
            },
          },
          drop_off_location_carrier_companies: {
            select: {
              companies: {
                select: {
                  legal_name: true,
                  company_uuid: true,
                  logo: true,
                },
              },
            },
          },
          name: true,
          drop_off_location_opening_hours: {
            select: {
              day_name: true,
              opening_time: true,
              closing_time: true,
              closed: true,
            },
          },
          appointment_type: true,
          phone: true,
          email: true,
          additional_instructions: true,
          locations: {
            select: {
              raw_address: true,
            },
          },
        },
        where: {
          drop_off_location_uuid: drop_off_location_uuid,
          company_uuid: currentCompany,
        },
      });

      if (!dropOffLocations) {
        throw new NotFoundException('Drop off location not found');
      }

      return {
        ...dropOffLocations,
        drop_off_location_carrier_companies:
          dropOffLocations.drop_off_location_carrier_companies.map((row) => ({
            avatar: row.companies.logo,
            label: row.companies.legal_name,
            value: row.companies.company_uuid,
          })),
        drop_off_location_modals: dropOffLocations.drop_off_location_modals.map(
          (row) => ({
            label: row.modals.name,
            value: row.modals.modal_uuid,
          }),
        ),
        drop_off_location_opening_hours:
          dropOffLocations.drop_off_location_opening_hours.map((row) => ({
            ...row,
            opening_time: moment.utc(row.opening_time).format('hh:mm'),
            opening_am_pm: moment.utc(row.opening_time).format('A'),
            closing_time: moment.utc(row.closing_time).format('hh:mm'),
            closing_am_pm: moment.utc(row.closing_time).format('A'),
          })),
        location_address: dropOffLocations.locations.raw_address,
      };
    } catch (error) {
      if (error.status == 404) {
        throw new NotFoundException(
          error?.message || 'Error while fetching a drop off location!',
        );
      } else {
        throw new BadRequestException(
          error?.message || 'Error while fetching a drop off location!',
        );
      }
      console.log(error);
    }
  }

  async listCarrierVendors(currentCompanyUUID: string) {
    try {
      // Customer condition applies
      const connectedData = await this.prisma.company_relationships.findMany({
        select: {
          companies_companiesTocompany_relationships_vendor_company_uuid: {
            select: {
              company_uuid: true,
              legal_name: true,
              logo: true,
            },
          },
        },
        where: {
          customer_company_uuid: currentCompanyUUID,
          requester_company_uuid: currentCompanyUUID,
          connected: 'CONNECTED',
        },
      });

      // Get Customer Vendor vice versa
      const customerVendorData =
        await this.prisma.company_relationships.findMany({
          select: {
            companies_companiesTocompany_relationships_requester_company_uuid: {
              select: {
                company_uuid: true,
                legal_name: true,
                logo: true,
              },
            },
          },
          where: {
            customer_company_uuid: currentCompanyUUID,
            requester_company_uuid: {
              not: currentCompanyUUID,
            },
            connected: 'CONNECTED',
          },
        });

      return [
        ...connectedData.map((row) => ({
          company_uuid:
            row[
              'companies_companiesTocompany_relationships_vendor_company_uuid'
            ].company_uuid,
          legal_name:
            row[
              'companies_companiesTocompany_relationships_vendor_company_uuid'
            ].legal_name,
          logo: row[
            'companies_companiesTocompany_relationships_vendor_company_uuid'
          ].logo,
        })),
        ...customerVendorData.map((row) => ({
          company_uuid:
            row[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ].company_uuid,
          legal_name:
            row[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ].legal_name,
          logo: row[
            'companies_companiesTocompany_relationships_requester_company_uuid'
          ].logo,
        })),
      ];
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error while listing carrier vendors!',
      );
    }
  }

  async upsertDropOffLocation(
    currentCompany: string,
    payload: UpsertDropOffLocationDTO,
  ) {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const drop_off_location_uuid =
            payload.drop_off_location_uuid || uuidv4();
          const fullDate = format(new Date(), 'yyyy-MM-dd');

          const dropOffLocationCheck =
            await this.prisma.drop_off_locations.findFirst({
              select: {
                location_address_uuid: true,
              },
              where: {
                drop_off_location_uuid: drop_off_location_uuid,
                company_uuid: currentCompany,
              },
            });

          // If drop off location is in edit mode and drop off location does not found
          if (!dropOffLocationCheck && payload.drop_off_location_uuid) {
            throw new BadRequestException('Drop off location not found');
          }

          // Delete the child table data
          if (dropOffLocationCheck) {
            const { location_address_uuid } = dropOffLocationCheck;

            await prisma.drop_off_location_modals.deleteMany({
              where: {
                drop_off_location_uuid: drop_off_location_uuid,
              },
            });

            await prisma.drop_off_location_carrier_companies.deleteMany({
              where: {
                drop_off_location_uuid: drop_off_location_uuid,
              },
            });

            await prisma.drop_off_location_opening_hours.deleteMany({
              where: {
                drop_off_location_uuid: drop_off_location_uuid,
              },
            });

            const administrativeDivisionsData =
              await prisma.location_administrative_divisions.findMany({
                select: {
                  administrative_division_uuid: true,
                },
                where: {
                  location_uuid: location_address_uuid,
                },
              });

            const administrative_divisions_uuids =
              administrativeDivisionsData.map(
                (row) => row.administrative_division_uuid,
              );

            await prisma.location_administrative_divisions.deleteMany({
              where: {
                location_uuid: location_address_uuid,
              },
            });

            await prisma.location_administrative_divisions.deleteMany({
              where: {
                administrative_division_uuid: {
                  in: administrative_divisions_uuids,
                },
              },
            });

            await prisma.locations.deleteMany({
              where: {
                location_uuid: location_address_uuid,
              },
            });
          }

          const location = await this.addressService.createLocation({
            ...payload.location_address,
            address_type: 'COMMERCIAL',
          });

          const location_address_uuid = location.location_uuid;

          // Parent table insertion
          const dropOffLocationPayload = {
            drop_off_location_uuid,
            name: payload.name,
            companies: {
              connect: {
                company_uuid: currentCompany,
              },
            },
            warehouse_types: {
              connect: {
                warehouse_type_uuid: payload.warehouse_type_uuid,
              },
            },
            locations: {
              connect: {
                location_uuid: location_address_uuid,
              },
            },
            appointment_type: payload.appointment_type,
            email: payload.email,
            phone: { ...payload.phone },
            additional_instructions: payload.additional_instructions || null,
          };

          const dropOffLocationData = await prisma.drop_off_locations.upsert({
            where: {
              drop_off_location_uuid: drop_off_location_uuid,
            },
            create: { ...dropOffLocationPayload },
            update: { ...dropOffLocationPayload },
          });

          // Insert Models
          await prisma.drop_off_location_modals.createMany({
            data: payload.modal_uuids.map((modal_uuid) => ({
              drop_off_location_modal_uuid: uuidv4(),
              modal_uuid: modal_uuid,
              drop_off_location_uuid: drop_off_location_uuid,
            })),
          });

          // Insert carriers
          await prisma.drop_off_location_carrier_companies.createMany({
            data: payload.carrier_company_uuids.map((company_uuid) => ({
              drop_off_location_carrier_company_uuid: uuidv4(),
              company_uuid: company_uuid,
              drop_off_location_uuid: drop_off_location_uuid,
            })),
          });

          // Insert operation days
          await prisma.drop_off_location_opening_hours.createMany({
            data: payload.operational_hours.map((row) => {
              const openingTime = new Date(
                `${fullDate}T${
                  row.closed === true ? '00:00' : row.opening_time
                }:00Z`,
              );

              const closingTime = new Date(
                `${fullDate}T${
                  row.closed === true ? '00:00' : row.closing_time
                }:00Z`,
              );

              return {
                drop_off_location_opening_hour_uuid: uuidv4(),
                drop_off_location_uuid: drop_off_location_uuid,
                day_name: row.day_name,
                opening_time: openingTime,
                closing_time: closingTime,
                closed: row.closed,
              };
            }),
          });

          return dropOffLocationData;
        },
        { maxWait: 50000, timeout: 50000 },
      );
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error while creating a drop off location!',
      );
    }
  }

  async deleteDropOffLocation(
    currentCompany: string,
    payload: DeleteDropOffLocationDTO,
  ) {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const drop_off_location_uuid = payload.drop_off_location_uuid;

          const dropOffLocationData = await prisma.drop_off_locations.findFirst(
            {
              select: {
                location_address_uuid: true,
              },
              where: {
                drop_off_location_uuid: drop_off_location_uuid,
                company_uuid: currentCompany,
              },
            },
          );

          if (dropOffLocationData) {
            const administrativeDivisionsData =
              await prisma.location_administrative_divisions.findMany({
                select: {
                  administrative_division_uuid: true,
                },
                where: {
                  location_uuid: dropOffLocationData.location_address_uuid,
                },
              });

            const administrative_divisions_uuids =
              administrativeDivisionsData.map(
                (row) => row.administrative_division_uuid,
              );

            await prisma.location_administrative_divisions.deleteMany({
              where: {
                location_uuid: dropOffLocationData.location_address_uuid,
              },
            });

            await prisma.location_administrative_divisions.deleteMany({
              where: {
                administrative_division_uuid: {
                  in: administrative_divisions_uuids,
                },
              },
            });

            await prisma.locations.deleteMany({
              where: {
                location_uuid: dropOffLocationData.location_address_uuid,
              },
            });
          }

          // Delete cascading with below tables
          // drop_off_locations, drop_off_location_modals, drop_off_location_carrier_companies, drop_off_location_opening_hours
          await prisma.drop_off_locations.delete({
            where: {
              drop_off_location_uuid: drop_off_location_uuid,
            },
          });

          return {
            deleted: true,
          };
        },
        { maxWait: 50000, timeout: 50000 },
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        error?.message || 'Error while creating a drop off location!',
      );
    }
  }
}
