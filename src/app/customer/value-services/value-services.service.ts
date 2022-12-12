import { Injectable } from '@nestjs/common';

import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../../prisma/prisma.service';
import { UpsertValueServicesDto } from './dto/upsert-value-services.dto';

@Injectable()
export class ValueServicesService {
  constructor(private prisma: PrismaService) {}

  async upsertValueServices({
    value_services_uuid: value_services_uuid_dto,
    effective_on,
    expires_on,
    modals,
    currency,
    weight_measure,
    restriction,
    notes,
    is_published,
    carrier_uuid,
    company_types,
    companies,
    location_references,
    services,
  }: UpsertValueServicesDto) {
    // Generate or get Value Service UUID

    const value_services_uuid = value_services_uuid_dto || uuidv4();

    await this.prisma.$transaction(
      async (prisma) => {
        // Create or Update Value Services

        const value_services = {
          effective_on,
          expires_on,
          currency,
          weight_measure,
          restriction,
          notes,
          is_published,
        };

        await prisma.value_services.upsert({
          where: {
            value_services_uuid,
          },
          create: {
            value_services_uuid,
            ...value_services,
          },
          update: value_services,
        });

        // Replace Modals

        if (modals && modals.length > 0) {
          await prisma.value_service_modal.deleteMany({
            where: {
              value_services_uuid,
            },
          });

          for (const { modal } of modals) {
            const value_service_modal_uuid = uuidv4();

            await prisma.value_service_modal.create({
              data: {
                value_service_modal_uuid,
                modal,
                value_services: {
                  connect: {
                    value_services_uuid,
                  },
                },
              },
            });
          }
        }

        // Replace Location References

        if (location_references && location_references.length > 0) {
          await prisma.value_services_location_references.deleteMany({
            where: {
              value_services_uuid,
            },
          });

          for (const {
            country,
            state,
            city,
            address,
            coverage,
            postal_code,
            type,
          } of location_references) {
            const location_references_uuid = uuidv4();

            await prisma.location_references.create({
              data: {
                location_references_uuid,
                country,
                state,
                city,
                address,
                coverage,
                postal_code,
                type,
              },
            });

            await prisma.value_services_location_references.create({
              data: {
                location_references: {
                  connect: {
                    location_references_uuid,
                  },
                },
                value_services: {
                  connect: {
                    value_services_uuid,
                  },
                },
              },
            });
          }
        }

        // Replace Carrier

        if (carrier_uuid) {
          await prisma.value_services.update({
            where: {
              value_services_uuid,
            },
            data: {
              carrier: {
                connect: {
                  company_uuid: carrier_uuid,
                },
              },
            },
          });
        }

        // Replace Companies Types

        if (company_types && company_types.length > 0) {
          await prisma.value_services_company_types.deleteMany({
            where: {
              value_services_uuid,
            },
          });

          for (const { company_type_uuid } of company_types) {
            await prisma.value_services_company_types.create({
              data: {
                company_types: {
                  connect: {
                    company_type_uuid,
                  },
                },
                value_services: {
                  connect: {
                    value_services_uuid,
                  },
                },
              },
            });
          }
        }

        // Replace Companies

        if (companies && companies.length > 0) {
          await prisma.value_services_companies.deleteMany({
            where: {
              value_services_uuid,
            },
          });

          for (const { company_uuid } of companies) {
            await prisma.value_services_companies.create({
              data: {
                companies: {
                  connect: {
                    company_uuid,
                  },
                },
                value_services: {
                  connect: {
                    value_services_uuid,
                  },
                },
              },
            });
          }
        }

        // Replace Services

        if (services && services.length > 0) {
          await prisma.service.deleteMany({
            where: {
              value_services_uuid,
            },
          });

          for (const {
            applicable_to,
            cost_minimum,
            cost_rate,
            description,
            minimum_profit,
            minimum_per,
            profit,
            rule,
            payable_to_uuid,
            custom_rule,
          } of services) {
            const service_uuid = uuidv4();
            const custom_rule_uuid = uuidv4();

            await prisma.service.create({
              data: {
                service_uuid,
                applicable_to,
                cost_minimum,
                cost_rate,
                description,
                minimum_profit,
                minimum_per,
                profit,
                rule,
                payable_to: {
                  connect: {
                    company_uuid: payable_to_uuid,
                  },
                },
                value_services: {
                  connect: {
                    value_services_uuid,
                  },
                },
                custom_rule: {
                  create: {
                    custom_rule_uuid,
                  },
                },
              },
            });

            // Replace Rules

            await prisma.custom_rule_custom_rule_address.deleteMany({
              where: {
                custom_rule_uuid,
              },
            });

            await prisma.custom_rule_custom_rule_cif.deleteMany({
              where: {
                custom_rule_uuid,
              },
            });

            await prisma.custom_rule_custom_rule_user.deleteMany({
              where: {
                custom_rule_uuid,
              },
            });

            await prisma.custom_rule_custom_rule_parcel.deleteMany({
              where: {
                custom_rule_uuid,
              },
            });

            await prisma.custom_rule_custom_rule_rate.deleteMany({
              where: {
                custom_rule_uuid,
              },
            });

            if (custom_rule && custom_rule.length > 0) {
              for (const {
                custom_rule_address,
                custom_rule_cif,
                custom_rule_user,
                custom_rule_parcel,
                custom_rule_rate,
              } of custom_rule) {
                // Address

                if (custom_rule_address && custom_rule_address.length > 0) {
                  for (const {
                    condition,
                    preposition,
                    value,
                  } of custom_rule_address) {
                    const custom_rule_address_uuid = uuidv4();

                    await prisma.custom_rule_address.create({
                      data: {
                        custom_rule_address_uuid,
                        condition,
                        preposition,
                        value,
                      },
                    });

                    await prisma.custom_rule_custom_rule_address.create({
                      data: {
                        custom_rule: {
                          connect: {
                            custom_rule_uuid,
                          },
                        },
                        custom_rule_address: {
                          connect: {
                            custom_rule_address_uuid,
                          },
                        },
                      },
                    });
                  }
                }

                // CIF

                if (custom_rule_cif && custom_rule_cif.length > 0) {
                  for (const {
                    condition,
                    preposition,
                    value,
                    coin,
                  } of custom_rule_cif) {
                    const custom_rule_cif_uuid = uuidv4();

                    await prisma.custom_rule_cif.create({
                      data: {
                        custom_rule_cif_uuid,
                        condition,
                        preposition,
                        value,
                        coin,
                      },
                    });

                    await prisma.custom_rule_custom_rule_cif.create({
                      data: {
                        custom_rule: {
                          connect: {
                            custom_rule_uuid,
                          },
                        },
                        custom_rule_cif: {
                          connect: {
                            custom_rule_cif_uuid,
                          },
                        },
                      },
                    });
                  }
                }

                // Users

                if (custom_rule_user && custom_rule_user.length > 0) {
                  for (const {
                    condition,
                    preposition,
                    value,
                  } of custom_rule_user) {
                    const custom_rule_user_uuid = uuidv4();

                    await prisma.custom_rule_user.create({
                      data: {
                        custom_rule_user_uuid,
                        condition,
                        preposition,
                        value,
                      },
                    });

                    await prisma.custom_rule_custom_rule_user.create({
                      data: {
                        custom_rule: {
                          connect: {
                            custom_rule_uuid,
                          },
                        },
                        custom_rule_user: {
                          connect: {
                            custom_rule_user_uuid,
                          },
                        },
                      },
                    });
                  }
                }

                // Parcel

                if (custom_rule_parcel && custom_rule_parcel.length > 0) {
                  for (const {
                    condition,
                    preposition,
                    value,
                  } of custom_rule_parcel) {
                    const custom_rule_parcel_uuid = uuidv4();

                    await prisma.custom_rule_parcel.create({
                      data: {
                        custom_rule_parcel_uuid,
                        condition,
                        preposition,
                        value,
                      },
                    });

                    await prisma.custom_rule_custom_rule_parcel.create({
                      data: {
                        custom_rule: {
                          connect: {
                            custom_rule_uuid,
                          },
                        },
                        custom_rule_parcel: {
                          connect: {
                            custom_rule_parcel_uuid,
                          },
                        },
                      },
                    });
                  }
                }

                // Rate

                if (custom_rule_rate && custom_rule_rate.length > 0) {
                  for (const {
                    condition,
                    preposition,
                    value,
                  } of custom_rule_rate) {
                    const custom_rule_rate_uuid = uuidv4();

                    await prisma.custom_rule_rate.create({
                      data: {
                        custom_rule_rate_uuid,
                        condition,
                        preposition,
                        value,
                      },
                    });

                    await prisma.custom_rule_custom_rule_rate.create({
                      data: {
                        custom_rule: {
                          connect: {
                            custom_rule_uuid,
                          },
                        },
                        custom_rule_rate: {
                          connect: {
                            custom_rule_rate_uuid,
                          },
                        },
                      },
                    });
                  }
                }
              }
            }
          }
        }
      },
      { maxWait: 25000, timeout: 50000 },
    );

    return await this.prisma.value_services.findUnique({
      where: {
        value_services_uuid,
      },
      include: {
        modal: true,
        carrier: true,
        value_services_companies: {
          include: {
            companies: true,
          },
        },
        value_services_company_types: {
          include: {
            company_types: true,
          },
        },
        value_services_location_references: {
          include: {
            location_references: true,
          },
        },
        service: {
          include: {
            custom_rule: {
              include: {
                custom_rule_custom_rule_address: {
                  include: {
                    custom_rule_address: true,
                  },
                },
                custom_rule_custom_rule_cif: {
                  include: {
                    custom_rule_cif: true,
                  },
                },
                custom_rule_custom_rule_parcel: {
                  include: {
                    custom_rule_parcel: true,
                  },
                },
                custom_rule_custom_rule_rate: {
                  include: {
                    custom_rule_rate: true,
                  },
                },
                custom_rule_custom_rule_user: {
                  include: {
                    custom_rule_user: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
