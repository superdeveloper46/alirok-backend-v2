import {
  parcel_rates,
  parcel_rates_auto_weight_break,
  rate_types,
} from '@generated/client';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  NewRateShipmentAddressDataDTO,
  NewRateShipmentDTO,
} from 'src/app/couriers/dto/newCouriers.dto';
import { FormattersService } from '../../../../../src/app/misc/formatters/formatters.service';
import { PrismaService } from '../../../../../src/prisma/prisma.service';
import { ParcelRatesIntegrationResults } from './interface/parcel-rates-results-integration.interface';

@Injectable()
export class ParcelRatesResultsIntegrationService {
  constructor(
    private readonly formatter: FormattersService,
    private readonly http: HttpService,
    private prisma: PrismaService,
  ) {}

  async findParcelRate(
    rateData: NewRateShipmentDTO,
  ): Promise<ParcelRatesIntegrationResults[]> {
    try {
      const origin = rateData?.whereFrom?.data;
      const destiny = rateData?.whereTo?.data;

      // Convert all packages to a single weight and dimension unit

      // Use Total DIM after logic creation for it.

      // Find Routes (after warehouse logic is ready, search for dropoff locations with warehouse addresses)
      // Validated for only published parcel rates.

      // TO DO
      //
      // If coverage is worldwide, how can we verify dropoff location?
      // We need warehouse logic to verify correctly dropoff location for firstMile and lastMile quotes.
      // Lenght unit is not beeing retrieved from db
      // how to calculate total dim with multiple packages
      // improve the currency handling
      // improve the weight unit handling

      const findRoutes =
        await this.prisma?.parcel_route_location_references.findMany({
          where: {
            OR: [
              {
                country: origin.country,
              },
              {
                country: destiny.country,
              },
            ],
            parcel_routes: { published: true },
          },
          take: 5,
          include: {
            location_reference_types: true,
            parcel_routes: {
              include: {
                parcel_mass_measures: true,
                companies_companiesToparcel_routes_company_uuid: true,
                parcel_rates: { include: { rate_types: true } },
                currencies: true,
              },
            },
          },
        });

      // Crosscheck Origin with destiny countries

      const findOrigin = findRoutes.filter(
        (i) =>
          i.country === origin.country &&
          i.location_reference_types.name.toLowerCase() === 'origin',
      );

      const parcelRouteOriginIdsArray = findOrigin.map(
        (i) => i.parcel_route_uuid,
      );

      const matchOriginWithDestiny = findRoutes.filter(
        (i) =>
          i.country === destiny.country &&
          i.location_reference_types.name.toLowerCase() === 'destiny' &&
          parcelRouteOriginIdsArray.some((b) => b === i.parcel_route_uuid),
      );

      // Get all parcel routes and parcel routes ids with match

      const parcelRoutesWithMatch = matchOriginWithDestiny.map(
        (i) => i.parcel_routes,
      );

      const parcelRouteIdsWithMatch = matchOriginWithDestiny.map(
        (i) => i.parcel_routes.parcel_route_uuid,
      );

      // Get all parcel rates ids with match

      const parcelRatesWithMatch = await this.prisma.parcel_rates.findMany({
        where: { parcel_route_uuid: { in: parcelRouteIdsWithMatch } },
        include: { rate_types: true, parcel_rates_auto_weight_break: true },
      });

      // Get custom fields for profit calculation

      const customFields =
        await this.prisma.parcel_rate_parcel_rate_custom_fields.findMany({
          where: {
            parcel_rate_uuid: {
              in: parcelRatesWithMatch.map((i) => i.parcel_rate_uuid),
            },
          },
          include: { parcel_rate_custom_fields: true },
        });

      // Mapped parcel freights options

      const mappedParcelFreghts: ParcelRatesIntegrationResults[] = [];

      for (const iterator of parcelRatesWithMatch) {
        const parcelRateId = iterator.parcel_rate_uuid;

        const parcelRoute = parcelRoutesWithMatch.filter(
          (i) => i.parcel_route_uuid === iterator.parcel_route_uuid,
        )[0];

        const parcelRoutesOptions = findRoutes.filter(
          (i) => i.parcel_route_uuid === parcelRoute.parcel_route_uuid,
        );

        const parcelRouteOrigin = parcelRoutesOptions.filter(
          (i) => i.location_reference_types.name === 'origin',
        )[0];

        const parcelRouteDestiny = parcelRoutesOptions.filter(
          (i) => i.location_reference_types.name === 'destiny',
        )[0];

        const weightUnit = parcelRoute.parcel_mass_measures.name;

        const totalWeight = rateData.whatsInside.data.reduce(
          (acc, curr) =>
            (acc =
              curr.weight.unit === weightUnit
                ? this.formatter.convertKgsToLbs(curr.weight.value)
                : curr.weight.value * curr.pieces),
          0,
        );

        const isAboveMinWeight = (
          parcelRate: parcel_rates,
          totalWeight: number,
          unit: string,
          rateUnit: string,
        ) => {
          return rateUnit === unit
            ? parcelRate.minimum_weight < totalWeight
            : unit === 'kg'
            ? this.formatter.convertLbsToKgs(parcelRate.minimum_weight) <
              totalWeight
            : this.formatter.convertKgsToLbs(parcelRate.minimum_weight) <
              totalWeight;
        };

        const isUnderMaxWeight = (
          parcelRate: parcel_rates,
          totalWeight: number,
          unit: string,
          rateUnit: string,
        ) => {
          return rateUnit === unit
            ? parcelRate.minimum_weight < totalWeight
            : unit === 'kg'
            ? this.formatter.convertLbsToKgs(parcelRate.minimum_weight) <
              totalWeight
            : this.formatter.convertKgsToLbs(parcelRate.minimum_weight) <
              totalWeight;
        };

        if (
          isAboveMinWeight(iterator, totalWeight, weightUnit, 'kg') &&
          isUnderMaxWeight(iterator, totalWeight, weightUnit, 'kg')
        ) {
          const whatsInside = rateData?.whatsInside;

          const originDropoff: NewRateShipmentAddressDataDTO = {
            city: origin.city,
            country: origin.country,
            zipCode: origin.zipCode,
            state: origin.state,
            street: origin.street,
            addressType: 'commercial',
            streetNumber: '',
            additionalAddress: '',
            addressLine: `${origin.streetNumber} ${origin.street}`,
            ...origin,
          };
          const destinyAddress: NewRateShipmentAddressDataDTO = {
            city: destiny.city,
            country: destiny.country,
            zipCode: destiny.zipCode,
            state: destiny.state,
            street: destiny.street,
            addressType: 'commercial',
            streetNumber: '',
            additionalAddress: '',
            addressLine: `${destiny.streetNumber} ${destiny.street}`,
            ...destiny,
          };

          const companyName =
            parcelRoute?.companies_companiesToparcel_routes_company_uuid
              .fantasy_name ??
            parcelRoute?.companies_companiesToparcel_routes_company_uuid
              .legal_name;

          const calculatedPrice = (
            parcelRate: parcel_rates & {
              rate_types: rate_types;
              parcel_rates_auto_weight_break: parcel_rates_auto_weight_break;
            },
            totalWeight: number,
          ) => {
            const actualCustomFields = customFields
              .filter((i) => i.parcel_rate_uuid === parcelRate.parcel_rate_uuid)
              .map((b) => ({
                weight: Number(b.parcel_rate_custom_fields.field),
                price: Number(b.value),
              }));

            const searchCustomFieldsValue = actualCustomFields.map((i) =>
              i.weight >= totalWeight ? i : null,
            );

            const validCustomField = searchCustomFieldsValue[0];

            if (!validCustomField?.price) {
              const automatedWeightBreak =
                parcelRate.parcel_rates_auto_weight_break;

              const lastValidCustom =
                actualCustomFields[actualCustomFields?.length - 1];

              const additionalWeight = totalWeight - lastValidCustom?.weight;

              const additionalWeightDelta =
                additionalWeight / automatedWeightBreak?.weight;

              const additionalAmount =
                additionalWeightDelta * automatedWeightBreak?.value;

              const calculateProfitWithAutomated =
                additionalAmount + automatedWeightBreak?.value;

              return calculateProfitWithAutomated;
            } else return validCustomField.price;
          };

          const calculatedParcelPrice = calculatedPrice(iterator, totalWeight);

          const profitLogic = (
            parcelPrice: number,
            minProfit: number,
            profitType: string,
            profitPercentage: number,
          ) => {
            if (profitType === 'fixed') {
              return parcelPrice + minProfit;
            } else return parcelPrice + (parcelPrice * profitPercentage) / 100;
          };

          const parcelFreightData: ParcelRatesIntegrationResults = {
            courierName: companyName,
            destinyAddress,
            originDropoff,
            productName: iterator.rate_types.name,
            maxWeight: iterator.maximum_weight,
            minCost: iterator.minimum,
            minProfit: iterator.minimum_profit,
            minWeight: iterator.minimum_weight,
            profitType: iterator.profit_type as any,
            profitpercentage: iterator.profit,
            transitTimeFrom: iterator.transit_time_from,
            transitTimeTo: iterator.transit_time_to,
            totalPrice: profitLogic(
              calculatedParcelPrice,
              iterator.minimum_profit,
              iterator.profit_type,
              iterator.profit,
            ),
          };

          mappedParcelFreghts.push(parcelFreightData);
        }
      }

      return mappedParcelFreghts ?? [];
    } catch (error) {
      throw error;
    }
  }
}
