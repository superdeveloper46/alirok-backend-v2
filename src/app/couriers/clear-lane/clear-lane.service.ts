import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import { S3Service } from 'src/vendors/s3/s3.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
} from '../dto/newCouriers.dto';
import { ClearLaneHelperService } from './clear-lane-helper/clear-lane-helper.service';
import { parseString } from 'xml2js';
import { lastValueFrom } from 'rxjs';
import { IClearLaneRatingResponse } from './interface/clear-lane.interface';
import { parcel_bookings } from '@generated/client';

@Injectable()
export class ClearLaneService {
  private CLEAR_LANE_USERNAME;
  private CLEAR_LANE_PASSWORD;
  private CLEAR_LANE_API_URL;

  constructor(
    private readonly s3service: S3Service,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    private readonly clearLaneHelper: ClearLaneHelperService,
  ) {
    this.CLEAR_LANE_USERNAME = configService.get('CLEAR_LANE_USERNAME');
    this.CLEAR_LANE_PASSWORD = configService.get('CLEAR_LANE_PASSWORD');
    this.CLEAR_LANE_API_URL = configService.get('CLEAR_LANE_API_URL');
  }

  async rating(rateData: NewRateShipmentDTO): Promise<any> {
    try {
      this.validateSinglePackage(rateData);

      const requestBody = this.clearLaneHelper.buildRatePayload(rateData);

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CLEAR_LANE_API_URL}GetRating.asmx`,
          requestBody,
          {
            headers: {
              'Content-Type': 'text/xml',
            },
          },
        ),
      );

      let parsedXML: IClearLaneRatingResponse;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to quote packages at Clear Lane',
        });
      }

      const responseFormatted =
        parsedXML['soap:Envelope']?.['soap:Body']?.[0]?.GetRatingResponse?.[0]
          ?.GetRatingResult?.[0]?.RatingOutput?.[0];

      if (!Number(responseFormatted?.StandardTotalRate?.[0])) {
        throw new BadRequestException({
          message: 'Unable to quote packages at Clear Lane, error 2',
        });
      }

      const company = {
        logo_url: 'https://static.alirok.io/collections/logos/clear-lane.png',
        name: 'ClearLane',
        rating: 0,
        drop_off: [],
      };

      const delivery = {
        date: null,
        days_in_transit: Number(responseFormatted?.TransitDays?.[0]),
      };

      const price = {
        currency: 'USD',
        value: Number(responseFormatted?.StandardTotalRate?.[0]),
      };

      const services: NewRateShipmentReturnServiceDTO[] = [
        {
          company,
          items: [
            {
              description: 'Land Freight',
              name: 'Land Freight',
              price,
              required: true,
              drop_off: [],
            },
          ],
          name: 'Land Freight',
        },
      ];

      const formattedResponse: NewRateShipmentReturnDTO = {
        company,
        delivery,
        price,
        rate_type: 'Clear Lane Land Freight',
        service_code: responseFormatted?.ServiceLevelID?.[0],
        services,
      };

      return { data: [formattedResponse] };
    } catch (error) {
      throw error;
    }
  }

  async rateWithType(
    rateData: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    serviceCode: string,
  ): Promise<any> {
    try {
      this.validateSinglePackage(rateData);

      const requestBody = this.clearLaneHelper.buildRatePayload(rateData);

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CLEAR_LANE_API_URL}GetRating.asmx`,
          requestBody,
          {
            headers: {
              'Content-Type': 'text/xml',
            },
          },
        ),
      );

      let parsedXML: IClearLaneRatingResponse;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to quote packages at Clear Lane',
        });
      }

      const responseFormatted =
        parsedXML['soap:Envelope']?.['soap:Body']?.[0]?.GetRatingResponse?.[0]
          ?.GetRatingResult?.[0]?.RatingOutput?.[0];

      const company = {
        logo_url: 'https://static.alirok.io/collections/logos/clear-lane.png',
        name: 'Clear Lane Freight',
        rating: 0,
        drop_off: [],
      };

      const delivery = {
        date: null,
        days_in_transit: Number(responseFormatted?.TransitDays?.[0]),
      };

      const price = {
        currency: 'USD',
        value: Number(responseFormatted?.StandardTotalRate?.[0]),
      };

      const services: NewRateShipmentReturnServiceDTO[] = [
        {
          company,
          items: [
            {
              description: 'Clear Lane Land Freight',
              name: 'Clear Lane',
              price,
              required: false,
              drop_off: [],
            },
          ],
          name: 'Clear Lane Land Freight',
        },
      ];

      const formattedResponse: NewRateShipmentReturnDTO = {
        company,
        delivery,
        price,
        rate_type: 'Clear Lane Land Freight',
        service_code: responseFormatted?.ServiceLevelID?.[0],
        services,
      };

      const freightTotalPrice =
        responseFormatted?.ServiceLevelID?.[0] === serviceCode
          ? Number(responseFormatted?.StandardTotalRate?.[0])
          : null;

      return freightTotalPrice;
    } catch (error) {
      throw error;
    }
  }

  async shipping(
    parcelBooking: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    const order: NewRateShipmentReturnDTO = parcelBooking.metadata as any;
    const rateData: NewRateShipmentDTO = parcelBooking.quote as any;

    this.validateSinglePackage(rateData);

    throw new BadRequestException('Clear Lane shipping not allowed in beta');
    try {
      const requestBody = this.clearLaneHelper.buildShippingPayload(
        rateData,
        order,
        sender,
        recipient,
      );

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CLEAR_LANE_API_URL}/WTKServicesCLEARL/AirTrakShipment.asmx`,
          requestBody,
        ),
      );

      let parsedXML;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to book shipment at Clear Lane',
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async tracking(trackData: any) {
    throw new BadRequestException('Clear Lane tracking not allowed in beta');

    try {
      const requestBody = this.clearLaneHelper.buildTrackingPayload(trackData);

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CLEAR_LANE_API_URL}/WTKServicesCLEARL/AirTrakShipment.asmx`,
          requestBody,
        ),
      );

      let parsedXML;
      let parsingXMLError = false;

      parseString(data, (err, parsed) => {
        if (!err) {
          parsedXML = parsed;
          parsingXMLError = false;
        } else {
          parsedXML = null;
          parsingXMLError = true;
        }
      });
      if (parsingXMLError) {
        throw new BadRequestException({
          message: 'Unable to track packages at Clear Lane',
        });
      }
    } catch (error) {
      throw error;
    }
  }

  private validateSinglePackage({
    whatsInside: { data },
    whereFrom: {
      data: { country: fromCountry },
    },
    whereTo: {
      data: { country: toCountry },
    },
  }: NewRateShipmentDTO) {
    try {
      if (data[0].pieces > 1 || data.length > 1) {
        throw new BadRequestException(
          'Method is only allowed to single package shipments',
        );
      }

      if (fromCountry !== 'US' || toCountry !== 'US') {
        throw new BadRequestException(
          'Clear Lane is only for domestic shipments inside US',
        );
      }

      const lbsUnit = data[0].weight.unit === 'lb';

      if (lbsUnit ? data[0].weight.value > 440 : data[0].weight.value > 200) {
        throw new BadRequestException(
          'Method is only allowed to packages with =< 200kgs',
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
