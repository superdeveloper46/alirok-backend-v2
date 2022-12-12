import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { differenceInDays, format, getDay, parse, parseISO } from 'date-fns';
import { NewCheckoutParcelBookingDTO } from 'src/app/checkout/dto/new-checkout.dto';
// import { AddressService } from '../../../../common/address/address.service';
import { CheckoutParcelMember } from '../../../checkout/interface/checkout.interface';
import { FormattersService } from '../../../misc/formatters/formatters.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnDeliveryDTO,
  NewRateShipmentReturnDTO,
  NewRateShipmentReturnPriceDTO,
  NewRateShipmentReturnServiceDTO,
} from '../../dto/newCouriers.dto';
import {
  USPSCreateUspsLabelOrPackage,
  USPSDomesticRateRequestXMLParsedPackagePostage,
  USPSDomesticRateRequestXMLParsedResponse,
  USPSInternationalRateRequestXMLParsedResponse,
  USPSInternationalRateRequestXMLParsedResponsePackageService,
} from '../interface/usps.interface';

@Injectable()
export class UspsHelperService {
  private userId: string;
  private testLabelUserId: string;
  private USPS_INTERNATIONAL_PERMIT_NUMBER: string;

  constructor(
    private readonly configService: ConfigService,
    // private readonly address: AddressService,
    private readonly formatter: FormattersService,
  ) {
    this.userId = this.configService.get('USPS_USER_ID');
    this.testLabelUserId = this.configService.get('USPS_EVS_LABEL_USER_ID');
    this.USPS_INTERNATIONAL_PERMIT_NUMBER = this.configService.get(
      'USPS_INTERNATIONAL_PERMIT_NUMBER',
    );
  }
  public formatUSPSQuoteResponse(
    body: NewRateShipmentDTO,
    response:
      | USPSDomesticRateRequestXMLParsedResponse
      | USPSInternationalRateRequestXMLParsedResponse,
  ): NewRateShipmentReturnDTO[] {
    const isDomestic = this.isDomestic({
      destination: body.whereTo.data.country,
      origin: body.whereFrom.data.country,
    });

    if (isDomestic) {
      return this.formatUSPSDomesticQuoteReponse(
        response as USPSDomesticRateRequestXMLParsedResponse,
        body.shipDate.data.date,
      );
    } else {
      return this.formatUSPSInternationalQuoteResponse(
        response as USPSInternationalRateRequestXMLParsedResponse,
        body.shipDate.data.date,
      );
    }
  }

  private formatUSPSInternationalQuoteResponse(
    response: USPSInternationalRateRequestXMLParsedResponse,
    shipDate: string,
  ) {
    const rates: NewRateShipmentReturnDTO[] = [];
    for (const iterator of response.IntlRateV2Response.Package) {
      iterator.Service.forEach((postage, index) => {
        rates.push(this.pushUSPSInternationalProduct(postage, shipDate));
      });
    }

    return rates;
  }

  private formatUSPSDomesticQuoteReponse(
    response: USPSDomesticRateRequestXMLParsedResponse,
    shipDate: string,
  ): NewRateShipmentReturnDTO[] {
    const rates: NewRateShipmentReturnDTO[] = [];

    for (const iterator of response.RateV4Response.Package) {
      iterator.Postage.forEach((postage, index) => {
        rates.push(this.pushUSPSDomesticProduct(postage, shipDate));
      });
    }

    return rates;
  }

  private pushUSPSInternationalProduct(
    data: USPSInternationalRateRequestXMLParsedResponsePackageService,
    shipDate: string,
  ) {
    const company: NewRateShipmentReturnDeliveryCarrierDTO = {
      logo_url: 'https://static.alirok.io/collections/logos/usps-logo.png',
      name: 'USPS',
      rating: 0,
      drop_off: [],
    };

    const delivery: NewRateShipmentReturnDeliveryDTO = {
      date: data?.SvcCommitments[0] ?? null,
      days_in_transit: null,
    };

    const price: NewRateShipmentReturnPriceDTO = {
      currency: 'USD',
      value: data?.CommercialPostage
        ? Number(data.CommercialPostage[0])
        : Number(data.Postage[0]),
    };

    const rate_type = data?.SvcDescription[0].split('&')[0];

    const service_code = data?.$?.ID;

    const services: NewRateShipmentReturnServiceDTO[] = [
      {
        company,
        items: [
          {
            description: 'Parcel Freight',
            name: 'Parcel Freight',
            price: price,
            required: true,
          },
        ],
        name: 'Parcel Freight',
      },
    ];

    return { company, delivery, price, rate_type, service_code, services };
  }

  private pushUSPSDomesticProduct(
    data: USPSDomesticRateRequestXMLParsedPackagePostage,
    shipDate: string,
  ): NewRateShipmentReturnDTO {
    try {
      let dayOfWeek = null;
      let daysInTransit = null;
      let location = null;

      if (data?.CommitmentDate) {
        const parsedDate = parse(
          data?.CommitmentDate[0],
          'yyyy-MM-dd',
          new Date(),
        );
        const parsedShipDate = parseISO(shipDate);
        const daysBetween = differenceInDays(parsedDate, parsedShipDate);

        dayOfWeek = getDay(parsedDate);
        daysInTransit = daysBetween === 0 ? 1 : daysBetween;
      }

      if (data?.Location) {
        location = data.Location.map((l) => ({
          company_name: l.Facility ? l.Facility[0] : null,
          phone_number: null,
          address: {
            street: l?.Street ? l.Street[0] : null,
            city: l?.City ? l.City[0] : null,
            state: l?.State ? l.State[0] : null,
            postal_code: l?.Zip ? l.Zip[0] : null,
            country: 'US',
          },
        }));
      }

      const company: NewRateShipmentReturnDeliveryCarrierDTO = {
        logo_url: 'https://static.alirok.io/collections/logos/usps-logo.png',
        name: 'USPS',
        rating: 0,
        drop_off: location,
      };

      const delivery: NewRateShipmentReturnDeliveryDTO = {
        date: data?.CommitmentDate ? data.CommitmentDate[0] : null,
        days_in_transit: daysInTransit ?? null,
      };

      const price: NewRateShipmentReturnPriceDTO = {
        currency: 'USD',
        value: data?.CommercialRate
          ? Number(data.CommercialRate[0])
          : Number(data.Rate[0]),
      };

      const rate_type = data?.MailService[0].split('&')[0];

      const service_code = data?.$?.CLASSID;

      const services: NewRateShipmentReturnServiceDTO[] = [
        {
          company,
          items: [
            {
              description: 'Parcel Freight',
              name: 'Parcel Freight',
              price: price,
              required: true,
            },
          ],
          name: 'Parcel Freight',
        },
      ];

      return {
        company,
        delivery,
        price,
        rate_type,
        service_code,
        services,
        category: 'parcel',
      };
    } catch (error) {
      return error;
    }
  }

  public validateUSPSQuoteRequest(body: NewRateShipmentDTO) {
    const error = false;
    const message = '';

    if (this.validateOriginCountry(body)) {
      return {
        error: true,
        message:
          'It is not possible to quote a USPS delivery when origin country is not US.',
      };
    }

    if (
      body.whatsInside.data.length > 1 ||
      body.whatsInside.data[0].pieces > 1
    ) {
      return {
        error: true,
        message: 'Only one package per shipment at USPS on Beta.',
      };
    }

    if (this.validateMaximumWeight(body)) {
      return {
        message: 'Package weight cannot exceed 70 pounds at USPS',
        error: true,
      };
    }

    if (this.validatePackagesAmount(body)) {
      return {
        message: 'Packages amout are limited to 25 per transaction',
        error: true,
      };
    }

    return { error, message };
  }

  private validateOriginCountry({ whereFrom }: NewRateShipmentDTO): boolean {
    let error = false;

    const isOriginInside = whereFrom.data.country === 'US';

    if (!isOriginInside) {
      error = true;
    }

    return error;
  }

  private validatePackagesAmount(body: NewRateShipmentDTO): boolean {
    let error = false;

    const isPackagesOverlimit = body?.whatsInside.data?.length > 25;

    if (isPackagesOverlimit) {
      error = true;
    }

    return error;
  }

  private validateMaximumWeight(body: NewRateShipmentDTO) {
    const maximumWeigthLbs = 70;

    let error = false;

    body?.whatsInside.data?.forEach((i) => {
      const weightIsLbs = i.weight.unit === 'lb';

      const weight = weightIsLbs
        ? i.weight
        : this.formatter.convertKgsToLbs(i.weight.value);

      if (Number(weight) > maximumWeigthLbs) {
        error = true;
      }
    });

    return error;
  }

  public formatUSPSQuoteXMLRequest(body: NewRateShipmentDTO) {
    const API = this.typeOfShippinApi(body);

    const isDomestic = this.isDomestic({
      origin: body.whereFrom.data.country,
      destination: body.whereTo.data.country,
    });

    const XML = isDomestic
      ? this.domesticShippingXml(body).replace(',', '\n\n').replace(',', '')
      : this.internationalShippingXml(body)
          .replace(',', '\n\n')
          .replace(',', '');

    return {
      XML,
      API,
    };
  }

  public formatUSPSPickUpAvailability(rateData: NewRateShipmentDTO) {
    const origin = rateData?.whereFrom?.data;

    const API = 'CarrierPickupAvailability';

    const XML = `<CarrierPickupAvailabilityRequest USERID="${this.userId}">

    <FirmName/>

    <SuiteOrApt>${origin?.additionalAddress}</SuiteOrApt>

    <Address2>${origin?.addressLine}</Address2>

    <Urbanization/>

    <City>${origin?.city}</City>

    <State>${origin?.state}</State>

    <ZIP5>${origin?.zipCode}</ZIP5>

    <ZIP4>${origin?.zipCode4}</ZIP4>

    </CarrierPickupAvailabilityRequest>`;

    return { XML, API };
  }

  public formatUSPSAddressValidation(
    rateData: NewRateShipmentDTO,
    who: 'sender' | 'receiver',
  ) {
    const XML = `<AddressValidateRequest USERID="${this.testLabelUserId}">

    <Revision>1</Revision>

    <Address ID="0">

    <Address1></Address1>

    <Address2>${
      who === 'receiver'
        ? rateData?.whereTo?.data?.streetNumber
        : rateData?.whereFrom?.data?.streetNumber
    } ${
      who === 'receiver'
        ? rateData?.whereTo?.data?.street
        : rateData?.whereFrom?.data?.street
    }</Address2>

    <City>${
      who === 'receiver'
        ? rateData?.whereTo?.data?.city
        : rateData?.whereFrom?.data?.city
    }</City>

    <State>${
      who === 'receiver'
        ? rateData?.whereTo?.data?.state
        : rateData?.whereFrom?.data?.state
    }</State>

    <Zip5>${
      who === 'receiver'
        ? rateData?.whereTo?.data?.zipCode
        : rateData?.whereFrom?.data?.zipCode
    }</Zip5>

    <Zip4/>

    </Address>

    </AddressValidateRequest>`;
    const API = 'Verify';
    return { API, XML: XML.replace(',', '\n\n') };
  }

  public formatUSPSShipmentXMLRequest(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    { firstMile, courier }: { firstMile?: boolean; courier?: string },
    serviceCode?: string,
  ) {
    const isDomestic = this.isDomestic({
      origin: body.origin.country,
      destination: body.destiny.country,
    });

    let API = '';

    if (isDomestic) {
      API = 'eVS';
    }

    if (!isDomestic) {
      if (serviceCode === '1') {
        API = 'eVSExpressMailIntl';
      }

      if (serviceCode === '2') {
        API = 'eVSPriorityMailIntl';
      }

      if (serviceCode === '12') {
        API = 'eVSGXGGetLabel';
      }
    }

    console.log('api name', API);

    const XML = isDomestic
      ? this.domesticLabelShippingXml(
          body,
          sender,
          recipient,
          {
            firstMile,
            courier,
          },
          serviceCode,
        ).replace(',', '\n\n')
      : this.internationalLabelShippingXml(
          body,
          sender,
          recipient,
          serviceCode,
        ).replace(',', '\n\n');

    return {
      XML,
      API,
    };
  }

  private domesticLabelShippingXml(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    { firstMile, courier }: { firstMile?: boolean; courier?: string },
    serviceCode = '77',
  ): string {
    const xml = `<eVSRequest  USERID="${this.testLabelUserId}">
    
        <Option/>

        <Revision></Revision>
    
        ${this.makeDomesticLabel(
          body,
          sender,
          recipient,
          {
            firstMile,
            courier,
          },
          serviceCode,
        ).toString()}
    
        </eVSRequest>`;

    return xml;
  }

  private internationalLabelShippingXml(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    serviceCode: string,
  ): string {
    let xml = '';

    if (serviceCode === '1') {
      xml = `<eVSExpressMailIntlRequest  USERID="${this.testLabelUserId}">
  
          <Revision>2</Revision>
      
          ${this.makeInternationalLabel(body, sender, recipient, serviceCode)
            .toString()
            .replace(',', '')}
      
          </eVSExpressMailIntlRequest>`;
      return xml;
    }

    if (serviceCode === '2') {
      xml = `<eVSPriorityMailIntlRequest  USERID="${this.testLabelUserId}">
  
          <Revision>2</Revision>
      
          ${this.makePriorityMailInternationalLabel(
            body,
            sender,
            recipient,
            serviceCode,
          )
            .toString()
            .replace(',', '')}
      
          </eVSPriorityMailIntlRequest>`;
      return xml;
    }

    if (serviceCode === '12') {
      xml = `<eVSExpressMailIntlRequest  USERID="${this.testLabelUserId}">
  
          <Revision>2</Revision>
      
          ${this.makeInternationalLabel(body, sender, recipient, serviceCode)
            .toString()
            .replace(',', '')}
      
          </eVSExpressMailIntlRequest>`;
      return xml;
    }
  }

  private makeInternationalLabel(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    serviceCode: string,
  ) {
    const weightIsLbs = body?.weightUnit === 'lb';

    const sizeInInches = body?.dimensionUnit === 'in';

    const shipDateFormatted = format(
      parseISO(body.shipDate as any),
      'yyyy-MM-dd',
    );
    return `<ImageParameters>

    <ImageParameter>4X6LABEL</ImageParameter>

    </ImageParameters>

    <FromFirstName>${sender?.full_name
      .split(' ')
      .slice(0, -1)
      .join(' ')
      .substring(0, 29)}</FromFirstName>

    <FromLastName>${sender?.full_name
      .split(' ')
      .slice(-1)
      .join(' ')
      .substring(0, 29)}</FromLastName>

    <FromAddress1/>

    <FromAddress2>${body.origin?.streetNumber} ${
      body.origin?.street
    }</FromAddress2>

    <FromCity>${body.origin?.city}</FromCity>

    <FromState>${body.origin?.state}</FromState>

    <FromZip5>${body.origin?.zipCode}</FromZip5>

    <FromZip4/>

    <FromPhone>${sender?.phone?.number?.substring(0, 10)}</FromPhone>

    <ToFirstName>${recipient?.full_name
      .split(' ')
      .slice(0, -1)
      .join(' ')
      .substring(0, 29)}</ToFirstName>

    <ToLastName>${recipient?.full_name
      .split(' ')
      .slice(-1)
      .join(' ')
      .substring(0, 29)}</ToLastName>

    <ToAddress1>${body.destiny?.streetNumber} ${
      body?.destiny?.street
    }</ToAddress1>

    <ToCity>${body.destiny?.city}</ToCity>

    <ToProvince>${body.destiny?.state}</ToProvince>

    <ToCountry>${this.formatter.getCountryName(
      body.destiny?.country,
    )}</ToCountry>

    <ToPostalCode>${body.destiny?.zipCode}</ToPostalCode>

    <ToPOBoxFlag>N</ToPOBoxFlag>

    <ToPhone>${recipient?.phone?.number}</ToPhone>

    <ToEmail>${recipient?.email}</ToEmail>

    <ImportersReferenceNumber>${recipient?.tax_id}</ImportersReferenceNumber>

    <NonDeliveryOption>RETURN</NonDeliveryOption>

    <Container>VARIABLE</Container>

    <ShippingContents>

      ${this.makeExportationItens(body).toString()}

    </ShippingContents>

    <GrossPounds>${
      weightIsLbs
        ? parseInt(body.weight)
        : parseInt(this.formatter.convertKgsToLbs(body.weight).toString())
    }</GrossPounds>

    <GrossOunces>${Math.round(
      weightIsLbs
        ? this.formatter.convertPoundsToOunces(body.weight)
        : this.formatter.convertPoundsToOunces(
            String(this.formatter.convertKgsToLbs(body.weight)),
          ),
    )}</GrossOunces>

    <ContentType>MERCHANDISE</ContentType>

    <Agreement>Y</Agreement>

    <ImageType>PDF</ImageType>

    <ImageLayout>ALLINONEFILE</ImageLayout>

    <LabelDate>${shipDateFormatted}</LabelDate>  
    
    <Length>${
      sizeInInches ? body.length : this.formatter.convertCmInInches(body.length)
    }</Length>

    <Width>${
      sizeInInches ? body.width : this.formatter.convertCmInInches(body.width)
    }</Width>

    <Height>${
      sizeInInches ? body.height : this.formatter.convertCmInInches(body.height)
    }</Height>
    
    <ActionCode>M0</ActionCode>

    <OptOutOfSPE>false</OptOutOfSPE>

    <PermitNumber>${this.USPS_INTERNATIONAL_PERMIT_NUMBER}</PermitNumber>

    <ImportersReferenceType>TAXCODE</ImportersReferenceType>

    <ImportersFaxNumber>${recipient?.phone?.number}</ImportersFaxNumber>

    <ImportersEmail>${recipient?.email}</ImportersEmail>

    <DestinationRateIndicator>N</DestinationRateIndicator>

    <MID/>

    <LogisticsManagerMID/>

    <CRID/>

    <VendorCode/>

    <VendorProductVersionNumber/>`;
  }

  private makePriorityMailInternationalLabel(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    serviceCode: string,
  ) {
    const weightIsLbs = body?.weightUnit === 'lb';

    const sizeInInches = body?.dimensionUnit === 'in';

    const shipDateFormatted = format(
      parseISO(body.shipDate as any),
      'yyyy-MM-dd',
    );
    return `<ImageParameters>

    <ImageParameter>4X6LABEL</ImageParameter>

    </ImageParameters>

    <FromFirstName>${sender?.full_name
      .split(' ')
      .slice(0, -1)
      .join(' ')
      .substring(0, 29)}</FromFirstName>

    <FromLastName>${sender?.full_name
      .split(' ')
      .slice(-1)
      .join(' ')
      .substring(0, 29)}</FromLastName>

    <FromAddress1/>

    <FromAddress2>${body.origin?.streetNumber} ${
      body.origin?.street
    }</FromAddress2>

    <FromCity>${body.origin?.city}</FromCity>

    <FromState>${body.origin?.state}</FromState>

    <FromZip5>${body.origin?.zipCode}</FromZip5>

    <FromZip4/>

    <FromPhone>${sender?.phone?.number?.substring(0, 10)}</FromPhone>

    <ToFirstName>${recipient?.full_name
      .split(' ')
      .slice(0, -1)
      .join(' ')
      .substring(0, 29)}</ToFirstName>

    <ToLastName>${recipient?.full_name
      .split(' ')
      .slice(-1)
      .join(' ')
      .substring(0, 29)}</ToLastName>

    <ToAddress1>${body.destiny?.streetNumber} ${
      body?.destiny?.street
    }</ToAddress1>

    <ToCity>${body.destiny?.city}</ToCity>

    <ToProvince>${body.destiny?.state}</ToProvince>

    <ToCountry>${this.formatter.getCountryName(
      body.destiny?.country,
    )}</ToCountry>

    <ToPostalCode>${body.destiny?.zipCode}</ToPostalCode>

    <ToPOBoxFlag>N</ToPOBoxFlag>

    <ToPhone>${recipient?.phone?.number}</ToPhone>

    <ToEmail>${recipient?.email}</ToEmail>

    <ImportersReferenceNumber>${recipient?.tax_id}</ImportersReferenceNumber>

    <NonDeliveryOption>RETURN</NonDeliveryOption>

    <Container>VARIABLE</Container>

    <ShippingContents>

      ${this.makeExportationItens(body).toString()}

    </ShippingContents>

    <GrossPounds>${
      weightIsLbs
        ? parseInt(body.weight)
        : parseInt(this.formatter.convertKgsToLbs(body.weight).toString())
    }</GrossPounds>

    <GrossOunces>${Math.round(
      weightIsLbs
        ? this.formatter.convertPoundsToOunces(body.weight)
        : this.formatter.convertPoundsToOunces(
            String(this.formatter.convertKgsToLbs(body.weight)),
          ),
    )}</GrossOunces>

    <ContentType>MERCHANDISE</ContentType>

    <Agreement>Y</Agreement>

    <ImageType>PDF</ImageType>

    <ImageLayout>ALLINONEFILE</ImageLayout>

    <LabelDate>${shipDateFormatted}</LabelDate>  
    
    <Length>${
      sizeInInches ? body.length : this.formatter.convertCmInInches(body.length)
    }</Length>

    <Width>${
      sizeInInches ? body.width : this.formatter.convertCmInInches(body.width)
    }</Width>

    <Height>${
      sizeInInches ? body.height : this.formatter.convertCmInInches(body.height)
    }</Height>
    
    <ActionCode>M0</ActionCode>

    <OptOutOfSPE>false</OptOutOfSPE>

    <ImportersReferenceType>TAXCODE</ImportersReferenceType>

    <ImportersFaxNumber>${recipient?.phone?.number}</ImportersFaxNumber>

    <ImportersEmail>${recipient?.email}</ImportersEmail>

    <DestinationRateIndicator>N</DestinationRateIndicator>

    <MID/>

    <LogisticsManagerMID/>

    <CRID/>

    <VendorCode/>

    <VendorProductVersionNumber/>`;
  }

  private makeGXGInternationalLabel(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    serviceCode: string,
  ) {
    const weightIsLbs = body?.weightUnit === 'lb';

    const sizeInInches = body?.dimensionUnit === 'in';

    const shipDateFormatted = format(
      parseISO(body.shipDate as any),
      'yyyy-MM-dd',
    );
    return `<ImageParameters>

    <ImageParameter>4X6LABEL</ImageParameter>

    </ImageParameters>

    <FromFirstName>${sender?.full_name
      .split(' ')
      .slice(0, -1)
      .join(' ')
      .substring(0, 29)}</FromFirstName>

    <FromLastName>${sender?.full_name
      .split(' ')
      .slice(-1)
      .join(' ')
      .substring(0, 29)}</FromLastName>

    <FromAddress1/>

    <FromAddress2>${body.origin?.streetNumber} ${
      body.origin?.street
    }</FromAddress2>

    <FromCity>${body.origin?.city}</FromCity>

    <FromState>${body.origin?.state}</FromState>

    <FromZip5>${body.origin?.zipCode}</FromZip5>

    <FromZip4/>

    <FromPhone>${sender?.phone?.number?.substring(0, 10)}</FromPhone>

    <ToFirstName>${recipient?.full_name
      .split(' ')
      .slice(0, -1)
      .join(' ')
      .substring(0, 29)}</ToFirstName>

    <ToLastName>${recipient?.full_name
      .split(' ')
      .slice(-1)
      .join(' ')
      .substring(0, 29)}</ToLastName>

    <ToAddress1>${body.destiny?.streetNumber} ${
      body?.destiny?.street
    }</ToAddress1>

    <ToCity>${body.destiny?.city}</ToCity>

    <ToProvince>${body.destiny?.state}</ToProvince>

    <ToCountry>${this.formatter.getCountryName(
      body.destiny?.country,
    )}</ToCountry>

    <ToPostalCode>${body.destiny?.zipCode}</ToPostalCode>

    <ToPOBoxFlag>N</ToPOBoxFlag>

    <ToPhone>${recipient?.phone?.number}</ToPhone>

    <ToEmail>${recipient?.email}</ToEmail>

    <ImportersReferenceNumber>${recipient?.tax_id}</ImportersReferenceNumber>

    <NonDeliveryOption>RETURN</NonDeliveryOption>

    <Container>VARIABLE</Container>

    <ShippingContents>

      ${this.makeExportationItens(body).toString()}

    </ShippingContents>

    <GrossPounds>${
      weightIsLbs
        ? parseInt(body.weight)
        : parseInt(this.formatter.convertKgsToLbs(body.weight).toString())
    }</GrossPounds>

    <GrossOunces>${Math.round(
      weightIsLbs
        ? this.formatter.convertPoundsToOunces(body.weight)
        : this.formatter.convertPoundsToOunces(
            String(this.formatter.convertKgsToLbs(body.weight)),
          ),
    )}</GrossOunces>

    <ContentType>MERCHANDISE</ContentType>

    <Agreement>Y</Agreement>

    <ImageType>PDF</ImageType>

    <ImageLayout>ALLINONEFILE</ImageLayout>

    <LabelDate>${shipDateFormatted}</LabelDate>  
    
    <Length>${
      sizeInInches ? body.length : this.formatter.convertCmInInches(body.length)
    }</Length>

    <Width>${
      sizeInInches ? body.width : this.formatter.convertCmInInches(body.width)
    }</Width>

    <Height>${
      sizeInInches ? body.height : this.formatter.convertCmInInches(body.height)
    }</Height>
    
    <ActionCode>M0</ActionCode>

    <OptOutOfSPE>false</OptOutOfSPE>

    <ImportersReferenceType>TAXCODE</ImportersReferenceType>

    <ImportersFaxNumber>${recipient?.phone?.number}</ImportersFaxNumber>

    <ImportersEmail>${recipient?.email}</ImportersEmail>

    <DestinationRateIndicator>N</DestinationRateIndicator>

    <MID/>

    <LogisticsManagerMID/>

    <CRID/>

    <VendorCode/>

    <VendorProductVersionNumber/>`;
  }

  private getUspsServiceType(serviceCode: string | number): string {
    switch (serviceCode.toString()) {
      case '1':
        return 'PRIORITY';
        break;
      case '16':
        return 'PRIORITY';
        break;
      case '3':
        return 'PRIORITY EXPRESS';
        break;
      case '13':
        return 'PRIORITY EXPRESS';
        break;
      case '77':
        return 'PARCEL SELECT GROUND';
        break;
      case '53':
        return 'FIRST CLASS';
        break;
      case '0':
        return 'FIRST CLASS';
        break;

      default:
        throw new BadRequestException('No services found!');
        break;
    }
  }

  private makeDomesticLabel(
    body: USPSCreateUspsLabelOrPackage,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
    { firstMile, courier }: { firstMile?: boolean; courier?: string },
    serviceCode?: string,
  ) {
    try {
      const weightIsLbs = body?.weightUnit === 'lb';

      const sizeInInches = body?.dimensionUnit === 'in';

      const shipDateFormatted = format(
        parseISO(body.shipDate as any),
        'yyyy-MM-dd',
      );

      return `<ImageParameters>
  
      <ImageParameter>4x6LABELP</ImageParameter>
  
      <XCoordinate>0</XCoordinate>
  
      <YCoordinate>900</YCoordinate>
  
      <LabelSequence>
  
      <PackageNumber>${body.actualPackage}</PackageNumber>
  
      <TotalPackages>${body.totalPackages}</TotalPackages>
  
      </LabelSequence>
  
      </ImageParameters>
  
      <FromName>${sender?.full_name}</FromName>
  
      <FromFirm>${sender?.company_name ?? sender?.full_name}</FromFirm>
  
      <FromAddress1>${
        body.origin?.additionalAddress
          ? body.origin?.additionalAddress
          : body?.origin?.streetNumber
      }</FromAddress1>
  
      <FromAddress2>${body.origin?.addressLine}</FromAddress2>
  
      <FromCity>${body.origin?.city}</FromCity>
  
      <FromState>${body.origin?.state}</FromState>
  
      <FromZip5>${body.origin?.zipCode}</FromZip5>

      <FromZip4/>
  
      <FromPhone>${sender?.phone?.number?.substring(0, 10)}</FromPhone>
  
      <AllowNonCleansedOriginAddr>TRUE</AllowNonCleansedOriginAddr>
  
      <ToName>${recipient?.full_name}</ToName>
  
      <ToFirm>${
        firstMile ? courier : recipient?.company_name ?? recipient?.full_name
      }</ToFirm>
  
      <ToAddress1>${
        body.destiny?.additionalAddress
          ? body.destiny?.additionalAddress
          : body?.destiny?.streetNumber
      }</ToAddress1>
  
      <ToAddress2>${body.destiny?.addressLine}</ToAddress2>
  
      <ToCity>${body.destiny.city}</ToCity>
  
      <ToState>${body.destiny.state}</ToState>
  
      <ToZip5>${body.destiny.zipCode}</ToZip5>  
  
      <ToZip4/>
  
      <ToPhone>${recipient?.phone?.number?.substring(0, 10)}</ToPhone>
  
      <AllowNonCleansedDestAddr>TRUE</AllowNonCleansedDestAddr>
  
      <WeightInOunces>${
        weightIsLbs
          ? this.formatter.convertPoundsToOunces(body.weight)
          : this.formatter.convertPoundsToOunces(
              String(this.formatter.convertKgsToLbs(body.weight)),
            )
      }</WeightInOunces>
  
      <ServiceType>${this.getUspsServiceType(serviceCode)}</ServiceType>
  
      <Container>VARIABLE</Container>
  
      <Width>${
        sizeInInches ? body.width : this.formatter.convertCmInInches(body.width)
      }</Width>
      
      <Length>${
        sizeInInches
          ? body.length
          : this.formatter.convertCmInInches(body.length)
      }</Length>
  
      <Height>${
        sizeInInches
          ? body.height
          : this.formatter.convertCmInInches(body.height)
      }</Height>
  
      <Machinable/>
  
      <ShipDate>${shipDateFormatted}</ShipDate>
  
      <ReceiptOption>SEPARATE PAGE</ReceiptOption>
  
      <ImageType>${firstMile ? 'TIF' : 'PDF'}</ImageType>
  
      <ReturnCommitments>True</ReturnCommitments>
      `;
    } catch (error) {
      throw error;
    }
  }

  private domesticShippingXml(body: NewRateShipmentDTO): string {
    const xml = `<RateV4Request USERID="${this.userId}">
    
        <Revision>2</Revision>
    
        ${this.makeDomesticPackage(body).toString()}
    
        </RateV4Request>`;
    return xml;
  }

  private internationalShippingXml(body: NewRateShipmentDTO): string {
    const xml = `<IntlRateV2Request USERID="${this.userId}">
    
        <Revision>2</Revision>
    
        ${this.makeInternationalPackage(body).toString()}
    
        </IntlRateV2Request>`;

    return xml;
  }

  private typeOfShippinApi(body: NewRateShipmentDTO): string {
    return body?.whereFrom.data?.country === body?.whereTo.data?.country
      ? 'RateV4'
      : 'IntlRateV2';
  }

  private isDomestic({
    origin,
    destination,
  }: {
    origin: string;
    destination: string;
  }): boolean {
    return destination === origin;
  }

  private makeExportationItens(body: USPSCreateUspsLabelOrPackage) {
    const weightIsLbs = body?.weightUnit === 'lb';

    const itemsQtd = body.whatsInside?.items?.length;

    const items = body.whatsInside.items.map(
      (i, index) =>
        `<ItemDetail>

          <Description>${i.description}</Description>

          <Quantity>${i.quantity}</Quantity>

          <Value>${this.formatter.roundAmount(
            parseFloat(String(i.price.value)),
          )}</Value>

          <NetPounds>${
            weightIsLbs
              ? this.formatter
                  .toNetWeight(
                    parseInt((parseFloat(body.weight) / itemsQtd).toString()),
                  )
                  .toFixed()
              : this.formatter
                  .toNetWeight(
                    parseInt(
                      (
                        this.formatter.convertKgsToLbs(body.weight) / itemsQtd
                      ).toString(),
                    ),
                  )
                  .toFixed()
          }</NetPounds>
    
          <NetOunces>${
            weightIsLbs
              ? this.formatter.toNetWeight(
                  this.formatter.convertPoundsToOunces(body.weight) / itemsQtd,
                )
              : this.formatter.toNetWeight(
                  this.formatter.convertPoundsToOunces(
                    String(this.formatter.convertKgsToLbs(body.weight)),
                  ) / itemsQtd,
                )
          }</NetOunces>

          <HSTariffNumber>${i.hts_code.replace('.', '')}</HSTariffNumber>

          <CountryOfOrigin>UNITED STATES</CountryOfOrigin>

        </ItemDetail>`,
    );

    return items;
  }

  private makeDomesticPackage(body: NewRateShipmentDTO) {
    const packageOrLetter = body?.type === 'package' ? 'PACKAGE' : 'LETTER';

    const firstClassPackageOrLetter =
      body?.type === 'package' ? 'PACKAGE SERVICE' : 'LETTER';

    const shipDate = parseISO(body?.shipDate.data.date);

    const shipDateFormatted = format(shipDate, 'yyyy-MM-dd');

    return this.formatQuotePackages(body).map((i, index) => {
      const weightIsLbs = i.weightUnit === 'lb';

      const sizeInInches = i.dimensionUnit === 'in';

      const pack = `<Package ID="${index + 1}">
    
        <Service>PLUS</Service>
  
        <ZipOrigination>${body.whereFrom.data.zipCode}</ZipOrigination>
  
        <ZipDestination>${body.whereTo.data.zipCode}</ZipDestination>
  
        <Pounds>${
          weightIsLbs ? i.weight : this.formatter.convertKgsToLbs(i.weight)
        }</Pounds>
  
        <Ounces>${
          weightIsLbs
            ? this.formatter.convertPoundsToOunces(i.weight)
            : this.formatter.convertPoundsToOunces(
                String(this.formatter.convertKgsToLbs(i.weight)),
              )
        }</Ounces>
  
        <Container></Container>
  
        <Width>${
          sizeInInches ? i.width : this.formatter.convertCmInInches(i.width)
        }</Width>
  
        <Length>${
          sizeInInches ? i.length : this.formatter.convertCmInInches(i.length)
        }</Length>
  
        <Height>${
          sizeInInches ? i.height : this.formatter.convertCmInInches(i.height)
        }</Height>
  
        <Girth></Girth>
  
        <Machinable>TRUE</Machinable>
  
        <ReturnLocations>true</ReturnLocations>
  
        <ShipDate>${shipDateFormatted}</ShipDate>
  
        </Package>`;

      return pack;
    });
  }

  public formatQuotePackages(
    quote: NewRateShipmentDTO,
  ): USPSCreateUspsLabelOrPackage[] {
    const formattedPackages = quote.whatsInside.data.map((pkg, index) =>
      Array(Number(pkg.pieces)).fill({
        totalPackages: pkg.pieces,
        actualPackage: index + 1,
        weight: pkg.weight.value,
        width: pkg.dimensions.width,
        length: pkg.dimensions.length,
        height: pkg.dimensions.height,
        shipDate: quote.shipDate.data.date,
        origin: quote.whereFrom.data,
        destiny: quote.whereTo.data,
        weightUnit: pkg.weight.unit,
        dimensionUnit: pkg.dimensions.unit,
        whatsInside: pkg,
      }),
    );

    return [].concat(...formattedPackages.map((i) => i));
  }

  public formatLabelPackages(
    labelData: NewRateShipmentDTO,
  ): USPSCreateUspsLabelOrPackage[] {
    const formattedPackages: USPSCreateUspsLabelOrPackage[][] =
      labelData.whatsInside.data.map((pkg, index) =>
        Array(Number(pkg.pieces)).fill({
          totalPackages: pkg.pieces,
          actualPackage: index + 1,
          weight: pkg.weight.unit,
          width: pkg.dimensions.width,
          length: pkg.dimensions.length,
          height: pkg.dimensions.height,
          shipDate: labelData.shipDate.data.date,
          origin: labelData.whereFrom.data,
          destiny: labelData.whereTo.data,
        }),
      );

    return [].concat(...formattedPackages.map((i) => i));
  }

  private makeInternationalPackage(body: NewRateShipmentDTO) {
    const packageOrLetter = body?.type === 'package' ? 'PACKAGE' : 'LETTER';

    return body?.whatsInside?.data.map((i, index) => {
      const weightIsLbs = i.weight.unit === 'lb';

      const sizeInInches = i.dimensions.unit === 'in';

      const pack = `<Package ID="${index}">
    
        <Pounds>${
          weightIsLbs
            ? i.weight.value
            : this.formatter.convertKgsToLbs(i.weight.value)
        }</Pounds>

        <Ounces>${
          weightIsLbs
            ? this.formatter.convertPoundsToOunces(i.weight.value)
            : this.formatter.convertPoundsToOunces(
                String(this.formatter.convertKgsToLbs(i.weight.value)),
              )
        }</Ounces>

      <Machinable>True</Machinable>

      <MailType>ALL</MailType>

      <GXG>

        <POBoxFlag>N</POBoxFlag>
      
        <GiftFlag>N</GiftFlag>
      
      </GXG>

      <ValueOfContents>${i.items
        .reduce((acc, next) => (acc = next.price.value * next.quantity), 0)
        .toFixed(2)}</ValueOfContents>

      <Country>${this.formatter.getCountryName(
        body.whereTo.data.country,
      )}</Country>

      <Container>VARIABLE</Container>

      <Width>${
        sizeInInches
          ? i.dimensions.width
          : this.formatter.convertCmInInches(i.dimensions.width)
      }</Width>

      <Length>${
        sizeInInches
          ? i.dimensions.length
          : this.formatter.convertCmInInches(i.dimensions.length)
      }</Length>

      <Height>${
        sizeInInches
          ? i.dimensions.height
          : this.formatter.convertCmInInches(i.dimensions.height)
      }</Height>

      <OriginZip>${body.whereFrom.data.zipCode}</OriginZip>

      <CommercialFlag>Y</CommercialFlag>

      <CommercialPlusFlag>Y</CommercialPlusFlag>

      <AcceptanceDateTime>${body.shipDate.data.date}</AcceptanceDateTime>

      <DestinationPostalCode>${
        body.whereTo.data.zipCode
      }</DestinationPostalCode>

      </Package>`;

      return pack;
    });
  }

  public formatCommitmentServices(
    rateReturn: NewRateShipmentReturnDTO,
    originZipCode: string,
    desintyZipCode: string,
    shipDate: string,
  ) {
    const serviceName = rateReturn?.rate_type;
    let mailClass = '0';

    switch (serviceName) {
      case 'Priority Mail Express 1-Day':
        mailClass = '1';
        break;
      case 'Priority Mail 2-Day':
        mailClass = '2';
        break;
      case 'Priority Mail Express International':
        mailClass = '1';
        break;

      default:
        break;
    }

    const XML = `<SDCGetLocationsRequest USERID="${this.userId}">

    <MailClass>${mailClass}</MailClass>
    
    <OriginZIP>${originZipCode}</OriginZIP>
    
    <DestinationZIP>${desintyZipCode}</DestinationZIP>
    
    <AcceptDate>${shipDate}</AcceptDate>
    
    <AcceptTime>1400</AcceptTime>

    <NonEMDetail>False</NonEMDetail>
    
    </SDCGetLocationsRequest>`;

    const API = 'SDCGetLocations';

    return {
      XML,
      API,
    };
  }

  public formatSchedulePickup(
    origin: NewRateShipmentDTO['whereTo']['data'],
    sender: CheckoutParcelMember,
    serviceCode: string,
  ) {
    const API = 'SDCGetLocations';
    const XML = `<CarrierPickupScheduleRequest USERID="${this.userId}">

  <FirstName>${sender.firstName}</FirstName>

  <LastName>${sender.lastName}</LastName>

  <FirmName/>

  <SuiteOrApt>${origin?.additionalAddress}</SuiteOrApt>

  <Address2>${origin?.addressLine}</Address2>

  <Urbanization/>

  <City>${origin?.city}</City>

  <State>${origin?.state}</State>

  <ZIP5>${origin?.zipCode}</ZIP5>

  <ZIP4>${origin?.zipCode4}</ZIP4>

  <Phone>${sender?.phone?.number?.substring(0, 10)}</Phone>

  <Package>

  <ServiceType>${this.getUspsServiceType(serviceCode)}</ServiceType>

  <Count>1</Count>

  </Package>

  </CarrierPickupScheduleRequest>`;

    return {
      API,
      XML,
    };
  }

  public formatCancelPickupPayload(confirmationNumber: string) {
    const API = 'eVSCancel';
    const XML = `<eVSCancelRequest USERID="${this.userId}">

    <BarcodeNumber>${confirmationNumber}</BarcodeNumber>
    
    </eVSCancelRequest> `;

    return { API, XML };
  }
}
