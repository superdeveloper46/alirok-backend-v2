import { parcel_bookings } from '@generated/client';
import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import { NewCreateParcelBookingActorDTO } from 'src/app/parcel-booking/dto/new-parcel-booking.dto';
import {
  NewRateShipmentDTO,
  NewRateShipmentFiltersDTO,
  NewRateShipmentReturnDTO,
} from '../dto/newCouriers.dto';
import { GltHelperService } from './glt-helper/glt-helper.service';
import {
  IGLTAuthTokenResponse,
  IGLTCreateLoadResponse,
  IGLTLoadDataResponse,
  IGLTLoadStatusResponse,
  IGLTQuoteResponse,
  IGLTTender,
  IGLTTenderResponse,
} from './interface';
import { parseString } from 'xml2js';

@Injectable()
export class GltService {
  private GLT_API_URL: string;
  private GLT_API_USER: string;
  private GLT_API_PASSWORD: string;
  private GLT_ORG_ID: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly gltHelper: GltHelperService,
    private readonly http: HttpService,
  ) {
    this.GLT_API_URL = configService.get('GLT_API_URL');
    this.GLT_API_USER = configService.get('GLT_API_USER');
    this.GLT_API_PASSWORD = configService.get('GLT_API_PASSWORD');
    this.GLT_ORG_ID = configService.get('GLT_ORG_ID');
  }

  private async generateToken() {
    try {
      const payload = this.gltHelper.authPayload(
        this.GLT_API_USER,
        this.GLT_API_PASSWORD,
        this.GLT_ORG_ID,
      );

      console.log('glt auth payload', JSON.stringify(payload));

      const { data } = await lastValueFrom(
        this.http.post<IGLTAuthTokenResponse>(
          `${this.GLT_API_URL}/services/Soap/c/42.0`,
          `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:enterprise.soap.sforce.com">
          <soapenv:Header>
              <urn:LoginScopeHeader>
                  <urn:organizationId>00D7A0000000rYO</urn:organizationId>
              </urn:LoginScopeHeader>
          </soapenv:Header>
          <soapenv:Body>
              <urn:login>
                  <urn:username>api@alirok.com</urn:username>
                  <urn:password>Glt2022*</urn:password>
              </urn:login>
          </soapenv:Body>
      </soapenv:Envelope>`,
          {
            headers: {
              'Content-Type': 'text/xml',
              SOAPAction: '',
            },
          },
        ),
      );

      console.log('glt raw token', JSON.stringify(data));

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
          message: `Unable to generate token at GLT`,
        });
      }

      console.log(
        'generate token response formatted',
        JSON.stringify(parsedXML),
      );

      const token =
        data?.['soapenv:Envelope']?.['soapenv:Body']?.[0]?.loginResponse?.[0]
          ?.result?.[0]?.sessionId?.[0];

      console.log('token', JSON.stringify(token));

      return token;
    } catch (error) {
      console.log('error generateToken', JSON.stringify(error));
      throw error;
    }
  }

  async shippingData(loadId: string) {
    const { data } = await lastValueFrom(
      this.http.get<IGLTLoadDataResponse>(
        `${this.GLT_API_URL}/services/apexrest/rtms/tmsloadservice/${loadId}`,
        {
          headers: {
            Authorization: `Bearer ${await this.generateToken()}`,
          },
        },
      ),
    );

    return data;
  }

  async rate(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ): Promise<any> {
    try {
      const buildPayload = this.gltHelper.loadPayload(rateData);

      console.log('load payload', JSON.stringify(buildPayload));

      const { data: createLoadData } = await lastValueFrom(
        this.http.post<IGLTCreateLoadResponse>(
          `${this.GLT_API_URL}/services/apexrest/rtms/tmsloadservice`,
          buildPayload,
          {
            headers: {
              Authorization: `Bearer ${await this.generateToken()}`,
            },
          },
        ),
      );

      console.log('load response', JSON.stringify(createLoadData));

      const loadId = createLoadData?.loadId;

      console.log('load id', loadId);

      const { data: quoteData } = await lastValueFrom(
        this.http.get<IGLTQuoteResponse[]>(
          `${this.GLT_API_URL}/services/apexrest/rtms/tmsquoteservice/${loadId}`,
          {
            headers: {
              Authorization: `Bearer ${await this.generateToken()}`,
            },
          },
        ),
      );

      console.log('quote response', JSON.stringify(quoteData));

      const formattedQuotes = this.gltHelper.formatQuoteResponse(
        quoteData,
        loadId,
        createLoadData.loadNumber,
        createLoadData.trackingNumber,
      );

      console.log('formattedQuotes response', JSON.stringify(quoteData));

      return { data: { formattedQuotes } };
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async rateWithType(
    rateData: NewRateShipmentDTO,
    serviceCode: { loadId: string; quoteId: string; loadName: string },
    order: NewRateShipmentReturnDTO,
    sender: NewCreateParcelBookingActorDTO,
    receiver: NewCreateParcelBookingActorDTO,
  ) {
    const buildPayload = this.gltHelper.loadPayload(
      rateData,
      serviceCode.loadId,
      serviceCode.loadName,
    );

    const updatedPayloadWithContactData =
      this.gltHelper.updatePayloadWithCustomerData({
        customerData: {
          sender: {
            email: sender.email,
            firstName: sender.firstName,
            lastName: sender.lastName,
            phone: sender.phone.number,
          },
          receiver: {
            email: receiver.email,
            firstName: receiver.firstName,
            lastName: receiver.lastName,
            phone: receiver.phone.number,
          },
        },
        loadData: buildPayload,
      });

    const { data: createLoadData } = await lastValueFrom(
      this.http.post<IGLTCreateLoadResponse>(
        `${this.GLT_API_URL}/services/apexrest/rtms/tmsloadservice`,
        updatedPayloadWithContactData,
        {
          headers: {
            Authorization: `Bearer ${await this.generateToken()}`,
          },
        },
      ),
    );

    const loadId = createLoadData?.loadId;

    const { data: quoteData } = await lastValueFrom(
      this.http.get<IGLTQuoteResponse[]>(
        `${this.GLT_API_URL}/services/apexrest/rtms/tmsquoteservice/${loadId}`,
        {
          headers: {
            Authorization: `Bearer ${await this.generateToken()}`,
          },
        },
      ),
    );

    const formattedQuotes = this.gltHelper.formatQuoteResponse(quoteData);

    return formattedQuotes.filter((i) => i.service_code === serviceCode);
  }

  async shipping(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    try {
      const order: NewRateShipmentReturnDTO = shipmentBody.metadata as any;

      const shippingBody: IGLTTender = {
        txn: {
          loadId: order.service_code.loadId,
          quoteId: order.service_code.quoteId,
        },
      };

      const { data } = await lastValueFrom(
        this.http.post<IGLTTenderResponse>(
          `${this.GLT_API_URL}/services/apexrest/rtms/tmstenderservice`,
          shippingBody,
          {
            headers: {
              Authorization: `Bearer ${await this.generateToken()}`,
            },
          },
        ),
      );

      if (!data.tenderSuccessful) {
        throw new BadRequestException('GLT Tender Failed');
      }

      return {
        tracking_number: order.service_code.tracking,
      };
    } catch (error) {
      throw error;
    }
  }

  async tracking(loadId: string) {
    try {
      const { data: loadData } = await lastValueFrom(
        this.http.get<IGLTLoadStatusResponse[]>(
          `${this.GLT_API_URL}/services/apexrest/rtms/tmsloadstatusservice/${loadId}`,
          {
            headers: {
              Authorization: `Bearer ${await this.generateToken()}`,
            },
          },
        ),
      );

      const originEvent = loadData[0].stopList[0];
      const recipientEvent = loadData[0].stopList[1];

      const events = [
        {
          date: originEvent.departureDate,
          description: originEvent.stopStatus,
          status: originEvent.stopStatus,
          rawStatus: originEvent.stopStatus,
        },
        {
          date: recipientEvent.departureDate,
          description: recipientEvent.stopStatus,
          status: recipientEvent.stopStatus,
          rawStatus: recipientEvent.stopStatus,
        },
      ];

      return { events: events ?? [] };
    } catch (error) {
      return error;
    }
  }
}
