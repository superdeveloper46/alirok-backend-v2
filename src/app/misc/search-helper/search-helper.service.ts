import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NewRateShipmentAddressDataDTO } from './dto/newRateAddress.dto';

@Injectable()
export class SearchHelperService {
  constructor(private readonly prismaService: PrismaService) {}

  public async findUserAddressData(
    userId: string,
    addressType: 'residential' | 'commercial',
  ): Promise<NewRateShipmentAddressDataDTO> {
    const { locations } = await this.prismaService.users.findUnique({
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
        addressType: addressType,
      }
    );
  }

  public async findCompanyAddressData(
    companyId: string,
    addressType: 'residential' | 'commercial',
  ): Promise<NewRateShipmentAddressDataDTO> {
    const { locations } = await this.prismaService.companies.findUnique({
      where: {
        company_uuid: companyId,
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
        addressType: addressType,
      }
    );
  }

  public async findMemberAddressData(
    memberId: string,
    addressType: 'residential' | 'commercial',
  ): Promise<NewRateShipmentAddressDataDTO> {
    const { locations } = await this.prismaService.parcel_members.findUnique({
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
        addressType: addressType,
      }
    );
  }
}
