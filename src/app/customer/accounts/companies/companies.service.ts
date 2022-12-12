import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { companies, users } from '@generated/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreateCompanyDto } from './dto/createCompany.dto';
import { v4 as uuidv4 } from 'uuid';
import { AddressService } from '../../../misc/address/address.service';
import { FindAllDto } from './dto/findAll.dto';
import { FindCompanyDto } from './dto/findCompany.dto';
import { maskString, maskEmail } from '../../../../helpers/mask-string.helper';
import { UpdateImage } from './dto/updateCompanyImage.dto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { S3Service } from '../../../../vendors/s3/s3.service';

@Injectable()
export class CompaniesService {
  private BUCKET_NAME: string;

  constructor(
    private readonly S3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly addressService: AddressService,
    private readonly configService: ConfigService,
  ) {
    this.BUCKET_NAME = configService.get<string>('BUCKET_NAME');
  }
  public async findMemberCompany({
    term,
    take,
    skip,
    orderBy,
    sortOrder,
  }: FindAllDto) {
    if (!term || term.length === 0) {
      return [];
    }
    const companies = await this.prisma.companies.findMany({
      where: {
        OR: [
          { email: { contains: term || '', mode: 'insensitive' } },
          { legal_name: { contains: term || '', mode: 'insensitive' } },
          { fantasy_name: { contains: term || '', mode: 'insensitive' } },
          { tax_id: { contains: term || '', mode: 'insensitive' } },
        ],
      },
      skip: skip ? +skip : 0,
      take: take ? +take : 20,
      orderBy: orderBy && {
        [orderBy]: sortOrder || 'asc',
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

    const maskedCompanies = companies.map(({ locations, ...rest }) => {
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
      const addressType = locations?.address_type ?? 'RESIDENTIAL';

      return {
        contactPerson: rest.users,
        company_uuid: rest.company_uuid,
        legal_name: rest.legal_name,
        fantasy_name: rest.fantasy_name,
        tax_id:
          rest.tax_id &&
          maskString(rest.tax_id, '*', Math.floor(rest.tax_id.length / 2)),
        email: rest.email && maskEmail(rest.email),
        phone: rest.phone &&
          (rest.phone as any).number && {
            ...(rest.phone as any),
            number: maskString(
              (rest.phone as any).number,
              '*',
              Math.floor((rest.phone as any).number.length / 2),
            ),
          },
        logo: rest.logo,
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

    return maskedCompanies;
  }

  public async findCompany({ uuid }: FindCompanyDto) {
    if (!uuid || uuid.length === 0) {
      return [];
    }
    const company = await this.prisma.companies.findUnique({
      where: {
        company_uuid: uuid,
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

    const maskedCompany = () => {
      const cityObj =
        company.locations &&
        company.locations.location_administrative_divisions &&
        company.locations.location_administrative_divisions.find(
          (e) =>
            e.administrative_divisions.administrative_division_types.name ===
            'city',
        );

      const streetObj =
        company.locations &&
        company.locations.location_administrative_divisions &&
        company.locations.location_administrative_divisions.find(
          (e) =>
            e.administrative_divisions.administrative_division_types.name ===
            'street',
        );

      const stateObj =
        company.locations &&
        company.locations.location_administrative_divisions &&
        company.locations.location_administrative_divisions.find(
          (e) =>
            e.administrative_divisions.administrative_division_types.name ===
            'state',
        );

      const countryObj =
        company.locations &&
        company.locations.location_administrative_divisions &&
        company.locations.location_administrative_divisions.find(
          (e) =>
            e.administrative_divisions.administrative_division_types.name ===
            'country',
        );

      const postalCodeObj = company.locations && company.locations.postal_codes;
      const addressType = company.locations?.address_type ?? 'RESIDENTIAL';

      return {
        contactPerson: company.users,
        company_uuid: company.company_uuid,
        legal_name: company.legal_name,
        fantasy_name: company.fantasy_name,
        tax_id:
          company.tax_id &&
          maskString(
            company.tax_id,
            '*',
            Math.floor(company.tax_id.length / 2),
          ),
        email: company.email && maskEmail(company.email),
        phone: company.phone &&
          (company.phone as any).number && {
            ...(company.phone as any),
            number: maskString(
              (company.phone as any).number,
              '*',
              Math.floor((company.phone as any).number.length / 2),
            ),
          },
        logo: company.logo,
        isAddressComplete:
          !!countryObj &&
          !!stateObj &&
          !!streetObj &&
          !!cityObj &&
          !!postalCodeObj &&
          !!(company.locations && company.locations.street_number),
        address: company.locations && {
          complement: company.locations.complement,
          street_number: company.locations.street_number,
          postal_code: postalCodeObj.value,
          city: cityObj && cityObj.administrative_divisions.value,
          street: streetObj && streetObj.administrative_divisions.value,
          state: stateObj && stateObj.administrative_divisions.value,
          country: countryObj && countryObj.administrative_divisions.value,
          address_type: addressType,
        },
      };
    };

    return maskedCompany();
  }

  async createCompany(createCompanyDto: CreateCompanyDto, currentUser: users) {
    return await this.prisma.$transaction(async (prisma) => {
      const {
        create_empty_company,
        fantasy_name,
        legal_name,
        tax_id,
        email,
        headquarter_address,
        phone,
        company_type_uuid,
      } = createCompanyDto;

      const isCompanyExists = await prisma.companies.findFirst({
        where: {
          OR: [{ legal_name }, { tax_id }, { fantasy_name }],
        },
      });

      let company: companies;
      const location = headquarter_address
        ? await this.addressService.createLocation(headquarter_address)
        : null;

      const headquarter_address_uuid = location
        ? location.location_uuid
        : undefined;

      if (isCompanyExists && isCompanyExists.user_uuid) {
        throw new ConflictException('Duplicated company data');
      } else if (isCompanyExists && !isCompanyExists.user_uuid) {
        company = await prisma.companies.update({
          data: {
            email,
            headquarter_address_uuid,
            phone: {
              ...phone,
            },
          },
          where: { company_uuid: isCompanyExists.company_uuid },
        });
      } else {
        company = await prisma.companies.create({
          data: {
            company_uuid: uuidv4(),
            fantasy_name,
            legal_name,
            tax_id,
            email,
            headquarter_address_uuid,
            phone: {
              ...phone,
            },
          },
        });
      }

      if (!create_empty_company) {
        await prisma.companies.update({
          data: {
            onboarding_finished: true,
            company_types: {
              connect: {
                company_type_uuid,
              },
            },
          },
          where: { company_uuid: company.company_uuid },
        });

        await prisma.company_users.create({
          data: {
            company_user_uuid: uuidv4(),
            companies: {
              connect: {
                company_uuid: company.company_uuid,
              },
            },
            users: {
              connect: {
                user_uuid: currentUser.user_uuid,
              },
            },
          },
        });

        await prisma.users.update({
          data: {
            companies: {
              connect: {
                company_uuid: company.company_uuid,
              },
            },
          },
          where: {
            user_uuid: currentUser.user_uuid,
          },
        });
      }

      return await prisma.companies.findUnique({
        where: { company_uuid: company.company_uuid },
        include: {
          company_types: true,
        },
      });
    });
  }

  async createWithoutAuth(
    createCompanyDto: CreateCompanyDto,
    user_uuid: string,
  ) {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          const {
            create_empty_company,
            fantasy_name,
            legal_name,
            tax_id,
            email,
            headquarter_address,
            phone,
            company_type_uuid,
            company_uuid,
          } = createCompanyDto;

          let isCompanyExists = await prisma.companies.findFirst({
            where: {
              OR: [{ legal_name }, { tax_id }, { fantasy_name }],
            },
          });

          // Fetch the company if company UUID exists in the payload
          if (company_uuid) {
            // Check if legal name is already exists
            const checkLegalName = await prisma.companies.count({
              where: {
                legal_name,
                company_uuid: {
                  not: company_uuid,
                },
              },
            });

            if (checkLegalName > 0) {
              throw new ConflictException('exist_Legal name');
            }

            // Check if Tax ID is already exists
            const checkTaxID = await prisma.companies.count({
              where: {
                tax_id,
                company_uuid: {
                  not: company_uuid,
                },
              },
            });

            if (checkTaxID > 0) {
              throw new ConflictException('exist_Tax id');
            }

            // Find a company based on UUID
            isCompanyExists = await prisma.companies.findFirst({
              where: {
                company_uuid,
              },
            });
          }

          let company: companies;
          const location = headquarter_address
            ? await this.addressService.createLocation(headquarter_address)
            : null;

          const headquarter_address_uuid = location
            ? location.location_uuid
            : undefined;

          if (isCompanyExists && isCompanyExists.user_uuid) {
            throw new ConflictException('Duplicated company data');
          } else if (isCompanyExists && !isCompanyExists.user_uuid) {
            const updatedData = {};

            if (fantasy_name) {
              updatedData['fantasy_name'] = fantasy_name;
            }
            if (legal_name) {
              updatedData['legal_name'] = legal_name;
            }
            if (tax_id) {
              updatedData['tax_id'] = tax_id;
            }

            company = await prisma.companies.update({
              data: {
                email,
                headquarter_address_uuid,
                phone: {
                  ...phone,
                },
                ...updatedData,
              },
              where: { company_uuid: isCompanyExists.company_uuid },
            });
          } else {
            company = await prisma.companies.create({
              data: {
                company_uuid: uuidv4(),
                fantasy_name,
                legal_name,
                tax_id,
                email,
                headquarter_address_uuid,
                phone: {
                  ...phone,
                },
              },
            });
          }

          if (!create_empty_company) {
            await prisma.companies.update({
              data: {
                onboarding_finished: true,
                company_types: {
                  connect: {
                    company_type_uuid,
                  },
                },
              },
              where: { company_uuid: company.company_uuid },
            });

            await prisma.company_users.create({
              data: {
                company_user_uuid: uuidv4(),
                companies: {
                  connect: {
                    company_uuid: company.company_uuid,
                  },
                },
                users: {
                  connect: {
                    user_uuid: user_uuid,
                  },
                },
              },
            });

            await prisma.users.update({
              data: {
                companies: {
                  connect: {
                    company_uuid: company.company_uuid,
                  },
                },
              },
              where: {
                user_uuid: user_uuid,
              },
            });
          }

          return await prisma.companies.findUnique({
            where: { company_uuid: company.company_uuid },
            include: {
              company_types: true,
            },
          });
        },
        { maxWait: 50000, timeout: 50000 },
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateImage(updateImage: UpdateImage, req: Request) {
    let signedRequest = '';
    let resultUrl = '';

    try {
      if (updateImage.file) {
        const filePath = `${req.hostname}/companies`;

        const fileType = updateImage.file.type;
        const fileExtension = updateImage.file.type.match(/\/([a-z]{3,})$/);

        const fileExtensionFormatted = fileExtension ? fileExtension[1] : null;

        if (
          !fileExtensionFormatted ||
          (fileExtensionFormatted !== 'jpeg' &&
            fileExtensionFormatted !== 'jpg' &&
            fileExtensionFormatted !== 'png')
        ) {
          throw new BadRequestException('File type invalid!');
        }
        const field = updateImage.file.field;
        const fileName = `${filePath}/${updateImage.company_uuid}/${field}.${fileExtensionFormatted}`;
        const s3 = this.S3Service.awsS3();

        const s3Params = {
          Bucket: this.BUCKET_NAME,
          Key: fileName,
          Expires: 60,
          ContentType: fileType,
          ACL: 'public-read',
        };

        signedRequest = await s3.getSignedUrl('putObject', s3Params);
        resultUrl = `https://${this.BUCKET_NAME}.s3.amazonaws.com/${fileName}`;

        const companyUpdated = await this.prisma.companies.update({
          data: {
            [field]: resultUrl,
          },
          where: {
            company_uuid: updateImage.company_uuid,
          },
        });
        return { ...companyUpdated, signedRequest };
      }
    } catch (error) {
      return error;
    }
  }
}
