import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../../prisma/prisma.service';

import {
  CreateLocation,
  InputJsonValue,
} from './interfaces/createLocation.interface';

import { v4 as uuidv4 } from 'uuid';
import { administrative_divisions } from '@generated/client';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  formattedAddress(addressObject: {
    country?: string;
    state?: string;
    city?: string;
    postal_code?: string;
    address?: string;
    street?: string;
    street_number?: string;
    complement_address?: string;
  }) {
    const street = addressObject?.street ?? '';
    const streetNumber = addressObject?.street_number ?? '';
    const postalCode = addressObject?.postal_code ?? '';
    const city = addressObject?.city ?? '';
    const state = addressObject?.state ?? '';
    const country = addressObject?.country ?? '';
    const complementAddress = addressObject?.complement_address
      ? `Complement: ${addressObject?.complement_address}.`
      : '';

    return `${street} ${streetNumber}, ${postalCode}, ${city}, ${state}-${country}. ${complementAddress}`;
  }

  formatLocation(location) {
    const divisionsList = location.location_administrative_divisions.map(
      (data) => {
        return {
          [data?.administrative_divisions?.administrative_division_types?.name]:
            data?.administrative_divisions?.value,
        };
      },
    );

    const divisions =
      divisionsList.length > 0
        ? divisionsList.reduce((accumulator, element) => ({
            ...accumulator,
            ...element,
          }))
        : [];

    const addressObject = {
      location_uuid: location.location_uuid,
      ...divisions,
      street_number: location.street_number,
      postal_code: location.postal_codes.value,
      complement_address: location.complement,
    };

    return {
      ...addressObject,
      address_formatted: this.formattedAddress(addressObject),
    };
  }

  async getLocation(locationUuid: string) {
    try {
      const location = await this.prisma.locations.findUnique({
        where: {
          location_uuid: locationUuid,
        },
        include: {
          postal_codes: true,
          location_administrative_divisions: true,
        },
      });

      const administrativeDivisions =
        await this.prisma.administrative_divisions.findMany({
          where: {
            location_administrative_divisions: {
              some: {
                OR: location.location_administrative_divisions.map((e) => ({
                  location_administrative_division_uuid:
                    e.location_administrative_division_uuid,
                })),
              },
            },
          },
          include: {
            administrative_division_types: true,
          },
        });

      if (!location) return null;

      return this.formatLocation({ ...location, administrativeDivisions });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async makeRelationship(
    location_uuid: string,
    divisions: administrative_divisions[],
  ) {
    try {
      divisions.forEach(async ({ administrative_division_uuid }) => {
        await this.prisma.location_administrative_divisions.create({
          data: {
            location_administrative_division_uuid: uuidv4(),
            location_uuid,
            administrative_division_uuid,
          },
        });
      });
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getOrSaveDivisions(
    divisions: Array<{
      value: string;
      administrative_division_type_uuid: string;
    }>,
  ) {
    try {
      const divisionsSaved = divisions.map(async (division) => {
        let savedDivision =
          await this.prisma.administrative_divisions.findFirst({
            where: { value: division.value },
          });

        if (!savedDivision) {
          savedDivision = await this.prisma.administrative_divisions.create({
            data: {
              administrative_division_uuid: uuidv4(),
              ...division,
            },
          });
        }

        return savedDivision;
      });

      return await Promise.all(divisionsSaved);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getOrSaveDivisionTypes(divisionTypes: string[]) {
    try {
      const divisionsUuid = divisionTypes.map(async (division) => {
        let savedDivisionType =
          await this.prisma.administrative_division_types.findFirst({
            where: { name: division },
          });

        if (!savedDivisionType) {
          savedDivisionType =
            await this.prisma.administrative_division_types.create({
              data: {
                administrative_division_type_uuid: uuidv4(),
                name: division,
              },
            });
        }

        return {
          type: division,
          uuid: savedDivisionType.administrative_division_type_uuid,
        };
      });

      return await Promise.all(divisionsUuid);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async getOrSavePostalCode(postalCode: string) {
    try {
      const savedPostalCode = await this.prisma.postal_codes.findFirst({
        where: { value: postalCode },
      });

      if (!savedPostalCode) {
        const newPostalCode = await this.prisma.postal_codes.create({
          data: {
            postal_code_uuid: uuidv4(),
            value: postalCode,
          },
        });

        return newPostalCode;
      }

      return savedPostalCode;
    } catch (error) {
      throw new BadRequestException();
    }
  }

  async createOrUpdateLocationPrerequisites(createLocation: CreateLocation) {
    const { postal_code_uuid } = await this.getOrSavePostalCode(
      createLocation.postal_code,
    );

    const [streetType, stateType, countryType, cityType] =
      await this.getOrSaveDivisionTypes(['street', 'state', 'country', 'city']);

    const divisions = await this.getOrSaveDivisions([
      {
        value: createLocation.street,
        administrative_division_type_uuid: streetType.uuid,
      },
      {
        value: createLocation.state,
        administrative_division_type_uuid: stateType.uuid,
      },
      {
        value: createLocation.country,
        administrative_division_type_uuid: countryType.uuid,
      },
      {
        value: createLocation.city,
        administrative_division_type_uuid: cityType.uuid,
      },
    ]);

    return { postal_code_uuid, divisions };
  }

  async createLocation(createLocation: CreateLocation) {
    const { postal_code_uuid, divisions } =
      await this.createOrUpdateLocationPrerequisites(createLocation);

    if (!postal_code_uuid || !divisions) return null;

    const rawAddress =
      Object.keys(createLocation.raw_address || {}).length > 0
        ? createLocation.raw_address
        : undefined;

    const { location_uuid } = await this.prisma.locations.create({
      data: {
        location_uuid: uuidv4(),
        street_number: createLocation.street_number,
        complement: createLocation.complement_address,
        address_type: createLocation.address_type || 'RESIDENTIAL',
        postal_code_uuid,
        raw_address: rawAddress,
      },
    });

    await this.makeRelationship(location_uuid, divisions);

    return await this.getLocation(location_uuid);
  }
}
