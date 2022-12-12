import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { differenceInDays } from 'date-fns';

import { PrismaService } from '../../../../prisma/prisma.service';

import { CreateRateTypeDto } from './dto/create-rate-type.dto';

import { v4 as uuidv4 } from 'uuid';
import { FindAllRateTypesDto } from './dto/find-all-rate-types.dto';
import { CreateRulesDto } from './dto/create-rules.dto';
import { CreateAutoWeightBreakDto } from './dto/create-auto-weight-break.dto';
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { CreateParcelRouteLocationReferenceDto } from './dto/create-parcel-route-location-reference.dto';
import {
  CreateParcelRatesDto,
  FindDropOffLocationDTO,
} from './dto/create-parcel-rates.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { FindAllCustomFieldsDto } from './dto/find-all-custom-fields.dto';
import { CreateAirportLocationDto } from './dto/create-airport-location.dto';
import { CreatePortLocationDto } from './dto/create-port-location.dto';
import { UpsertParcelRouteDto } from './dto/upsert-parcel-route.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { formatAddress } from 'src/helpers/global-helpers';
import { ParcelRouteModalDto } from './dto/parcel-route-modals.dto';
import { users } from '@generated/client';
import { PARCEL_ROUTE_ACTION_TYPES } from 'src/common/constants/global.constants';

@Injectable()
export class ParcelRatesService {
  constructor(private prisma: PrismaService) {}

  async createLocationReference({
    locations,
    parcel_route_uuid,
    location_reference_type_uuid,
  }: CreateParcelRouteLocationReferenceDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const uuids = locations.map(() => uuidv4());

        // Delete old records and keep only primary record set
        await prisma.parcel_route_location_references.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.airport_location.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.port_location.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.parcel_route_location_references.createMany({
          data: locations.map((e, idx) => ({
            parcel_route_location_reference_uuid: uuids[idx],
            country: e.country,
            state: e.state,
            city: e.state,
            postal_code: e.postal_code,
            address: e.address,
            location_reference_type_uuid: e.location_reference_type_uuid,
            parcel_route_uuid: e.parcel_route_uuid,
          })),
        });

        return await prisma.parcel_route_location_references.findMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createAirportLocation({
    locations,
    parcel_route_uuid,
    location_reference_type_uuid,
  }: CreateAirportLocationDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Delete old records

        await prisma.parcel_route_location_references.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.airport_location.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.port_location.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.airport_location.createMany({
          data: locations.map((row) => ({
            airport_uuid: row.airport_uuid,
            location_reference_type_uuid: row.location_reference_type_uuid,
            parcel_route_uuid: row.parcel_route_uuid,
          })),
        });

        return await prisma.airport_location.findMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createPortLocation({
    locations,
    parcel_route_uuid,
    location_reference_type_uuid,
  }: CreatePortLocationDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        // Delete old records
        await prisma.parcel_route_location_references.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.airport_location.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.port_location.deleteMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });

        await prisma.port_location.createMany({
          data: locations.map((row) => ({
            port_uuid: row.port_uuid,
            location_reference_type_uuid: row.location_reference_type_uuid,
            parcel_route_uuid: row.parcel_route_uuid,
          })),
        });

        return await prisma.port_location.findMany({
          where: { parcel_route_uuid, location_reference_type_uuid },
        });
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async deleteParcelRoute(id: string, currentCompany: string) {
    const parcelData = await this.prisma.parcel_routes.findFirst({
      select: {
        parcel_route_uuid: true,
        parcel_rates: {
          select: {
            parcel_rate_uuid: true,
          },
        },
      },
      where: {
        parcel_route_uuid: id,
        company_uuid: currentCompany,
      },
    });

    if (parcelData) {
      const parcelRouteUUID = parcelData.parcel_route_uuid;
      const parcelRateDelUUID = parcelData.parcel_rates
        .map((row) => row.parcel_rate_uuid)
        .filter((row) => row);

      try {
        // Delete all the relations data
        await this.prisma.airport_location.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_first_miles.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_last_miles.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_drop_off_locations.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_histories.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.port_location.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_week_days.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_location_references.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_rate_parcel_rate_custom_fields.deleteMany({
          where: { parcel_rate_uuid: { in: parcelRateDelUUID } },
        });

        await this.prisma.parcel_route_customers.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_rate_custom_fields.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_customer_types.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_route_rules.deleteMany({
          where: {
            parcel_routes_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_rates.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        await this.prisma.parcel_routes.deleteMany({
          where: {
            parcel_route_uuid: parcelRouteUUID,
          },
        });

        return {
          status: 'ok',
        };
      } catch (error) {
        throw new BadRequestException(error);
      }
    } else {
      throw new NotFoundException('Parcel rates not found');
    }
  }

  async publish(isPublished: boolean, parcel_route_uuid: string) {
    return await this.prisma.parcel_routes.update({
      data: {
        published: isPublished,
      },
      where: {
        parcel_route_uuid,
      },
    });
  }

  async fetchParcelRoute(parcel_route_uuid: string) {
    try {
      const parcelRouteData = await this.prisma.parcel_routes.findUnique({
        where: {
          parcel_route_uuid: parcel_route_uuid,
        },
        select: {
          parcel_route_uuid: true,
          effective_on: true,
          expires_on: true,
          transit_time_from: true,
          transit_time_to: true,
          notes: true,
          restrictions: true,
          published: true,
          public: true,
          company_uuid: true,
          vendor_company_uuid: true,
          parcel_mass_measure_uuid: true,
          currency_uuid: true,
          origin_coverage_uuid: true,
          destination_coverage_uuid: true,
          carrier_company_uuid: true,
          carrier_unregistered_company_uuid: true,
          company_integration_uuid: true,
          dimensional_factor_uuid: true,
          length_measure_uuid: true,
          length_measures: true,
          parcel_mass_measures: true,
          parcel_route_location_references: true,
          coverages_coveragesToparcel_routes_origin_coverage_uuid: true,
          coverages_coveragesToparcel_routes_destination_coverage_uuid: true,
          parcel_route_customers: true,
          parcel_route_customer_types: true,
          parcel_rate_custom_fields: true,
          currency_rate: true,
          currency_rate_meta: true,
          issued_label_source_uuid: true,
          insurance_fee_type: true,
          insurance_fee_percentage: true,
          insurance_fee_minimum: true,
          duties_taxes_type: true,
          duties_taxes_percentage: true,
          duties_taxes_exemption: true,
          duties_taxes_ddp: true,
          signature_description: true,
          signature_service_fee: true,
          parcel_route_first_miles: {
            select: {
              parcel_rate_source_uuid: true,
            },
          },
          parcel_route_last_miles: {
            select: {
              parcel_rate_source_uuid: true,
            },
          },
          parcel_route_drop_off_locations: {
            select: {
              drop_off_location_uuid: true,
            },
          },
          companies_companiesToparcel_routes_company_uuid: {
            select: {
              rate_types: true,
            },
          },
          airport_location: {
            select: {
              location_reference_type_uuid: true,
              airport: true,
            },
          },
          port_location: {
            select: {
              location_reference_type_uuid: true,
              port: true,
            },
          },
          parcel_rates: {
            select: {
              parcel_rate_uuid: true,
              minimum: true,
              fee: true,
              profit: true,
              minimum_profit: true,
              minimum_weight: true,
              maximum_weight: true,
              profit_type: true,
              transit_time_from: true,
              transit_time_to: true,
              parcel_rates_auto_weight_break: true,
              parcel_rate_parcel_rate_custom_fields: true,
              parcel_route_rules: true,
              rate_type_uuid: true,
              rate_types: true,
            },
          },
          parcel_route_histories: {
            select: {
              comment: true,
              created_at: true,
              users: {
                select: {
                  first_name: true,
                },
              },
            },
          },
        },
      });

      if (parcelRouteData) {
        return parcelRouteData;
      } else {
        return {};
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async fetchAllParcelRoute(currentCompany: string) {
    try {
      const parcelRouteData = await this.prisma.parcel_routes.findMany({
        where: {
          company_uuid: currentCompany,
          expires_on: {
            not: null,
          },
        },
        select: {
          parcel_route_uuid: true,
          vendor_company_uuid: true,
          expires_on: true,
          carrier_company_uuid: true,
          carrier_unregistered_company_uuid: true,
          origin_coverage_uuid: true,
          destination_coverage_uuid: true,
          published: true,
          public: true,
          coverages_coveragesToparcel_routes_origin_coverage_uuid: true,
          coverages_coveragesToparcel_routes_destination_coverage_uuid: true,
          parcel_route_location_references: {
            select: {
              parcel_route_location_reference_uuid: true,
              country: true,
              state: true,
              city: true,
              postal_code: true,
              address: true,
              parcel_route_uuid: true,
              location_reference_type_uuid: true,
              location_reference_types: true,
            },
          },
          airport_location: {
            select: {
              location_reference_type_uuid: true,
              airport: true,
              location_reference_type: true,
            },
          },
          port_location: {
            select: {
              location_reference_type_uuid: true,
              port: true,
              location_reference_type: true,
            },
          },
          parcel_route_customers: {
            select: {
              companies: {
                select: {
                  user_uuid: true,
                  legal_name: true,
                  fantasy_name: true,
                  logo: true,
                  icon: true,
                },
              },
            },
          },
          parcel_route_customer_types: {
            select: {
              company_types: true,
            },
          },
          companies_companiesToparcel_routes_vendor_company_uuid: {
            select: {
              company_type_uuid: true,
              company_uuid: true,
              email: true,
              fantasy_name: true,
              icon: true,
              legal_name: true,
              logo: true,
              user_uuid: true,
            },
          },
          companies_companiesToparcel_routes_carrier_company_uuid: {
            select: {
              legal_name: true,
              fantasy_name: true,
              logo: true,
              icon: true,
            },
          },
          unregistered_companies: true,
        },
        orderBy: {
          expires_on: 'asc',
        },
      });

      return parcelRouteData.map((row) => {
        let parcelRateStatus = 'N/A';

        const isExpired =
          differenceInDays(row.expires_on, new Date()) >= 0 ? false : true;

        // Check first if rate is expired or not
        if (isExpired) {
          parcelRateStatus = 'expired';
        } else if (row.published) {
          parcelRateStatus = 'published';
        } else {
          parcelRateStatus = 'draft';
        }

        return {
          ...row,
          vendor_company_name:
            row.companies_companiesToparcel_routes_vendor_company_uuid
              .legal_name,
          carrier_company:
            row.carrier_company_uuid || row.carrier_unregistered_company_uuid,
          carrier_company_data:
            row.companies_companiesToparcel_routes_carrier_company_uuid ||
            row.unregistered_companies,
          status: parcelRateStatus,
          category: 'seller_rates',
        };
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async upsertParcelRoute(
    {
      parcel_route_uuid: parcel_route_uuid_dto,
      carrier_company_uuid,
      vendor_company_uuid,
      company_uuid,
      action_type,
      ...rest
    }: UpsertParcelRouteDto,
    currentUser: users,
  ) {
    try {
      const parcel_route_uuid = parcel_route_uuid_dto || uuidv4();

      // Manage the payload as per the data coming from request body
      const parcelRoute = {
        // published: false,
        companies_companiesToparcel_routes_company_uuid: {
          connect: {
            company_uuid,
          },
        },
      };

      const parcelRouteUpdate = {};

      // Get only those fields which are available to upsert
      if (rest.effective_on) {
        parcelRoute['effective_on'] = rest.effective_on;
      }

      if (rest.expires_on) {
        parcelRoute['expires_on'] = rest.expires_on;
      }

      if (rest.public) {
        parcelRoute['public'] = rest.public;
      }

      if (rest.transit_time_to) {
        parcelRoute['transit_time_to'] = rest.transit_time_to;
      }

      if (rest.parcel_mass_measure_uuid) {
        parcelRoute['parcel_mass_measures'] = {
          connect: {
            parcel_mass_measure_uuid: rest.parcel_mass_measure_uuid,
          },
        };
      }

      if (rest.length_measure_uuid) {
        parcelRoute['length_measures'] = {
          connect: {
            length_measure_uuid: rest.length_measure_uuid,
          },
        };
      }

      if (rest.transit_time_from) {
        parcelRoute['transit_time_from'] = rest.transit_time_from;
      }

      if (rest.dimensional_factor_uuid) {
        parcelRoute['dimensional_factor_uuid'] = rest.dimensional_factor_uuid;
      }

      if (
        typeof rest.currency_rate === 'number' &&
        (rest.currency_rate || 0) >= 0
      ) {
        parcelRoute['currency_rate'] = rest.currency_rate;
      }

      if (rest.currency_rate_meta) {
        parcelRoute['currency_rate_meta'] = rest.currency_rate_meta;
      }

      if (rest.notes) {
        parcelRoute['notes'] = rest.notes;
      }

      if (rest.insurance_fee_type) {
        parcelRoute['insurance_fee_type'] = rest.insurance_fee_type;
      }

      if (
        rest.insurance_fee_percentage ||
        rest.insurance_fee_percentage === 0
      ) {
        parcelRoute['insurance_fee_percentage'] = rest.insurance_fee_percentage;
      }

      if (rest.insurance_fee_minimum || rest.insurance_fee_minimum === 0) {
        parcelRoute['insurance_fee_minimum'] = rest.insurance_fee_minimum;
      }

      if (rest.duties_taxes_type) {
        parcelRoute['duties_taxes_type'] = rest.duties_taxes_type;
      }

      if (rest.duties_taxes_percentage || rest.duties_taxes_percentage === 0) {
        parcelRoute['duties_taxes_percentage'] = rest.duties_taxes_percentage;
      }

      if (rest.duties_taxes_exemption || rest.duties_taxes_exemption === 0) {
        parcelRoute['duties_taxes_exemption'] = rest.duties_taxes_exemption;
      }

      if ([true, false].includes(rest.duties_taxes_ddp)) {
        parcelRoute['duties_taxes_ddp'] = rest.duties_taxes_ddp;
      }

      if (rest.signature_description) {
        parcelRoute['signature_description'] = rest.signature_description;
      } else {
        parcelRoute['signature_description'] = '';
      }

      if (rest.signature_service_fee || rest.signature_service_fee === 0) {
        parcelRoute['signature_service_fee'] = rest.signature_service_fee;
      }

      // Currency
      if (rest.currency_uuid) {
        parcelRoute['currencies'] = {
          connect: {
            currency_uuid: rest.currency_uuid,
          },
        };
      }

      if (vendor_company_uuid) {
        parcelRoute['companies_companiesToparcel_routes_vendor_company_uuid'] =
          {
            connect: {
              company_uuid: vendor_company_uuid,
            },
          };
      }

      // Carrier registered and unregistered
      if (carrier_company_uuid) {
        parcelRoute['companies_companiesToparcel_routes_carrier_company_uuid'] =
          {
            connect: {
              company_uuid: carrier_company_uuid,
            },
          };
        parcelRouteUpdate['unregistered_companies'] = {
          disconnect: true,
        };
      }

      if (rest.carrier_unregistered_company_uuid) {
        parcelRoute['unregistered_companies'] = {
          connect: {
            unregistered_company_uuid: rest.carrier_unregistered_company_uuid,
          },
        };

        parcelRouteUpdate[
          'companies_companiesToparcel_routes_carrier_company_uuid'
        ] = {
          disconnect: true,
        };
      }

      if (rest.origin_coverage_uuid) {
        parcelRoute['coverages_coveragesToparcel_routes_origin_coverage_uuid'] =
          {
            connect: {
              coverage_uuid: rest.origin_coverage_uuid,
            },
          };
      }

      if (rest.destination_coverage_uuid) {
        parcelRoute[
          'coverages_coveragesToparcel_routes_destination_coverage_uuid'
        ] = {
          connect: {
            coverage_uuid: rest.destination_coverage_uuid,
          },
        };
      }

      const routeData = await this.prisma.parcel_routes.upsert({
        where: {
          parcel_route_uuid,
        },
        create: {
          parcel_route_uuid,
          ...parcelRoute,
        },
        update: {
          ...parcelRoute,
          ...parcelRouteUpdate,
        },
      });

      // Update action done by the users
      if (action_type && routeData) {
        await this.updateParcelRouteHistory(
          currentUser.user_uuid,
          parcel_route_uuid,
          action_type,
        );
      }

      return routeData;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createParcelRateModals({
    parcel_route_uuid,
    issued_label_source_uuid,
    drop_off_location_uuids,
    first_mile_uuids,
    last_mile_uuids,
  }: ParcelRouteModalDto) {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          // Unlink the parcel label source
          await prisma.parcel_routes.update({
            where: {
              parcel_route_uuid,
            },
            data: {
              issued_label_source_uuid: null,
            },
          });

          // Delete drop off locations
          await prisma.parcel_route_drop_off_locations.deleteMany({
            where: {
              parcel_route_uuid,
            },
          });

          // Delete first mile data
          await prisma.parcel_route_first_miles.deleteMany({
            where: {
              parcel_route_uuid,
            },
          });

          // Delete last mile data
          await prisma.parcel_route_last_miles.deleteMany({
            where: {
              parcel_route_uuid,
            },
          });

          // Insert issued Label data
          if (issued_label_source_uuid) {
            await prisma.parcel_routes.update({
              where: {
                parcel_route_uuid,
              },
              data: {
                issued_label_source_uuid,
              },
            });
          }

          // Insert drop off location data
          if ((drop_off_location_uuids || []).length > 0) {
            await prisma.parcel_route_drop_off_locations.createMany({
              data: drop_off_location_uuids.map((uuid) => ({
                parcel_route_drop_off_location_uuid: uuidv4(),
                drop_off_location_uuid: uuid,
                parcel_route_uuid,
              })),
            });
          }

          // Insert first mile data
          if ((first_mile_uuids || []).length > 0) {
            await prisma.parcel_route_first_miles.createMany({
              data: first_mile_uuids.map((uuid) => ({
                parcel_route_first_mile_uuid: uuidv4(),
                parcel_rate_source_uuid: uuid,
                parcel_route_uuid,
              })),
            });
          }

          // Insert last mile data
          if ((last_mile_uuids || []).length > 0) {
            await prisma.parcel_route_last_miles.createMany({
              data: last_mile_uuids.map((uuid) => ({
                parcel_route_last_mile_uuid: uuidv4(),
                parcel_rate_source_uuid: uuid,
                parcel_route_uuid,
              })),
            });
          }

          return {
            status: 'ok',
          };
        },
        {
          maxWait: 120000,
          timeout: 180000,
        },
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async deleteParcelRate(parcel_rate_uuid: string) {
    return await this.prisma.parcel_rates.delete({
      where: { parcel_rate_uuid },
    });
  }

  async createParcelRate({
    parcel_rates,
    parcel_route_uuid,
    custom_field_columns,
    company_uuid,
  }: CreateParcelRatesDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const parcelRatesData = await prisma.parcel_rates.findMany({
          select: {
            parcel_rate_uuid: true,
            parcel_rates_auto_weight_break_uuid: true,
          },
          where: {
            parcel_route_uuid,
          },
        });

        const parcelRateDelUUID = parcelRatesData
          .map((row) => row.parcel_rate_uuid)
          .filter((row) => row);

        const autoWeightBreakDelUUID = parcelRatesData
          .map((row) => row.parcel_rates_auto_weight_break_uuid)
          .filter((row) => row);

        // Delete all possible dependencies first
        if (parcelRateDelUUID.length > 0) {
          await this.prisma.parcel_rate_parcel_rate_custom_fields.deleteMany({
            where: { parcel_rate_uuid: { in: parcelRateDelUUID } },
          });

          await prisma.parcel_route_rules.deleteMany({
            where: { parcel_rate_uuid: { in: parcelRateDelUUID } },
          });
        }

        if (autoWeightBreakDelUUID.length) {
          await prisma.parcel_rates_auto_weight_break.deleteMany({
            where: {
              parcel_rates_auto_weight_break_uuid: {
                in: autoWeightBreakDelUUID,
              },
            },
          });
        }

        await prisma.parcel_rate_custom_fields.deleteMany({
          where: { parcel_route_uuid },
        });

        // More info - https://github.com/prisma/prisma/discussions/2610
        // Delete main parcel rate data
        await prisma.parcel_rates.deleteMany({ where: { parcel_route_uuid } });

        // Create parcel rate custom field columns
        await prisma.parcel_rate_custom_fields.createMany({
          data: custom_field_columns.map((row) => ({
            parcel_rate_custom_field_uuid: row.parcel_rate_custom_field_uuid,
            field: String(row.weight),
            company_uuid,
            parcel_route_uuid,
          })),
        });

        for (const {
          rate_type_uuid,
          minimum,
          transit_time_from,
          transit_time_to,
          fee,
          profit,
          profit_type,
          minimum_profit,
          maximum_weight,
          parcel_rates_auto_weight_break,
          parcel_route_rules,
          parcel_rate_parcel_rate_custom_fields,
        } of parcel_rates) {
          const payload = {
            parcel_rate_uuid: uuidv4(),
            minimum,
            transit_time_from,
            transit_time_to,
            fee,
            profit,
            profit_type,
            minimum_profit,
            maximum_weight,
            parcel_rate_parcel_rate_custom_fields: {
              createMany: {
                data: parcel_rate_parcel_rate_custom_fields.map(
                  (parcel_rate_parcel_rate_custom_field) => ({
                    parcel_rate_parcel_rate_custom_field_uuid: uuidv4(),
                    value: parcel_rate_parcel_rate_custom_field.value || '',
                    parcel_rate_custom_field_uuid:
                      parcel_rate_parcel_rate_custom_field.parcel_rate_custom_field_uuid,
                  }),
                ),
              },
            },
            rate_types: {
              connect: {
                rate_type_uuid: rate_type_uuid,
              },
            },
            parcel_routes: {
              connect: {
                parcel_route_uuid,
              },
            },
          };

          if (parcel_rates_auto_weight_break) {
            payload['parcel_rates_auto_weight_break'] = {
              create: {
                parcel_rates_auto_weight_break_uuid: uuidv4(),
                coin: parcel_rates_auto_weight_break.coin,
                max_weight: parcel_rates_auto_weight_break.max_weight,
                max_weight_measure:
                  parcel_rates_auto_weight_break.max_weight_measure,
                value: parcel_rates_auto_weight_break.value,
                weight: parcel_rates_auto_weight_break.weight,
                weight_measure: parcel_rates_auto_weight_break.weight_measure,
              },
            };
          }

          if (parcel_route_rules) {
            payload['parcel_route_rules'] = {
              create: {
                parcel_route_rule_uuid: uuidv4(),
                coin: parcel_route_rules.coin,
                height: parcel_route_rules.height,
                length: parcel_route_rules.length,
                length_measure: parcel_route_rules.length_measure,
                pieces: parcel_route_rules.pieces,
                type: parcel_route_rules.type,
                value: parcel_route_rules.value,
                weight: parcel_route_rules.weight,
                weight_measure: parcel_route_rules.weight_measure,
                width: parcel_route_rules.width,
                parcel_routes: {
                  connect: {
                    parcel_route_uuid,
                  },
                },
              },
            };
          }

          await prisma.parcel_rates.create({
            data: payload,
          });
        }

        // Unpublished the parcel route
        return await prisma.parcel_routes.update({
          data: {
            published: false,
          },
          where: {
            parcel_route_uuid,
          },
        });
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createCustomerTypes({ customerData }: CreateCustomerTypeDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const parcel_route_uuid = customerData[0].parcel_route_uuid;

        // Delete all created customer type
        await prisma.parcel_route_customer_types.deleteMany({
          where: {
            parcel_route_uuid,
          },
        });

        // Add customer types for parcel rates
        return await prisma.parcel_route_customer_types.createMany({
          data: customerData.map((row) => ({
            parcel_route_customer_type_uuid: uuidv4(),
            company_type_uuid: row.company_type_uuid,
            parcel_route_uuid: row.parcel_route_uuid,
          })),
        });
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async deleteCustomerTypes(parcel_route_uuid: string) {
    try {
      if (!parcel_route_uuid) {
        throw new BadRequestException('Parcel route UUID is required');
      }

      // Delete all created customers
      return await this.prisma.parcel_route_customer_types.deleteMany({
        where: {
          parcel_route_uuid,
        },
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createCustomers({ customerData }: CreateCustomerDto) {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const parcel_route_uuid = customerData[0].parcel_route_uuid;

        // Delete all created customers
        await prisma.parcel_route_customers.deleteMany({
          where: {
            parcel_route_uuid,
          },
        });

        // Add customers for parcel rates
        return await prisma.parcel_route_customers.createMany({
          data: customerData.map((row) => ({
            parcel_route_customer_uuid: uuidv4(),
            company_uuid: row.company_uuid,
            parcel_route_uuid: row.parcel_route_uuid,
          })),
        });
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async deleteCustomers(parcel_route_uuid: string) {
    try {
      if (!parcel_route_uuid) {
        throw new BadRequestException('Parcel route UUID is required');
      }

      // Delete all created customers
      return await this.prisma.parcel_route_customers.deleteMany({
        where: {
          parcel_route_uuid,
        },
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async createRules({
    parcel_route_uuid,
    parcel_rate_uuid,
    ...rest
  }: CreateRulesDto) {
    return this.prisma.parcel_route_rules.create({
      data: {
        ...rest,
        parcel_route_rule_uuid: uuidv4(),
        parcel_routes: {
          connect: {
            parcel_route_uuid,
          },
        },
        parcel_rates: {
          connect: {
            parcel_rate_uuid,
          },
        },
      },
    });
  }

  async getRules(id: string) {
    return this.prisma.parcel_route_rules.findMany({
      where: {
        parcel_routes_uuid: id,
      },
    });
  }

  async createAutoWeightBreak({
    parcel_rate_uuid,
    ...rest
  }: CreateAutoWeightBreakDto) {
    return this.prisma.parcel_rates_auto_weight_break.create({
      data: {
        ...rest,
        parcel_rates_auto_weight_break_uuid: uuidv4(),
        parcel_rates: {
          connect: {
            parcel_rate_uuid,
          },
        },
      },
    });
  }

  async getAutoWeightBreak(id: string) {
    return this.prisma.parcel_rates_auto_weight_break.findMany({
      where: {
        parcel_rates: {
          parcel_rate_uuid: id,
        },
      },
    });
  }

  async createRateType({ company_uuid, name }: CreateRateTypeDto) {
    const companyIsExist = await this.prisma.companies.findUnique({
      where: { company_uuid },
    });

    if (!companyIsExist) {
      throw new NotFoundException('Company not exists');
    }

    try {
      return await this.prisma.rate_types.create({
        data: {
          rate_type_uuid: uuidv4(),
          name,
          companies: {
            connect: {
              company_uuid,
            },
          },
        },
      });
    } catch {
      throw new BadRequestException();
    }
  }

  async deleteRateType(rate_type_uuid: string) {
    if (!rate_type_uuid) {
      throw new BadRequestException('Rate Type ID is required');
    }

    const parcelRates = await this.prisma.parcel_rates.findFirst({
      where: { rate_type_uuid },
    });

    if (parcelRates) {
      throw new BadRequestException('Rate Type linked to a Parcel Rate');
    }

    try {
      return await this.prisma.rate_types.delete({
        where: {
          rate_type_uuid,
        },
      });
    } catch (err) {
      throw new BadRequestException();
    }
  }

  async findAllRateTypes({ companyId, skip, take }: FindAllRateTypesDto) {
    return this.prisma.rate_types.findMany({
      skip: skip && +skip,
      take: take && +take,
      where: {
        company_uuid: companyId,
      },
    });
  }

  async createCustomField({
    company_uuid,
    parcel_route_uuid,
    field,
  }: CreateCustomFieldDto) {
    const companyIsExist = await this.prisma.companies.findUnique({
      where: { company_uuid },
    });

    if (!companyIsExist) {
      throw new NotFoundException('Company not exists');
    }

    const parcelRouteExist = await this.prisma.parcel_routes.findUnique({
      where: { parcel_route_uuid },
    });

    if (!parcelRouteExist) {
      throw new NotFoundException('Parcel route not exists');
    }

    try {
      return await this.prisma.parcel_rate_custom_fields.create({
        data: {
          parcel_rate_custom_field_uuid: uuidv4(),
          field,
          companies: {
            connect: {
              company_uuid,
            },
          },
          parcel_routes: {
            connect: {
              parcel_route_uuid,
            },
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAllCustomFields({
    parcelRouteUuid,
    skip,
    take,
  }: FindAllCustomFieldsDto) {
    return this.prisma.parcel_rate_custom_fields.findMany({
      skip: skip && +skip,
      take: take && +take,
      where: {
        parcel_route_uuid: parcelRouteUuid,
      },
    });
  }

  async fetchParcelRateSources() {
    return this.prisma.parcel_rate_sources.findMany({});
  }

  async fetchDropOffLocations(
    currentCompany: string,
    query: FindDropOffLocationDTO,
  ) {
    const companyUUID = query.company_uuid || currentCompany;

    try {
      const locations = await this.prisma.drop_off_locations.findMany({
        select: {
          drop_off_location_uuid: true,
          name: true,
          locations: {
            select: {
              street_number: true,
              postal_codes: {
                select: {
                  value: true,
                },
              },
              location_administrative_divisions: {
                select: {
                  administrative_divisions: {
                    select: {
                      administrative_division_types: {
                        select: {
                          name: true,
                        },
                      },
                      value: true,
                    },
                  },
                },
              },
            },
          },
        },
        where: {
          company_uuid: companyUUID,
        },
      });

      return locations.map((row) => ({
        drop_off_location_uuid: row.drop_off_location_uuid,
        name: row.name,
        location: formatAddress(row.locations),
      }));
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateParcelRouteHistory(
    user_uuid: string,
    parcel_route_uuid: string,
    comment: string,
  ) {
    if (PARCEL_ROUTE_ACTION_TYPES.includes(comment)) {
      try {
        const lastStatusData =
          await this.prisma.parcel_route_histories.findFirst({
            select: {
              comment: true,
            },
            where: {
              parcel_route_uuid,
            },
            orderBy: {
              created_at: 'desc',
            },
          });

        let newStatus = 'created';
        const lastStatus = (lastStatusData || {}).comment || '';
        if (comment === 'published' && lastStatus !== 'draft') {
          newStatus = 'changed';
        } else if (comment === 'published' && lastStatus === 'draft') {
          newStatus = 'published';
        } else if (comment === 'draft') {
          newStatus = 'draft';
        }

        await this.prisma.parcel_route_histories.create({
          data: {
            parcel_route_history_uuid: uuidv4(),
            user_uuid,
            parcel_route_uuid,
            comment: newStatus,
          },
        });

        return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  async fetchNextPreviousParcelRate(
    currentCompany: string,
    parcelRouteUUID?: string,
    action?: string,
  ) {
    try {
      const parcelRoute = await this.prisma.parcel_routes.findMany({
        select: {
          parcel_route_uuid: true,
        },
        where: {
          company_uuid: currentCompany,
          expires_on: {
            not: null,
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      let newParcelRouteUUID = null;
      const parcelRouteUUIDs = parcelRoute.map((row) => row.parcel_route_uuid);
      const currentIndex = parcelRouteUUIDs.indexOf(parcelRouteUUID);

      if (currentIndex >= 0 && action === 'next') {
        newParcelRouteUUID = parcelRouteUUIDs[currentIndex + 1] || null;
      } else if (currentIndex >= 0 && action === 'previous') {
        newParcelRouteUUID = parcelRouteUUIDs[currentIndex - 1] || null;
      }

      return { stack: newParcelRouteUUID };
    } catch (error) {
      return {
        stack: null,
      };
    }
  }
}
