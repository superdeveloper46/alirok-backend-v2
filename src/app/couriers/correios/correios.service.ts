import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
} from '../dto/newCouriers.dto';
import { CorreiosHelperService } from './correios-helper/correios-helper.service';
import {
  CorreiosCn38Request,
  CorreiosCn38Return,
  CorreiosConfirmDepartureRequest,
  CorreiosPackageCollectionRequest,
  CorreiosPackageCollectionReturn,
  CorreiosTrackingNumberBalanceReturn,
  CorreiosUnitRequest,
  CorreiosUnitRequestReturn,
} from './interface/correios.interface';
import { parseString } from 'xml2js';
import {
  createCorreiosLabel,
  ICorreiosLabelData,
} from 'src/app/misc/correios-label-generator';
import { stringify } from 'querystring';

@Injectable()
export class CorreiosService {
  private CORREIOS_USERNAME;
  private CORREIOS_PASSWORD;
  private CORREIOS_API_URL;
  private CORREIOS_CARTAO_POSTAGEM;
  private CORREIOS_BASIC_AUTH;

  private CORREIOS_SOAP_URL;
  private CORREIOS_SOAP_USERNAME;
  private CORREIOS_SOAP_PASSWORD;
  private CORREIOS_SOAP_TYPE;
  private CORREIOS_SOAP_RESULT;
  private CORREIOS_SOAP_LANGUAGE;

  constructor(
    private readonly correiosHelper: CorreiosHelperService,
    private readonly configService: ConfigService,
    private readonly http: HttpService,
  ) {
    this.CORREIOS_USERNAME = configService.get('CORREIOS_USERNAME');
    this.CORREIOS_PASSWORD = configService.get('CORREIOS_PASSWORD');
    this.CORREIOS_API_URL = configService.get('CORREIOS_API_URL');
    this.CORREIOS_CARTAO_POSTAGEM = configService.get(
      'CORREIOS_CARTAO_POSTAGEM',
    );
    this.CORREIOS_SOAP_USERNAME = configService.get('CORREIOS_SOAP_USERNAME');
    this.CORREIOS_SOAP_PASSWORD = configService.get('CORREIOS_SOAP_PASSWORD');
    this.CORREIOS_SOAP_TYPE = configService.get('CORREIOS_SOAP_TYPE');
    this.CORREIOS_SOAP_RESULT = configService.get('CORREIOS_SOAP_RESULT');
    this.CORREIOS_SOAP_LANGUAGE = configService.get('CORREIOS_SOAP_LANGUAGE');
    this.CORREIOS_SOAP_URL = configService.get('CORREIOS_SOAP_URL');

    this.CORREIOS_BASIC_AUTH = {
      Authorization: `Basic ${Buffer.from(
        `${configService.get('DHL_API_USERNAME')}:${configService.get(
          'DHL_API_PASSWORD',
        )}`,
      ).toString('base64')}`,
    };
  }

  private async getCorreiosToken() {
    try {
      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CORREIOS_API_URL}/token/v1/autentica/cartaopostagem`,
          {
            numero: this.CORREIOS_CARTAO_POSTAGEM,
          },
          {
            headers: this.CORREIOS_BASIC_AUTH,
          },
        ),
      );

      return data?.token;
    } catch (error) {
      return error;
    }
  }

  public async rate(rateData: NewRateShipmentDTO) {
    try {
      if (rateData?.whereTo?.data?.country !== 'BR') {
        return new BadRequestException(
          'Correios does not provide rates for this country!',
        );
      }

      const company = {
        logo_url: 'https://static.alirok.io/collections/logos/correios.png',
        name: 'Correios',
        rating: 0,
        drop_off: [],
      };

      const correiosTypes = this.correiosHelper.getCorreiosRatingTypes();

      const correiosFreight: NewRateShipmentReturnDTO[] =
        this.correiosHelper.mockedCorreiosParcelFreight(
          rateData,
          correiosTypes,
        );

      console.log('correiosFreight', correiosFreight);

      const responses: NewRateShipmentReturnDTO[] = [];

      const correiosFirstMile = await this.correiosHelper.servicesCorreios(
        'ups',
        rateData,
        true,
        false,
      );

      console.log('correiosFirstMile', correiosFirstMile);

      for (const firstMiles of correiosFirstMile.services) {
        for (const iterator of correiosFreight) {
          const correiosService: NewRateShipmentReturnDTO = iterator;
          console.log('correiosService', iterator);

          const formattedData: NewRateShipmentReturnDTO = {
            company,
            delivery: {
              date: null,
              days_in_transit: correiosService.delivery.days_in_transit,
            },
            price: correiosService?.price,
            rate_type: correiosService?.rate_type,
            service_code: correiosService?.service_code,
            services: [firstMiles, ...correiosService.services],
          };

          responses.push(formattedData);
        }
      }

      return { data: responses };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  public async rateWithType(
    rateData: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    serviceCode: string,
  ) {
    if (rateData?.whereTo?.data?.country !== 'BR') {
      return new BadRequestException(
        'Correios does not provide rates for this country!',
      );
    }

    const company = {
      logo_url: 'https://static.alirok.io/collections/logos/correios.png',
      name: 'Correios',
      rating: 0,
      drop_off: [],
    };

    console.log(serviceCode);

    const correiosTypes = this.correiosHelper
      .getCorreiosRatingTypes()
      .filter((i) => i.rateType === serviceCode);

    const correiosFreight = this.correiosHelper.mockedCorreiosParcelFreight(
      rateData,
      correiosTypes,
    );

    const responses: NewRateShipmentReturnDTO[] = [];

    let firstMile: NewRateShipmentReturnServiceServiceItemDTO;
    let firstMilePickUp;
    let firstMileCourier;

    for (const data of order.services) {
      if (
        data?.items?.find((i) => i.name === 'First Mile')?.selected ||
        data?.items?.find((i) => i.name === 'First Mile')?.required
      ) {
        firstMile = data?.items?.find((i) => i.name === 'First Mile');
        firstMileCourier = data?.company?.name;
      }

      if (
        data?.items?.find((i) => i.name === 'Pick-up')?.selected ||
        data?.items?.find((i) => i.name === 'Pick-up')?.required
      ) {
        firstMilePickUp = data?.items?.find((i) => i.name === 'Pick-up');
      }
    }

    const correiosFirstMile = await this.correiosHelper.servicesCorreios(
      'ups',
      rateData,
      true,
      false,
    );

    if (firstMile?.selected || firstMile?.required) {
      for (const firstMiles of correiosFirstMile.services) {
        for (const iterator of correiosFreight) {
          const correiosService: NewRateShipmentReturnDTO = iterator;

          const formattedData: NewRateShipmentReturnDTO = {
            company,
            delivery: {
              date: null,
              days_in_transit: 13,
            },
            price: correiosService?.price,
            rate_type: correiosService?.rate_type,
            service_code: correiosService?.service_code,
            services: [firstMiles, ...correiosService.services],
          };

          responses.push(formattedData);
        }
      }
    } else {
      for (const iterator of correiosFreight) {
        const correiosService: NewRateShipmentReturnDTO = iterator;

        const formattedData: NewRateShipmentReturnDTO = {
          company,
          delivery: {
            date: null,
            days_in_transit: 13,
          },
          price: correiosService?.price,
          rate_type: correiosService?.rate_type,
          service_code: correiosService?.service_code,
          services: [...correiosService.services],
        };

        responses.push(formattedData);
      }
    }

    console.log(responses);

    let totalAmount = responses[0].services.find(
      (i) => i.name === 'Parcel Freight',
    ).items[0].price.value;
    const findActualDuties = responses[0].services.find(
      (i) => i.name === 'Duties & Taxes',
    );

    let findActualFirstMileFreight;
    let findActualFirstMilePickup;

    for (const data of responses[0].services) {
      if (data?.company?.name === firstMileCourier) {
        findActualFirstMileFreight = data?.items?.find(
          (i) => i.name === 'First Mile',
        );

        findActualFirstMilePickup = data?.items?.find(
          (i) => i.name === 'Pick-up',
        );
      }
    }

    const findDuties = order.services.find((i) => i.name === 'Duties & Taxes');

    if (
      findDuties?.items[0]?.selected ||
      findActualDuties?.items[0]?.required
    ) {
      totalAmount += findActualDuties.items[0].price.value;
    }

    if (firstMile?.selected) {
      totalAmount += findActualFirstMileFreight?.price?.value;

      // if (firstMilePickUp?.selected) {
      //   totalAmount += findActualFirstMilePickup?.price?.value;
      // }
    }

    return totalAmount;
  }

  public async packetRequest(
    quote: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ) {
    //   try {
    //     const correiosToken = await this.getCorreiosToken();
    //     const payload = this.correiosHelper.correiosPackageColletionPayload(
    //       quote,
    //       order,
    //       sender,
    //       recipient,
    //     );
    //     const { data } = await lastValueFrom(
    //       this.http.post<CorreiosPackageCollectionReturn>(
    //         `${this.CORREIOS_API_URL}/packet/v1/packages`,
    //         payload,
    //         {
    //           headers: {
    //             Authorization: `Bearer ${correiosToken}`,
    //           },
    //         },
    //       ),
    //     );
    //     return data?.packageResponseList;
    //   } catch (error) {
    //     throw error;
    //   }
    // }
    // public async shipment(
    //   quote: NewRateShipmentDTO,
    //   order: NewRateShipmentReturnDTO,
    //   sender: CheckoutParcelMember,
    //   recipient: CheckoutParcelMember,
    // ) {
    //   const package = await this.generateUnits(quote, order, sender, recipient);
    //   const labelData: ICorreiosLabelData = {
    //     contractNumber: '123456789',
    //     freightCost: 0,
    //     insuranceCost: 0,
    //     items: quote.whatsInside.data[0].items.map((i) => ({
    //       description: i.description,
    //       hsCode: i.hts_code,
    //       price: i.price.value,
    //       quantity: String(i.quantity),
    //       weight: '1',
    //     })),
    //     order: ,
    //     recipientAdditionalAddress,
    //     recipientCity,
    //     recipientName,
    //     recipientPostalCode,
    //     recipientState,
    //     recipientStreet,
    //     recipientStreetNumber,
    //     screeningCenter,
    //     senderAdditionalAddress,
    //     senderCity,
    //     senderCountry,
    //     senderName,
    //     senderPostalCode,
    //     senderState,
    //     senderStreet,
    //     senderStreetNumber,
    //     service,
    //     serviceType,
    //     totalCost,
    //     trackingCode,
    //   };
    //   const generateLabel = await createCorreiosLabel();
  }

  public async getTrackingNumbersBalance() {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.get<CorreiosTrackingNumberBalanceReturn>(
          `${this.CORREIOS_API_URL}/packet/v1/packages/tracking-numbers/balance`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      const available = data?.availableQuantity;

      if (available > 0) {
        return true;
      } else {
        throw new BadRequestException('Tracking codes not available!');
      }
    } catch (error) {
      throw error;
    }
  }

  public async getPackageInfo(trackingNumber: string) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.get<CorreiosPackageCollectionRequest>(
          `${this.CORREIOS_API_URL}/packet/v1/packages?trackingNumber=${trackingNumber}`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data.packageList;
    } catch (error) {
      throw error;
    }
  }

  public async generateUnits(
    rateData: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
    trackingCodes: [string],
  ) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const trackingNumbers = [...trackingCodes];
      const unitType = 1;
      const sequence = 1;

      const payload = this.correiosHelper.correiosUnitsPayload({
        originCountry: rateData?.whereFrom?.data?.country,
        serviceCode: order.service_code as any,
        trackingCodes,
        unitsPayload: [{ trackingNumbers, unitType, sequence }],
      });

      const { data } = await lastValueFrom(
        this.http.post<CorreiosUnitRequestReturn>(
          `${this.CORREIOS_API_URL}/packet/v1/units`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data?.unitResponseList;
    } catch (error) {
      throw error;
    }
  }

  public async getUnitInfo(dispatchNumber: number) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.get<CorreiosPackageCollectionRequest>(
          `${this.CORREIOS_API_URL}/packet/v1/units?dispatchNumber=${dispatchNumber}`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data.packageList;
    } catch (error) {
      throw error;
    }
  }

  public async cn38Request(dispatchNumbers: number[]) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const payload: CorreiosCn38Request = {
        dispatchNumbers: [...dispatchNumbers],
      };

      const { data } = await lastValueFrom(
        this.http.post<CorreiosCn38Return>(
          `${this.CORREIOS_API_URL}/packet/v1/cn38request`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data?.requestStatus;
    } catch (error) {
      throw error;
    }
  }

  public async cn38Info(requestId: string) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.get<CorreiosCn38Return>(
          `${this.CORREIOS_API_URL}/packet/v1/cn38request?requestId=${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data?.requestStatus;
    } catch (error) {
      throw error;
    }
  }

  public async confirmDepature(
    confirmDeparture: CorreiosConfirmDepartureRequest,
  ) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.put(
          `${this.CORREIOS_API_URL}/packet/v1/cn38request/departure`,
          confirmDeparture,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data?.requestStatus;
    } catch (error) {
      throw error;
    }
  }

  public async getAirline() {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.get(
          `${this.CORREIOS_API_URL}/packet/v1/cn38request/departure/airlines`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  public async cancelUnit(unitCode: string) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.delete(
          `${this.CORREIOS_API_URL}/packet/v1/units/${unitCode}`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  public async cancelDispatch(dispatchNumber: string) {
    try {
      const correiosToken = await this.getCorreiosToken();

      const { data } = await lastValueFrom(
        this.http.delete(
          `${this.CORREIOS_API_URL}/packet/v1/units/dispatch/${dispatchNumber}`,
          {
            headers: {
              Authorization: `Bearer ${correiosToken}`,
            },
          },
        ),
      );

      return data;
    } catch (error) {
      throw error;
    }
  }

  public async correiosSingleTracking(trackingCode: string) {
    try {
      const payload = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:res="http://resource.webservice.correios.com.br/">
      <soapenv:Header/>
        <soapenv:Body>
          <res:buscaEventos>
            <usuario>${this.CORREIOS_SOAP_USERNAME}</usuario>
            <senha>${this.CORREIOS_SOAP_PASSWORD}</senha>
            <tipo>${this.CORREIOS_SOAP_TYPE}</tipo>
            <resultado>${this.CORREIOS_SOAP_RESULT}</resultado>
            <lingua>${this.CORREIOS_SOAP_LANGUAGE}</lingua>
            <objetos>${trackingCode}</objetos>
          </res:buscaEventos>
        </soapenv:Body>
      </soapenv:Envelope>
      `;

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CORREIOS_SOAP_URL}/service/rastro/Rastro.wsdl`,
          payload,
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
          message: 'Unable to quote packages at Correios',
        });
      }

      return { data: parsedXML };
    } catch (error) {
      return error;
    }
  }

  public async correiosMultiTracking(trackingCodes: string[]) {
    try {
      const payload = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:res="http://resource.webservice.correios.com.br/">
      <soapenv:Header/>
        <soapenv:Body>
          <res:buscaEventos>
            <usuario>${this.CORREIOS_SOAP_USERNAME}</usuario>
            <senha>${this.CORREIOS_SOAP_PASSWORD}</senha>
            <tipo>${this.CORREIOS_SOAP_TYPE}</tipo>
            <resultado>${this.CORREIOS_SOAP_RESULT}</resultado>
            <lingua>${this.CORREIOS_SOAP_LANGUAGE}</lingua>
            <objetos>${trackingCodes.join('')}</objetos>
          </res:buscaEventos>
        </soapenv:Body>
      </soapenv:Envelope>
      `;

      const { data } = await lastValueFrom(
        this.http.post(
          `${this.CORREIOS_SOAP_URL}/service/rastro/Rastro.wsdl`,
          payload,
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
          message: 'Unable to quote packages at Correios',
        });
      }

      return { data: parsedXML };
    } catch (error) {
      return error;
    }
  }
}
