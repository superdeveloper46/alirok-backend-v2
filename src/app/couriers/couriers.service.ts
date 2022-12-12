import { courier, segment, tracking_code } from '@generated/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addBusinessDays, format } from 'date-fns';
import { DhlService } from './dhl/dhl.service';
import {
  NewRateShipmentAddressDataDTO,
  NewRateShipmentDTO,
  NewRateShipmentFiltersDTO,
  NewRateShipmentReturnDTO,
} from './dto/newCouriers.dto';
import { SkyPostalService } from './sky-postal/sky-postal.service';
import { UpsService } from './ups/ups.service';
import { UspsService } from './usps/usps.service';
import { SearchHelperService } from '../misc/search-helper/search-helper.service';
import { FedexService } from './fedex/fedex.service';
import { ProfitService } from '../misc/profit/profit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FeedbackService } from '../feedback/feedback.service';
import { GetFeedbacksByCompanyAndServiceDTO } from '../feedback/dto/getFeedbacksByCompanyAndService.dto';
import { CorreiosService } from './correios/correios.service';
import { ClearLaneService } from './clear-lane/clear-lane.service';
import { BpsService } from './bps/bps.service';
import { GltService } from './glt/glt.service';
import { MailAmericasService } from './mail-americas/mail-americas.service';
import { SendleService } from './sendle/sendle.service';
@Injectable()
export class CouriersService {
  private ENVIRONMENT: string;
  constructor(
    private readonly upsService: UpsService,
    private readonly dhlService: DhlService,
    private readonly uspsService: UspsService,
    private readonly skyPostalService: SkyPostalService,
    private readonly fedexService: FedexService,
    private readonly prismaService: PrismaService,
    private readonly searchHelperService: SearchHelperService,
    private readonly profitService: ProfitService,
    private readonly configService: ConfigService,
    private readonly feedbackService: FeedbackService,
    private readonly correiosService: CorreiosService,
    private readonly clearLane: ClearLaneService,
    private readonly bpsService: BpsService,
    private readonly gltService: GltService,
    private readonly mailAmericasService: MailAmericasService,
    private readonly sendleService: SendleService,
  ) {
    this.ENVIRONMENT = configService.get('ENVIRONMENT');
  }

  public async rate(rateData: NewRateShipmentDTO) {
    try {
      let quoteData = rateData;
      const couriers = rateData?.couriers;

      let quoteResults: NewRateShipmentReturnDTO[] = [];

      const {
        isWhereFromWithMemberId,
        isWhereToWithMemberId,
        isWhereFromWithCompanyId,
        isWhereToWithCompanyId,
        isWhereFromWithUserId,
        isWhereToWithUserId,
      } = this.validateMixIds(quoteData);

      if (
        isWhereFromWithUserId ||
        isWhereFromWithCompanyId ||
        isWhereFromWithMemberId
      ) {
        const address = !!quoteData.whereFrom.data?.userId
          ? await this.findUserAddress(
              quoteData.whereFrom.data?.userId,
              quoteData.whereFrom.data.addressType,
            )
          : !!quoteData.whereFrom.data?.companyId
          ? await this.findCompanyAddress(
              quoteData.whereFrom.data?.companyId,
              quoteData.whereFrom.data.addressType,
            )
          : await this.findMemberAddress(
              quoteData.whereFrom.data?.memberId,
              quoteData.whereFrom.data.addressType,
            );

        if (!address)
          throw new BadRequestException(
            'WhereFrom user address not found or not completed!',
          );

        quoteData = {
          ...quoteData,
          whereFrom: {
            ...quoteData.whereFrom,
            data: address,
          },
        };
      }
      if (
        isWhereToWithUserId ||
        isWhereToWithCompanyId ||
        isWhereToWithMemberId
      ) {
        const address = !!quoteData.whereTo.data?.userId
          ? await this.findUserAddress(
              quoteData.whereTo.data?.userId,
              quoteData.whereTo.data.addressType,
            )
          : !!quoteData.whereTo.data?.companyId
          ? await this.findCompanyAddress(
              quoteData.whereTo.data?.companyId,
              quoteData.whereTo.data.addressType,
            )
          : await this.findMemberAddress(
              quoteData.whereTo.data?.memberId,
              quoteData.whereTo.data.addressType,
            );

        if (!address)
          throw new BadRequestException(
            'WhereTo user address not found  or not completed!',
          );

        quoteData = {
          ...quoteData,
          whereTo: {
            ...quoteData.whereTo,
            data: address,
          },
        };
      }

      const origin = quoteData?.whereFrom?.data?.country;
      const destiny = quoteData?.whereTo?.data?.country;

      if (origin === 'RU' || destiny === 'RU') {
        throw new BadRequestException(
          'Quotes not available for this origin and/or destination',
        );
      }

      if (this.isCourierToQuote('ups', couriers)) {
        quoteResults.push(
          ...(await this.rateUps(quoteData, quoteData?.filters?.services)),
        );
      }

      if (this.isCourierToQuote('dhl', couriers)) {
        quoteResults.push(
          ...(await this.rateDhl(quoteData, quoteData?.filters?.services)),
        );
      }

      if (this.isCourierToQuote('skypostal', couriers)) {
        quoteResults.push(...(await this.rateSkyPostal(quoteData)));
      }

      if (this.isCourierToQuote('usps', couriers)) {
        quoteResults.push(
          ...(await this.rateUsps(quoteData, quoteData?.filters?.services)),
        );
      }

      if (this.isCourierToQuote('fedex', couriers)) {
        quoteResults.push(
          ...(await this.rateFedex(quoteData, quoteData?.filters?.services)),
        );
      }

      if (this.isCourierToQuote('bps', couriers)) {
        quoteResults.push(
          ...(await this.rateBps(quoteData, quoteData?.filters?.services)),
        );
      }
      if (this.ENVIRONMENT !== 'production') {
        if (this.isCourierToQuote('sendle', couriers)) {
          quoteResults.push(
            ...(await this.rateSendle(quoteData)),
          )
        }
      }

      if (this.ENVIRONMENT !== 'production') {
        if (this.isCourierToQuote('correios', couriers)) {
          quoteResults.push(
            ...(await this.rateCorreios(
              quoteData,
              quoteData?.filters?.services,
            )),
          );
        }

        if (
          this.isCourierToQuote('clearlane', couriers) &&
          rateData?.category === 'land'
        ) {
          quoteResults.push(
            ...(await this.rateClearLane(
              quoteData,
              quoteData?.filters?.services,
            )),
          );
        }

        if (this.isCourierToQuote('mail americas', couriers)) {
          quoteResults.push(...(await this.rateMailAmericas(quoteData)));
        }

        if (
          this.isCourierToQuote('glt', couriers) &&
          rateData?.category === 'land'
        ) {
          quoteResults.push(
            ...(await this.rateGlt(quoteData, quoteData?.filters?.services)),
          );
        }
      }

      quoteResults = await this.formatQuoteResults(quoteResults, quoteData);

      quoteResults = this.formatQuoteSorts(quoteResults, quoteData);

      return quoteResults;
    } catch (error) {
      throw new BadRequestException(error || 'Quote Failed');
    }
  }

  private formatQuoteSorts(
    quoteResults: NewRateShipmentReturnDTO[],
    quoteData: NewRateShipmentDTO,
  ) {
    if (!quoteResults?.length) {
      return quoteResults;
    }

    if (quoteData?.sortBy === 'carrier') {
      return this.sortCarrier(quoteResults);
    } else if (quoteData?.sortBy === 'transitTime') {
      return this.sortTransitTime(quoteResults);
    } else {
      return this.sortPrice(quoteResults);
    }
  }

  private formatQuoteDeliveryDates(
    quoteData: NewRateShipmentDTO,
    i: NewRateShipmentReturnDTO,
  ) {
    const daysInTransit = Number(i?.delivery?.days_in_transit);
    const deliveryDate = i?.delivery?.date;

    const formattedDate =
      !deliveryDate && daysInTransit > 0
        ? format(
            addBusinessDays(
              new Date(quoteData.shipDate.data.date),
              daysInTransit + 1,
            ),
            'yyyy-MM-dd',
          )
        : deliveryDate && deliveryDate?.length === 10
        ? deliveryDate
        : null;

    return { formattedDate, daysInTransit };
  }

  private async formatQuoteResults(
    quoteResults: NewRateShipmentReturnDTO[],
    quoteData: NewRateShipmentDTO,
  ) {
    if (!quoteResults?.length) {
      return quoteResults;
    }
    // Fetch all parcel rate sources
    const parcelRateSources =
      await this.prismaService.parcel_rate_sources.findMany({
        select: {
          parcel_rate_source_uuid: true,
          name: true,
        },
      });
    const findProfit = await this.profitService.getProfitModal('Parcel');

    return (quoteResults = await Promise.all(
      quoteResults.map(async (i) => {
        const priceValue = findProfit
          ? this.profitService.totalWithProfit(
              {
                modal: 'Parcel',
                price: i.price.value,
                profit: findProfit,
                courier: i.company.name,
              },
              false,
            )
          : i.price.value;

        const query: GetFeedbacksByCompanyAndServiceDTO = {
          service_code: i.service_code.toString(),
          company_name: i.company.name,
        };

        const reviews =
          await this.feedbackService.getFeedbacksByCompanyAndService(query);

        const parcel_rate_source_uuid =
          parcelRateSources.find(
            (row) =>
              row.name.toLocaleLowerCase() ===
              i.company.name.toLocaleLowerCase(),
          ).parcel_rate_source_uuid || '';

        const formattedDelivery = this.formatQuoteDeliveryDates(quoteData, i);

        return {
          ...i,
          price: { ...i.price, value: priceValue },
          category: quoteData?.category,
          delivery: {
            date: formattedDelivery.formattedDate,
            days_in_transit: formattedDelivery.daysInTransit,
          },
          reviews,
          parcel_rate_source_uuid,
          customLabel: {},
          services: i.services.map((a) => {
            return {
              ...a,
              items: a.items.map((b) => {
                if (findProfit) {
                  const profitServiceDetails =
                    this.profitService.totalWithProfitDetails(
                      {
                        modal: 'Parcel',
                        price: b.price.value,
                        profit: findProfit,
                        courier: a.company.name,
                      },
                      a.name !== 'Parcel Freight',
                      !!a.items.find((i) => i.name === 'First Mile'),
                    );

                  return {
                    ...b,
                    price: {
                      ...b.price,
                      value: profitServiceDetails.totalAmount,
                      tmpValue: profitServiceDetails.profitAmount,
                    },
                  };
                } else {
                  return {
                    ...b,
                    price: {
                      ...b.price,
                      value: b.price.value,
                      tmpValue: 0,
                    },
                  };
                }
              }),
            };
          }),
        };
      }),
    ));
  }

  private sortPrice = (quoteResults: NewRateShipmentReturnDTO[]) => {
    const sorted = [...quoteResults].sort((itemA, itemB) => {
      return itemA.price.value - itemB.price.value;
    });

    return sorted;
  };

  private sortTransitTime = (quoteResults: NewRateShipmentReturnDTO[]) => {
    const sorted = [...quoteResults].sort((itemA, itemB) => {
      if (
        itemA.delivery.days_in_transit <= 0 ||
        itemB.delivery.days_in_transit <= 0
      ) {
        return itemB.delivery.days_in_transit - itemA.delivery.days_in_transit;
      }
      return itemA.delivery.days_in_transit - itemB.delivery.days_in_transit;
    });

    return sorted;
  };

  private sortCarrier = (quoteResults: NewRateShipmentReturnDTO[]) => {
    const sorted = [...quoteResults].sort((itemA, itemB) => {
      return itemA.company.name.localeCompare(itemB.company.name);
    });
    return sorted;
  };

  private filterQuoteResults(
    rateData: NewRateShipmentDTO,
    quoteResults: NewRateShipmentReturnDTO[],
    filterServices: NewRateShipmentFiltersDTO['services'],
  ) {
    if (rateData?.category === 'parcel') {
      if (!filterServices || filterServices.length === 0) {
        return quoteResults;
      } else {
        const isPickup = filterServices.includes('pickUp');
        const isInsurance = filterServices.includes('insurance');
        const isDuties = filterServices.includes('duties');
        const isSignature = filterServices.includes('signature');

        let filteredQuote = quoteResults.filter(
          (quote) =>
            (isPickup
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'pickUp' || service.name === 'Pick-up',
                )
              : true) &&
            (isInsurance
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Insurance' ||
                    service.name === 'insurance',
                )
              : true) &&
            (isDuties
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Duties & Taxes' ||
                    service.name === 'duties',
                )
              : true) &&
            (isSignature
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Signature' ||
                    service.name === 'signature',
                )
              : true),
        );

        if (filterServices?.length) {
          if (isPickup) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => {
                if (i.company?.name === 'SkyPostal') {
                  return {
                    ...a,
                    items: a.items.map((b) =>
                      b.name === 'Pick-up' || b.name === 'First Mile'
                        ? { ...b, selected: true }
                        : b,
                    ),
                  };
                } else {
                  return {
                    ...a,
                    items: a.items.map((b) =>
                      b.name === 'Pick-up' ? { ...b, selected: true } : b,
                    ),
                  };
                }
              }),
            }));
          }

          if (isInsurance) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Insurance' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isDuties) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Duties & Taxes' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isSignature) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Signature' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }
        }

        filteredQuote = filteredQuote.filter(
          (i) =>
            i.company?.drop_off?.length > 0 ||
            i.services.map((service) => service.name === 'Pick-up'),
        );

        return filteredQuote;
      }
    } else if (rateData?.category === 'air') {
      if (!filterServices || filterServices.length === 0) {
        return quoteResults;
      } else {
        const isPickup = filterServices.includes('pickUp');
        const isLiftgatePickUp = filterServices.includes('liftgatePickUp');
        const isLimitedAccessPickUp = filterServices.includes(
          'limitedAccessPickUp',
        );
        const isInsurance = filterServices.includes('insurance');
        const isOrigin = filterServices.includes('origin');
        const inInsideDelivery = filterServices.includes('insideDelivery');
        const isLiftgateDelivery = filterServices.includes('liftgateDelivery');
        const isLimitedAccessDelivery = filterServices.includes(
          'limitedAccessDelivery',
        );
        const isCallBeforeDelivery =
          filterServices.includes('callBeforeDelivery');
        const isCustoms = filterServices.includes('customs');
        const isDestination = filterServices.includes('destination');

        let filteredQuote = quoteResults.filter(
          (quote) =>
            (isPickup
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'pickUp' || service.name === 'Pick-up',
                )
              : true) &&
            (isLiftgatePickUp
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'LiftgatePickUp' ||
                    service.name === 'liftgatePickUp',
                )
              : true) &&
            (isLimitedAccessPickUp
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'LimitedAccessPickUp' ||
                    service.name === 'limitedAccessPickUp',
                )
              : true) &&
            (isInsurance
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Insurance' ||
                    service.name === 'insurance',
                )
              : true) &&
            (isOrigin
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Origin' || service.name === 'origin',
                )
              : true) &&
            (inInsideDelivery
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'InsideDelivery' ||
                    service.name === 'insideDelivery',
                )
              : true) &&
            (isLiftgateDelivery
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'LiftgateDelivery' ||
                    service.name === 'liftgateDelivery',
                )
              : true) &&
            (isLimitedAccessDelivery
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'LimitedAccessDelivery' ||
                    service.name === 'limitedAccessDelivery',
                )
              : true) &&
            (isCallBeforeDelivery
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'CallBeforeDelivery' ||
                    service.name === 'callBeforeDelivery',
                )
              : true) &&
            (isCustoms
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Customs' || service.name === 'customs',
                )
              : true) &&
            (isDestination
              ? !!quote.services.find(
                  (service) =>
                    service.name === 'Destination' ||
                    service.name === 'destination',
                )
              : true),
        );

        if (filterServices?.length) {
          if (isPickup) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => {
                if (i.company?.name === 'SkyPostal') {
                  return {
                    ...a,
                    items: a.items.map((b) =>
                      b.name === 'Pick-up' || b.name === 'First Mile'
                        ? { ...b, selected: true }
                        : b,
                    ),
                  };
                } else {
                  return {
                    ...a,
                    items: a.items.map((b) =>
                      b.name === 'Pick-up' ? { ...b, selected: true } : b,
                    ),
                  };
                }
              }),
            }));
          }

          if (isLiftgatePickUp) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'LiftgatePickUp' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isLimitedAccessPickUp) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'LimitedAccessPickUp'
                    ? { ...b, selected: true }
                    : b,
                ),
              })),
            }));
          }

          if (isInsurance) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Insurance' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isOrigin) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Origin' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (inInsideDelivery) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'InsideDelivery' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isLiftgateDelivery) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'LiftgateDelivery' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isLimitedAccessDelivery) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'LimitedAccessDelivery'
                    ? { ...b, selected: true }
                    : b,
                ),
              })),
            }));
          }

          if (isCallBeforeDelivery) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'CallBeforeDelivery'
                    ? { ...b, selected: true }
                    : b,
                ),
              })),
            }));
          }

          if (isCustoms) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Customs' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }

          if (isDestination) {
            filteredQuote = filteredQuote.map((i) => ({
              ...i,
              services: i.services.map((a) => ({
                ...a,
                items: a.items.map((b) =>
                  b.name === 'Destination' ? { ...b, selected: true } : b,
                ),
              })),
            }));
          }
        }

        filteredQuote = filteredQuote.filter(
          (i) =>
            i.company?.drop_off?.length > 0 ||
            i.services.map((service) => service.name === 'Pick-up'),
        );

        return filteredQuote;
      }
    }
  }

  private async rateUps(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    if (rateData?.category === 'parcel' || !rateData?.category) {
      const quote = await this.upsService.rate(rateData, services);
      
      console.log("UPS quote data", quote?.data[0]);
      return quote?.data ? quote?.data : [];
    } else return [];
  }

  private async rateFedex(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    const quote = await this.fedexService.rateFedexRest(rateData, services);

    return quote?.data ? quote?.data : [];
  }

  private async rateCorreios(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    const quote = await this.correiosService.rate(rateData);

    return quote?.data ? quote?.data : [];
  }

  private async rateClearLane(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    const quote = await this.clearLane.rating(rateData);

    return quote?.data ? quote?.data : [];
  }

  private async rateBps(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    const quote = await this.bpsService.ratingStatic(rateData);

    return quote?.data ? quote?.data : [];
  }

  private async rateGlt(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    const quote = await this.gltService.rate(rateData, services);

    return quote?.data ? quote?.data : [];
  }

  private async rateDhl(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    if (
      rateData?.category === 'parcel' ||
      rateData?.category === 'air' ||
      !rateData?.category
    ) {
      const quote = await this.dhlService.rate(rateData, services);

      return quote?.data ? quote?.data : [];
    } else return [];
  }

  private async rateUsps(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    if (rateData?.category === 'parcel' || !rateData?.category) {
      const quote = await this.uspsService.rate(rateData, services);

      return quote?.data ? quote?.data : [];
    } else return [];
  }

  private async rateSkyPostal(rateData: NewRateShipmentDTO) {
    if (rateData?.category === 'parcel' || !rateData?.category) {
      const quote = await this.skyPostalService.rate(rateData);

      return quote?.data ? quote?.data : [];
    } else return [];
  }

  private async rateSendle (rateData: NewRateShipmentDTO) {
    if (rateData?.category === 'parcel' || !rateData?.category) {
      const quote = await this.sendleService.rate(rateData);
      
      console.log("Sendle quote data", quote?.data[0]);
      console.log("Sendle quote data items", quote?.data[0].services[0].items[0]);
      return quote?.data ? quote?.data : [];
    } else return [];
  }

  private async rateMailAmericas(rateData: NewRateShipmentDTO) {
    if (rateData?.category === 'parcel' || !rateData?.category) {
      const quote = await this.mailAmericasService.rate(rateData);

      return quote?.data ? quote?.data : [];
    } else return [];
  }

  private isCourierToQuote(courier: string, courierList: string[]) {
    return courierList?.length > 0 ? courierList.includes(courier) : true;
  }

  private async findUserAddress(
    userId: string,
    addressType: 'residential' | 'commercial',
  ): Promise<NewRateShipmentAddressDataDTO> {
    const address = await this.searchHelperService.findUserAddressData(
      userId,
      addressType,
    );
    return address;
  }

  private async findCompanyAddress(
    companyId: string,
    addressType: 'residential' | 'commercial',
  ): Promise<NewRateShipmentAddressDataDTO> {
    const address = await this.searchHelperService.findCompanyAddressData(
      companyId,
      addressType,
    );
    return address;
  }

  private async findMemberAddress(
    memberId: string,
    addressType: 'residential' | 'commercial',
  ): Promise<NewRateShipmentAddressDataDTO> {
    const address = await this.searchHelperService.findMemberAddressData(
      memberId,
      addressType,
    );
    return address;
  }

  private validateMixIds(quoteData: NewRateShipmentDTO) {
    const isWhereFromWithUserId = !!quoteData.whereFrom.data?.userId;
    const isWhereToWithUserId = !!quoteData.whereTo.data?.userId;

    const isWhereFromWithCompanyId = !!quoteData.whereFrom.data?.companyId;
    const isWhereToWithCompanyId = !!quoteData.whereTo.data?.companyId;

    const isWhereFromWithMemberId = !!quoteData.whereFrom.data?.memberId;
    const isWhereToWithMemberId = !!quoteData.whereTo.data?.memberId;

    return {
      isWhereFromWithMemberId,
      isWhereToWithMemberId,
      isWhereFromWithCompanyId,
      isWhereToWithCompanyId,
      isWhereFromWithUserId,
      isWhereToWithUserId,
    };
  }

  public async createUniversalTrackingCode(
    parcelBookingUuid: string,
    courierTrackingCodes: Array<{
      courierTrackingCode: string;
      segment: segment;
      courierType: courier;
    }>,
  ) {
    try {
      const parcelBooking = await this.prismaService.parcel_bookings.findUnique(
        {
          where: { parcel_booking_uuid: parcelBookingUuid },
        },
      );

      const findTracking = parcelBooking.tracking_code_id
        ? await this.prismaService.tracking_code.findUnique({
            where: {
              tracking_code: parcelBooking.tracking_code_id,
            },
            include: {
              courier_tracking_code: true,
            },
          })
        : null;

      if (findTracking) {
        return findTracking;
      }

      const quote: NewRateShipmentDTO = parcelBooking.quote as any;

      let tc: tracking_code;
      if ((quote?.category as string) === 'land') {
        tc = await this.prismaService.tracking_code.create({
          data: {
            tracking_code: `ALIROK${String(
              parcelBooking.parcel_serial_number,
            ).padStart(7, '0')}L`,
            parcel_bookings: {
              connect: {
                parcel_booking_uuid: parcelBookingUuid,
              },
            },
          },
        });
      } else {
        tc = await this.prismaService.tracking_code.create({
          data: {
            tracking_code: `ALIROK${String(
              parcelBooking.parcel_serial_number,
            ).padStart(7, '0')}P`,
            parcel_bookings: {
              connect: {
                parcel_booking_uuid: parcelBookingUuid,
              },
            },
          },
        });
      }

      await this.prismaService.parcel_bookings.update({
        where: {
          parcel_booking_uuid: parcelBooking.parcel_booking_uuid,
        },
        data: {
          tracking_code: {
            connect: {
              tracking_code: tc.tracking_code,
            },
          },
        },
      });

      await this.prismaService.courier_tracking_code.createMany({
        data: courierTrackingCodes.map((e) => ({
          courier_tracking_code: e.courierTrackingCode,
          courier_type: e.courierType,
          segment: e.segment,
          tracking_code_id: tc.tracking_code,
        })),
      });

      return await this.prismaService.tracking_code.findUnique({
        where: { tracking_code: tc.tracking_code },
        include: {
          courier_tracking_code: true,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
