import { BadRequestException, Injectable } from '@nestjs/common';
import { users } from '@generated/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { FindAllDto } from './dto/findAll.dto';
import { FindMemberByIdDto } from './dto/findById.dto';
import { UpdateMemberDto } from './dto/updateMember.dto';
import { FormattedMember } from './dto/findOwnerMembers.dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  public async findMembers(
    currentUser: users,
    currentCompanyUuid: string,
    { term, take, skip, orderBy, sortOrder, owner }: FindAllDto,
  ) {
    if (!term || term.length === 0) {
      return [];
    }

    const ownerRequest =
      owner !== 'company'
        ? { user_uuid: currentUser?.user_uuid }
        : { company_uuid: currentCompanyUuid };

    const members = await this.prisma.parcel_members.findMany({
      where: {
        ...ownerRequest,
        OR: [
          { email: { contains: term || '', mode: 'insensitive' } },
          { full_name: { contains: term || '', mode: 'insensitive' } },
          { tax_id: { contains: term || '', mode: 'insensitive' } },
        ],
      },
      skip: skip ? +skip : 0,
      take: take ? +take : 20,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
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

    const maskedMembers = members.map(({ locations, ...rest }) => {
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

      const memberType = rest.type ?? 'INDIVIDUAL';
      const addressType = locations?.address_type ?? 'RESIDENTIAL';

      return {
        parcel_member_uuid: rest.parcel_member_uuid,
        full_name: rest.full_name,
        first_name: rest.first_name,
        last_name: rest.last_name,
        company_name: rest.company_name,
        tax_id: rest.tax_id,
        email: rest.email,
        phone: rest.phone,
        parent: rest.company_uuid ? 'company' : 'user',
        type: memberType,
        isAddressComplete:
          !!countryObj &&
          !!stateObj &&
          !!streetObj &&
          !!cityObj &&
          !!postalCodeObj &&
          !!(locations && locations.street_number),
        address: locations && {
          complement: locations.complement,
          street_number: locations.street_number,
          postal_code: postalCodeObj.value,
          city: cityObj && cityObj.administrative_divisions.value,
          street: streetObj && streetObj.administrative_divisions.value,
          state: stateObj && stateObj.administrative_divisions.value,
          country: countryObj && countryObj.administrative_divisions.value,
          address_type: addressType,
        },
      };
    });

    return maskedMembers;
  }

  private filterMembers = async (members: FormattedMember[]) => {
    const subject_role_types = await this.prisma.subject_role_types.findMany();

    const senderUuid = subject_role_types.find(
      (item) => item.name === 'Sender',
    ).subject_role_type_uuid;
    const recipientUuid = subject_role_types.find(
      (item) => item.name === 'Recipient',
    ).subject_role_type_uuid;

    const allMembers = members.map((member) => {
      let subject_role_type = '';
      if (
        member.category === 'parcel' &&
        member.subject_role_type_uuid === senderUuid
      ) {
        subject_role_type = 'sender';
      } else if (
        member.category === 'parcel' &&
        member.subject_role_type_uuid === recipientUuid
      ) {
        subject_role_type = 'recipient';
      } else if (
        member.category !== 'parcel' &&
        member.subject_role_type_uuid === senderUuid
      ) {
        subject_role_type = 'shipper';
      } else if (
        member.category !== 'parcel' &&
        member.subject_role_type_uuid === recipientUuid
      ) {
        subject_role_type = 'consignee';
      } else if (!member.category) {
        if (member.subject_role_type_uuid === senderUuid) {
          subject_role_type = 'sender';
        } else {
          subject_role_type = 'recipient';
        }
      }

      return {
        ...member,
        subject_role_type,
      };
    });
    //filter members to remove third party members
    return allMembers.filter((item) => item.subject_role_type);
  };

  public async findOwnerMembers(
    currentUser: users,
    currentCompanyUuid: string,
    { owner }: FindAllDto,
  ) {
    const ownerRequest =
      owner !== 'company'
        ? { user_uuid: currentUser?.user_uuid }
        : { company_uuid: currentCompanyUuid };

    const members = await this.prisma.parcel_members.findMany({
      where: {
        ...ownerRequest,
      },
      include: {
        parcel_member_parcel_bookings: {
          include: {
            parcel_bookings: {
              select: {
                quote: true,
              },
            },
          },
        },
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

    const formattedMembers: FormattedMember[] = members.map(
      ({ locations, ...rest }) => {
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

        const addressType = locations && locations.address_type;

        const postalCodeObj = locations && locations.postal_codes;

        const memberType = rest.type ?? 'INDIVIDUAL';

        const quote: any = rest.parcel_member_parcel_bookings.find(
          (itemMember) =>
            itemMember.parcel_member_uuid === rest.parcel_member_uuid,
        )?.parcel_bookings?.quote;

        const category = quote?.category ?? 'parcel';

        const memberImage =
          rest.type === 'INDIVIDUAL'
            ? rest.users?.photo ?? ''
            : rest.companies?.logo ?? '';

        return {
          parcel_member_uuid: rest.parcel_member_uuid,
          full_name: rest.full_name,
          first_name: rest.first_name,
          last_name: rest.last_name,
          company_name: rest.company_name,
          tax_id: rest.tax_id,
          email: rest.email,
          phone: rest.phone,
          type: memberType,
          category: category ?? '',
          subject_role_type_uuid: rest.subject_role_type_uuid,
          member_image: memberImage ?? '',
          isAddressComplete:
            !!countryObj &&
            !!stateObj &&
            !!streetObj &&
            !!cityObj &&
            !!postalCodeObj &&
            !!(locations && locations.street_number),
          address: locations && {
            address_type: addressType,
            complement: locations.complement,
            street_number: locations.street_number,
            postal_code: postalCodeObj.value,
            city: cityObj && cityObj.administrative_divisions.value,
            street: streetObj && streetObj.administrative_divisions.value,
            state: stateObj && stateObj.administrative_divisions.value,
            country: countryObj && countryObj.administrative_divisions.value,
          },
        };
      },
    );

    const finalResponse = this.filterMembers(formattedMembers);

    return finalResponse;
  }

  public async findMemberById({ uuid }: FindMemberByIdDto) {
    if (!uuid || uuid.length === 0) {
      return [];
    }
    try {
      const member = await this.prisma.parcel_members.findUnique({
        where: {
          parcel_member_uuid: uuid,
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

      if (!member) throw new BadRequestException('Member not found!');

      const formattedMember = () => {
        const cityObj =
          member.locations &&
          member.locations.location_administrative_divisions &&
          member.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'city',
          );

        const streetObj =
          member.locations &&
          member.locations.location_administrative_divisions &&
          member.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'street',
          );

        const stateObj =
          member.locations &&
          member.locations.location_administrative_divisions &&
          member.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'state',
          );

        const countryObj =
          member.locations &&
          member.locations.location_administrative_divisions &&
          member.locations.location_administrative_divisions.find(
            (e) =>
              e.administrative_divisions.administrative_division_types.name ===
              'country',
          );

        const postalCodeObj = member.locations && member.locations.postal_codes;

        const addressTypeObj = member.is_residential_address
          ? 'residential'
          : 'commercial';

        const memberType = member.type ?? 'INDIVIDUAL';

        return {
          parent: member.company_uuid ? 'company' : 'user',
          parcel_member_uuid: member.parcel_member_uuid,
          full_name: member.full_name,
          first_name: member.first_name,
          last_name: member.last_name,
          company_name: member.company_name,
          tax_id: member.tax_id,
          email: member.email,
          phone: member.phone,
          type: memberType,
          isAddressComplete:
            !!countryObj &&
            !!stateObj &&
            !!streetObj &&
            !!cityObj &&
            !!postalCodeObj &&
            !!(member.locations && member.locations.street_number),
          address: member.locations && {
            complement: member.locations.complement,
            street_number: member.locations.street_number,
            postal_code: postalCodeObj.value,
            city: cityObj && cityObj.administrative_divisions.value,
            street: streetObj && streetObj.administrative_divisions.value,
            state: stateObj && stateObj.administrative_divisions.value,
            country: countryObj && countryObj.administrative_divisions.value,
            addressType: addressTypeObj,
          },
        };
      };

      return formattedMember();
    } catch (error) {
      throw error;
    }
  }

  public async updateMember(uuid: string, data: UpdateMemberDto) {
    if (!uuid || !data) {
      throw new BadRequestException('member id or data not provided');
    }

    const user = this.prisma.users.findUnique({
      where: {
        user_uuid: data.user_uuid,
      },
    });

    const company = this.prisma.companies.findUnique({
      where: {
        company_uuid: data.company_uuid,
      },
    });

    if (!user && !company) {
      throw new BadRequestException('user or company id not founded');
    }

    return await this.prisma.parcel_members.update({
      data: {
        ...data,
      },
      where: {
        parcel_member_uuid: uuid,
      },
    });
  }
}
