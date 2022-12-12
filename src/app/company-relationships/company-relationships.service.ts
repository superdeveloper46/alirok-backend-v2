import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as _ from 'lodash';
import { isUUID } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { SendgridService } from '../../vendors/sendgrid/sendgrid.service';
import { Request } from 'express';
import { enum_company_relationships_connected } from '@generated/client';
import { renderNetTerms } from '../../helpers/global-helpers';
import { PAYMENT_TERMS_OPTIONS } from '../../common/constants/global.constants';
import {
  CreateVendorDTO,
  FetchPendingInviteDTO,
  IFindAllCustomerRelationships,
  SearchCompanyDTO,
  AcceptPendingInviteDTO,
  FetchAllInviteByConnectTypeDTO,
  VerifyInvitationDTO,
} from './dto/company-relationships.dto';

@Injectable()
export class CompanyRelationshipsService {
  constructor(
    private prisma: PrismaService,
    private readonly sendgridService: SendgridService,
  ) {}

  async findAllCustomerRelationships({
    relationType,
    currentCompany,
    queryParams: queryPrams,
  }: IFindAllCustomerRelationships) {
    try {
      // Check if query params has company UUID for explicit search
      const companyUUID = isUUID(queryPrams.company_uuid)
        ? queryPrams.company_uuid
        : currentCompany;

      let relationShipSelect: Record<string, any> = {
        companies_companiesTocompany_relationships_customer_company_uuid: {
          select: {
            company_uuid: true,
            legal_name: true,
            logo: true,
            company_type_uuid: true,
          },
        },
      };

      let whereCondition: Record<string, any> = {
        customer_company_uuid: {
          not: companyUUID,
        },
      };

      let currentCompanyData = null;

      if (queryPrams.fetch_company) {
        currentCompanyData = await this.prisma.companies.findUnique({
          select: {
            company_uuid: true,
            company_type_uuid: true,
            legal_name: true,
            logo: true,
          },
          where: {
            company_uuid: companyUUID,
          },
        });
      }

      if (relationType == 'vendor') {
        relationShipSelect = {
          companies_companiesTocompany_relationships_vendor_company_uuid: {
            select: {
              company_uuid: true,
              legal_name: true,
              logo: true,
              company_type_uuid: true,
            },
          },
        };
        whereCondition = {
          vendor_company_uuid: {
            not: companyUUID,
          },
        };
      }

      whereCondition['requester_company_uuid'] = companyUUID;

      const locationReferenceTypeData =
        await this.prisma.company_relationships.findMany({
          select: {
            ...relationShipSelect,
          },
          where: {
            ...whereCondition,
            connected: 'CONNECTED',
          },
        });
      const data = locationReferenceTypeData.map((row: any) => {
        if (relationType == 'customer') {
          return {
            company_uuid: _.get(
              row,
              'companies_companiesTocompany_relationships_customer_company_uuid.company_uuid',
              '',
            ),
            legal_name: _.get(
              row,
              'companies_companiesTocompany_relationships_customer_company_uuid.legal_name',
              '',
            ),
            logo: _.get(
              row,
              'companies_companiesTocompany_relationships_customer_company_uuid.logo',
              '',
            ),
            company_type_uuid: _.get(
              row,
              'companies_companiesTocompany_relationships_customer_company_uuid.company_type_uuid',
              '',
            ),
          };
        } else {
          return {
            company_uuid: _.get(
              row,
              'companies_companiesTocompany_relationships_vendor_company_uuid.company_uuid',
              '',
            ),
            legal_name: _.get(
              row,
              'companies_companiesTocompany_relationships_vendor_company_uuid.legal_name',
              '',
            ),
            logo: _.get(
              row,
              'companies_companiesTocompany_relationships_vendor_company_uuid.logo',
              '',
            ),
            company_type_uuid: _.get(
              row,
              'companies_companiesTocompany_relationships_vendor_company_uuid.company_type_uuid',
              '',
            ),
          };
        }
      });

      return [currentCompanyData, ...data].filter((row) => row);
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error in fetching relationship data!',
      );
    }
  }

  async fetchAllInvitations(relationType: string, currentCompanyUUID: string) {
    let relationField = 'customer_company_uuid';
    let relationFieldData =
      'companies_companiesTocompany_relationships_customer_company_uuid';
    if (relationType == 'vendor') {
      relationFieldData =
        'companies_companiesTocompany_relationships_vendor_company_uuid';
      relationField = 'vendor_company_uuid';
    }

    const defaultSelect: Record<string, unknown> = {
      company_relationship_uuid: true,
      contact_person: true,
      connected: true,
      currencies: {
        select: {
          code: true,
        },
      },
      companies_companiesTocompany_relationships_addressee_company_uuid: {
        select: {
          locations: {
            select: {
              address_type: true,
              street_number: true,
              complement: true,
            },
          },
        },
      },
      [relationFieldData]: {
        select: {
          legal_name: true,
          logo: true,
          phone: true,
        },
      },
    };

    const inviteReceived = await this.prisma.company_relationships.findMany({
      select: { ...defaultSelect },
      where: {
        [relationField]: currentCompanyUUID,
      },
    });

    const inviteSent = await this.prisma.company_relationships.findMany({
      select: { ...defaultSelect },
      where: {
        requester_company_uuid: currentCompanyUUID,
      },
    });

    return [
      ...inviteReceived.map((row) => ({
        ...row,
        category: 'invitations_received',
        name: row[relationFieldData]?.legal_name || '',
        relation_data: row[relationFieldData],
        address:
          row?.[
            'companies_companiesTocompany_relationships_addressee_company_uuid'
          ]?.locations || {},
        [relationFieldData]: undefined,
        companies_companiesTocompany_relationships_addressee_company_uuid:
          undefined,
      })),
      ...inviteSent.map((row) => ({
        ...row,
        category: 'invitations_sent',
        name: row[relationFieldData]?.legal_name || '',
        relation_data: row[relationFieldData],
        address:
          row?.[
            'companies_companiesTocompany_relationships_addressee_company_uuid'
          ]?.locations || {},
        [relationFieldData]: undefined,
        companies_companiesTocompany_relationships_addressee_company_uuid:
          undefined,
      })),
    ];
  }

  async verifyInvitation({ companyRelationUUID }: VerifyInvitationDTO) {
    const relationData = await this.prisma.company_relationships.findFirst({
      select: {
        customer_company_uuid: true,
        vendor_company_uuid: true,
        requester_company_uuid: true,
        contact_person: true,
      },
      where: {
        company_relationship_uuid: companyRelationUUID,
        connected: 'PENDING',
      },
    });

    try {
      if (relationData) {
        const companyUUID =
          relationData.customer_company_uuid ===
          relationData.requester_company_uuid
            ? relationData.vendor_company_uuid
            : relationData.customer_company_uuid;

        const companyData = await this.prisma.companies.findFirst({
          select: {
            legal_name: true,
            tax_id: true,
            user_uuid: true,
          },
          where: {
            company_uuid: companyUUID,
          },
        });

        if (companyData.user_uuid) {
          throw new Error('Invitation already accepted');
        }

        if (companyData) {
          return {
            email: relationData.contact_person,
            tax_id: companyData.tax_id,
            company_name: companyData.legal_name,
            company_uuid: companyUUID,
          };
        } else {
          throw new Error('Company not found');
        }
      } else {
        throw new Error('Invitation not found');
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async fetchInvitationsCount(currentCompanyUUID: string) {
    try {
      const invitationsReceived = await this.prisma.company_relationships.count(
        {
          where: {
            connected: 'PENDING',
            requester_company_uuid: {
              not: currentCompanyUUID,
            },
            OR: [
              {
                vendor_company_uuid: currentCompanyUUID,
              },
              {
                customer_company_uuid: currentCompanyUUID,
              },
            ],
          },
        },
      );

      const invitationsSent = await this.prisma.company_relationships.count({
        where: {
          connected: 'PENDING',
          requester_company_uuid: currentCompanyUUID,
          OR: [
            {
              vendor_company_uuid: currentCompanyUUID,
            },
            {
              customer_company_uuid: currentCompanyUUID,
            },
          ],
        },
      });

      return { invitationsReceived, invitationsSent };
    } catch (error) {
      return {
        invitationsReceived: 0,
        invitationsSent: 0,
      };
    }
  }

  async fetchAllInviteByConnectType(
    params: FetchAllInviteByConnectTypeDTO,
    currentCompanyUUID: string,
  ) {
    // Default is customer
    const connectType = params.connectType;
    const relationType = params.relationType || 'customer';
    let relationFieldData =
      'companies_companiesTocompany_relationships_customer_company_uuid';

    // Default for sent
    let connectedDataUUID: Record<string, string> = {
      vendor_company_uuid: currentCompanyUUID,
    };

    // Vendor fields
    if (relationType == 'vendor') {
      relationFieldData =
        'companies_companiesTocompany_relationships_vendor_company_uuid';

      connectedDataUUID = {
        customer_company_uuid: currentCompanyUUID,
      };
    }

    // Fetch all sent invites
    if (connectType === 'sent') {
      return await this.fetchAllReceivedAndSentInvitations(
        connectType,
        currentCompanyUUID,
      );
    } else if (connectType === 'received') {
      // Fetch all received invites
      return await this.fetchAllReceivedAndSentInvitations(
        connectType,
        currentCompanyUUID,
      );
    }

    // Go for vendor and customer connected users
    const defaultSelect: Record<string, unknown> = {
      company_relationship_uuid: true,
      credit_line: true,
      payment_term: true,
      connected: true,
      currencies: {
        select: {
          code: true,
        },
      },
    };

    // Customer condition applies
    const connectedData = await this.prisma.company_relationships.findMany({
      select: {
        ...defaultSelect,
        [relationFieldData]: {
          select: {
            company_types: {
              select: {
                name: true,
              },
            },
            legal_name: true,
            logo: true,
            email: true,
          },
        },
      },
      where: {
        ...connectedDataUUID,
        requester_company_uuid: currentCompanyUUID,
        connected: 'CONNECTED',
      },
    });

    // Get Customer Vendor vice versa
    const customerVendorData = await this.prisma.company_relationships.findMany(
      {
        select: {
          ...defaultSelect,
          companies_companiesTocompany_relationships_requester_company_uuid: {
            select: {
              company_types: {
                select: {
                  name: true,
                },
              },
              legal_name: true,
              logo: true,
              email: true,
            },
          },
        },
        where: {
          ...connectedDataUUID,
          requester_company_uuid: {
            not: currentCompanyUUID,
          },
          connected: 'CONNECTED',
        },
      },
    );

    return [
      ...connectedData.map((row) => ({
        ...row,
        name: row[relationFieldData]?.legal_name || '',
        contact_person: row[relationFieldData]?.email || '',
        logo: row[relationFieldData]?.logo || '',
        payment_term: Number(row['payment_term'] || ''),
        net_terms: renderNetTerms(row['payment_term'] || ''),
        company_types: row[relationFieldData]?.company_types?.name || 'N/A',
        relation_data: undefined,
        [relationFieldData]: undefined,
      })),
      ...customerVendorData.map((row) => ({
        ...row,
        name:
          row[
            'companies_companiesTocompany_relationships_requester_company_uuid'
          ]?.legal_name || '',
        contact_person:
          row[
            'companies_companiesTocompany_relationships_requester_company_uuid'
          ]?.email || '',
        logo:
          row[
            'companies_companiesTocompany_relationships_requester_company_uuid'
          ]?.logo || '',
        payment_term: Number(row['payment_term'] || ''),
        net_terms: renderNetTerms(row['payment_term'] || ''),
        company_types:
          row[
            'companies_companiesTocompany_relationships_requester_company_uuid'
          ]?.company_types?.name || 'N/A',
        relation_data: undefined,
        ['companies_companiesTocompany_relationships_requester_company_uuid']:
          undefined,
      })),
    ];
  }

  async fetchAllReceivedAndSentInvitations(
    inviteType: 'sent' | 'received',
    currentCompanyUUID: string,
  ) {
    try {
      const defaultSelect: Record<string, unknown> = {
        company_relationship_uuid: true,
        contact_person: true,
        credit_line: true,
        payment_term: true,
        connected: true,
        currencies: {
          select: {
            code: true,
          },
        },
      };

      // Default is sent invite
      let sentInviteCondition: Record<string, string | unknown> = {
        requester_company_uuid: currentCompanyUUID,
      };
      let connectStatus: enum_company_relationships_connected[] = [
        'PENDING',
        'REFUSED',
      ];

      // Default for sent
      let sentCustomerUUID: Record<string, string> = {
        vendor_company_uuid: currentCompanyUUID,
      };
      let sentVendorUUID: Record<string, string> = {
        customer_company_uuid: currentCompanyUUID,
      };

      let customerCompanyRelationField =
        'companies_companiesTocompany_relationships_customer_company_uuid';
      let vendorCompanyRelationField =
        'companies_companiesTocompany_relationships_vendor_company_uuid';

      // Received invite
      if (inviteType === 'received') {
        sentInviteCondition = {
          requester_company_uuid: {
            not: currentCompanyUUID,
          },
        };

        connectStatus = ['PENDING'];

        sentCustomerUUID = { customer_company_uuid: currentCompanyUUID };
        sentVendorUUID = { vendor_company_uuid: currentCompanyUUID };

        customerCompanyRelationField =
          'companies_companiesTocompany_relationships_requester_company_uuid';
        vendorCompanyRelationField =
          'companies_companiesTocompany_relationships_requester_company_uuid';
      }

      // Customers
      const sentCustomers = await this.prisma.company_relationships.findMany({
        select: {
          ...defaultSelect,
          [customerCompanyRelationField]: {
            select: {
              company_types: {
                select: {
                  name: true,
                },
              },
              legal_name: true,
              logo: true,
              email: true,
            },
          },
        },
        where: {
          ...sentInviteCondition,
          ...sentCustomerUUID,
          connected: {
            in: connectStatus,
          },
        },
      });

      // Vendors
      const sentVendors = await this.prisma.company_relationships.findMany({
        select: {
          ...defaultSelect,
          [vendorCompanyRelationField]: {
            select: {
              company_types: {
                select: {
                  name: true,
                },
              },
              legal_name: true,
              logo: true,
              email: true,
            },
          },
        },
        where: {
          ...sentInviteCondition,
          ...sentVendorUUID,
          connected: {
            in: connectStatus,
          },
        },
      });

      const sentCustomerReceiveVendor =
        inviteType === 'received' ? 'vendors' : 'customers';
      const sentVendorReceiveCustomer =
        inviteType === 'received' ? 'customers' : 'vendors';

      return [
        ...sentCustomers.map((row) => ({
          ...row,
          category: sentCustomerReceiveVendor,
          name: row[customerCompanyRelationField]?.legal_name || '',
          logo: row[customerCompanyRelationField]?.logo || '',
          contact_person:
            row[customerCompanyRelationField]?.email || row['contact_person'],
          payment_term: Number(row['payment_term'] || ''),
          net_terms: renderNetTerms(row['payment_term'] || ''),
          company_types:
            row[customerCompanyRelationField]?.company_types?.name || 'N/A',
          relation_data: undefined,
          [customerCompanyRelationField]: undefined,
        })),
        ...sentVendors.map((row) => ({
          ...row,
          category: sentVendorReceiveCustomer,
          name: row[vendorCompanyRelationField]?.legal_name || '',
          logo: row[vendorCompanyRelationField]?.logo || '',
          contact_person:
            row[customerCompanyRelationField]?.email || row['contact_person'],
          payment_term: Number(row['payment_term'] || ''),
          net_terms: renderNetTerms(row['payment_term'] || ''),
          company_types:
            row[vendorCompanyRelationField]?.company_types?.name || 'N/A',
          relation_data: undefined,
          [vendorCompanyRelationField]: undefined,
        })),
      ];
    } catch (error) {
      return [];
    }
  }

  async createVendor(
    relationType: string,
    createVendor: CreateVendorDTO,
    currentCompanyUUID: string,
    request: Request,
  ) {
    try {
      return await this.prisma.$transaction(
        async (prisma) => {
          try {
            const origin = request.get('origin');
            const companyRequesterUUID = currentCompanyUUID;
            const customerCompanyUUID =
              createVendor.customer_company_uuid ?? currentCompanyUUID;
            const vendorCompanyUUID =
              createVendor.vendor_company_uuid ?? currentCompanyUUID;

            if (
              customerCompanyUUID !== vendorCompanyUUID &&
              (customerCompanyUUID === currentCompanyUUID ||
                vendorCompanyUUID === currentCompanyUUID)
            ) {
              const companyData = await prisma.companies.findUnique({
                where: {
                  company_uuid: currentCompanyUUID,
                },
              });

              const companyAddresseeUUID =
                companyRequesterUUID === vendorCompanyUUID
                  ? customerCompanyUUID
                  : vendorCompanyUUID;

              const newCompanyDetails = await prisma.companies.findUnique({
                select: {
                  user_uuid: true,
                  email: true,
                },
                where: {
                  company_uuid: companyAddresseeUUID,
                },
              });

              if (!newCompanyDetails) {
                throw new NotFoundException(
                  'Company not found while creating a relationship',
                );
              }

              const relationExists =
                await prisma.company_relationships.findMany({
                  where: {
                    customer_company_uuid: customerCompanyUUID,
                    vendor_company_uuid: vendorCompanyUUID,
                  },
                });

              // Create a relationship
              if (relationExists.length === 0) {
                const company_relationship_uuid = uuidv4();

                const relationData =
                  await this.prisma.company_relationships.create({
                    data: {
                      company_relationship_uuid,
                      active: true,
                      contact_person: createVendor.contact_person,
                      credit_line: createVendor.credit_line,
                      payment_term: createVendor.payment_term,
                      connected: 'PENDING',
                      created_at: new Date(),
                      companies_companiesTocompany_relationships_addressee_company_uuid:
                        {
                          connect: {
                            company_uuid: companyAddresseeUUID,
                          },
                        },
                      companies_companiesTocompany_relationships_customer_company_uuid:
                        {
                          connect: {
                            company_uuid: customerCompanyUUID,
                          },
                        },
                      companies_companiesTocompany_relationships_requester_company_uuid:
                        {
                          connect: {
                            company_uuid: companyRequesterUUID,
                          },
                        },
                      companies_companiesTocompany_relationships_vendor_company_uuid:
                        {
                          connect: {
                            company_uuid: vendorCompanyUUID,
                          },
                        },
                      currencies: {
                        connect: {
                          currency_uuid: createVendor.currency_uuid,
                        },
                      },
                      company_relationship_attachments: {
                        create: [
                          {
                            company_relationship_attachment_uuid: uuidv4(),
                            companies: {
                              connect: {
                                company_uuid: currentCompanyUUID,
                              },
                            },
                          },
                        ],
                      },
                    },
                  });

                // send email
                let buttonLink = `${origin || ''}/invitations/received`;

                // Send the new user creation link if the user does not exits, not linked to the company
                if (!newCompanyDetails.user_uuid) {
                  buttonLink = `${
                    origin || ''
                  }/invite-confirmation/${company_relationship_uuid}`;
                }

                // Default is for customer as vendor (if invite sent for customer, that becomes vendor and if invite sent to vendor that becomes customer)
                let templateId = 'd-c4d7008e4a7e4cf3847393c13e1b5d46';
                let buttonText = 'customer';
                let headerText = `You Rok! ${companyData.legal_name} wants to ship with you`;
                let bodyText = `Add your rates, accept booking, payment and grow your business!`;

                if (relationType === 'customer') {
                  buttonText = 'vendor';
                  templateId = 'd-bbf7c63ce2374b818235bc8cd913b0ba';
                  headerText = `${companyData.legal_name} just gave you access to real-time rates!`;
                  bodyText = `Hi, now you can quote, book and pay for your next shipment in real-time!`;
                }

                const emailTo =
                  newCompanyDetails.email || createVendor.contact_person;
                const emailCC =
                  emailTo !== createVendor.contact_person
                    ? createVendor.contact_person
                    : null;

                const vendorMail = {
                  to: emailTo,
                  cc: emailCC,
                  templateId: templateId,
                  subject: `You Rok! ${companyData.legal_name} wants to ship with you at Alirok!`,
                  data: {
                    avatar: companyData.icon,
                    header: headerText,
                    body: bodyText,
                    buttonLink: buttonLink,
                    buttonText: `Accept ${buttonText}`,
                  },
                };

                try {
                  await this.sendgridService.send(vendorMail);
                } catch (error) {
                  console.log('error', error);
                  // code
                }

                return relationData;
              } else {
                throw new BadRequestException('Invitation already sent');
              }
            } else {
              throw new BadRequestException(
                'Failed to create relationship, either vendor or customer uuid require',
              );
            }
          } catch (error) {
            throw new BadRequestException(error);
          }
        },
        { maxWait: 50000, timeout: 50000 },
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async fetchPendingInvite(
    { relationType, relationshipUUID }: FetchPendingInviteDTO,
    currentCompanyUUID: string,
  ) {
    try {
      let relationField = 'vendor_company_uuid';
      let relationFieldData =
        'companies_companiesTocompany_relationships_vendor_company_uuid';
      if (relationType == 'vendor') {
        relationField = 'customer_company_uuid';
        relationFieldData =
          'companies_companiesTocompany_relationships_customer_company_uuid';
      }

      const data = await this.prisma.company_relationships.findFirst({
        select: {
          company_relationship_uuid: true,
          credit_line: true,
          payment_term: true,
          currencies: {
            select: {
              code: true,
            },
          },
          companies_companiesTocompany_relationships_addressee_company_uuid: {
            select: {
              company_types: {
                select: {
                  name: true,
                },
              },
              locations: {
                select: {
                  street_number: true,
                  complement: true,
                },
              },
            },
          },
          [relationFieldData]: {
            select: {
              legal_name: true,
              logo: true,
              tax_id: true,
            },
          },
          companies_companiesTocompany_relationships_requester_company_uuid: {
            select: {
              legal_name: true,
              logo: true,
              tax_id: true,
              company_types: {
                select: {
                  name: true,
                },
              },
              locations: {
                select: {
                  street_number: true,
                  complement: true,
                },
              },
            },
          },
        },
        where: {
          company_relationship_uuid: relationshipUUID,
          connected: 'PENDING',
          [relationField]: currentCompanyUUID,
        },
      });

      if (data) {
        return {
          ...data,
          legal_name:
            data?.[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ]?.legal_name || '',
          logo:
            data?.[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ]?.logo || '',
          tax_id:
            data?.[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ]?.tax_id || '',
          company_type:
            data?.[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ]?.company_types?.name || '',
          address:
            data?.[
              'companies_companiesTocompany_relationships_requester_company_uuid'
            ]?.locations || {},
          currency_code: data?.['currencies']?.code || '',
          [relationFieldData]: undefined,
          currencies: undefined,
          companies_companiesTocompany_relationships_requester_company_uuid:
            undefined,
          companies_companiesTocompany_relationships_addressee_company_uuid:
            undefined,
        };
      } else {
        throw new NotFoundException('Invitation not found');
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async acceptPendingInvite(
    params: FetchPendingInviteDTO,
    currentCompanyUUID: string,
    inviteData: AcceptPendingInviteDTO,
  ) {
    try {
      const inviteFound = await this.fetchPendingInvite(
        params,
        currentCompanyUUID,
      );

      const payload = {};
      if (inviteData.credit_line || inviteData.credit_line >= 0) {
        payload['credit_line'] = inviteData.credit_line;
      }

      if (inviteData.payment_term) {
        if (!PAYMENT_TERMS_OPTIONS.includes(inviteData.payment_term)) {
          throw new BadRequestException('Invalid net terms');
        }

        payload['payment_term'] = inviteData.payment_term;
      }

      if (inviteFound) {
        return this.prisma.company_relationships.update({
          where: {
            company_relationship_uuid: params.relationshipUUID,
          },
          data: {
            connected: inviteData.connectType,
            ...payload,
          },
        });
      } else {
        throw new NotFoundException('Invitation not found');
      }
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async searchCompanies(query: SearchCompanyDTO, currentCompany: string) {
    try {
      let whereCondition = {};

      if (query.term) {
        whereCondition = {
          OR: [
            { legal_name: { contains: query.term, mode: 'insensitive' } },
            { fantasy_name: { contains: query.term, mode: 'insensitive' } },
            { tax_id: { contains: query.term, mode: 'insensitive' } },
          ],
        };
      }

      return this.prisma.companies.findMany({
        where: {
          ...whereCondition,
          company_uuid: {
            not: currentCompany,
          },
        },
      });
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
