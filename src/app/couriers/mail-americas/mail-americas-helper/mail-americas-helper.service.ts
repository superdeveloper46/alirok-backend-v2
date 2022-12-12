import { parcel_bookings } from '@generated/client';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import {
  NewRateShipmentReturnDTO,
  NewRateShipmentDTO,
  NewRateShipmentReturnServiceDTO,
  NewRateShipmentWhatsInsideDataDTO,
  NewRateShipmentReturnDeliveryCarrierDTO,
  NewRateShipmentReturnServiceServiceItemDTO,
  NewRateShipmentReturnDropOffLocationDTO,
} from '../../dto/newCouriers.dto';
import {
  IMailAmericasShippingPayload,
  IMailAmericasShippingServices,
} from '../interface/mail-americas.interface';
import { v4 as uuidv4 } from 'uuid';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import { parseISO } from 'date-fns';
import { UspsService } from '../../usps/usps.service';
import { UpsService } from '../../ups/ups.service';
import { FedexService } from '../../fedex/fedex.service';
import { SkyPostalLabelsMerge } from '../../sky-postal/interface/sky-postal.interface';
import { PDFDocument } from 'pdf-lib';
import { DocumentHelperService } from 'src/app/misc/document-helper/document-helper.service';
import { getFirstMileInstructionsLabel } from 'src/app/misc/instructions-fm-pdf';

const availableCountries = ['BR', 'CL', 'AR', 'CO', 'MX', 'PE'];

@Injectable()
export class MailAmericasHelperService {
  private MAIL_AMERICAS_TOKEN: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly formatter: FormattersService,
    private readonly uspsService: UspsService,
    private readonly upsService: UpsService,
    private readonly fedexService: FedexService,
    private readonly documentHelper: DocumentHelperService,
  ) {
    this.MAIL_AMERICAS_TOKEN = configService.get('MAIL_AMERICAS_TOKEN');
  }

  public rateWithType(
    order: NewRateShipmentReturnDTO,
    quote: NewRateShipmentDTO,
  ) {
    const serviceCodeChoosed = order.service_code;

    const newRating = this.ratingPayload(quote);

    const selectedRating = newRating.find(
      (i) => i.service_code === serviceCodeChoosed,
    );

    if (!selectedRating) {
      throw new BadRequestException('Mail Americas quote not found.');
    }

    const parcelFreightService = selectedRating.services.find(
      (i) => i.name === 'Parcel Freight',
    );

    const dutiesService = selectedRating.services.find(
      (i) => i.name === 'Duties & Taxes',
    );

    const newParcelFreight = parcelFreightService.items.find(
      (i) => i.name === 'Parcel Freight',
    );

    const newDuties = dutiesService?.items?.find(
      (i) => i?.name === 'Duties & Taxes',
    );

    const totalShipmentCost =
      newParcelFreight.price.value +
      (newDuties?.required || newDuties?.selected ? newDuties.price.value : 0);

    return totalShipmentCost;
  }

  public ratingPayload(
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    if (
      ratePayload.whereFrom.data.country !== 'US' ||
      !availableCountries.includes(ratePayload.whereTo.data.country)
    ) {
      return [];
    }

    const company: NewRateShipmentReturnDTO['company'] = {
      logo_url:
        'https://static.alirok.io/collections/logos/mail-americas-logo.png',
      name: 'Mail Americas',
      rating: 0,
      drop_off: [
        {
          company_name: 'TESTE',
          phone_number: 'TESTE',
          address: {
            city: 'Doral',
            country: 'US',
            postal_code: '33172',
            state: 'FL',
            street: '8800 NW 24th Terrace',
          },
        },
      ],
    };

    const destinyCountry = ratePayload.whereTo.data.country;

    switch (destinyCountry) {
      case 'BR':
        return this.ratingBrazil(company, ratePayload);
      case 'AR':
        return this.ratingArgentina(company, ratePayload);
      case 'CL':
        return this.ratingChile(company, ratePayload);
      case 'CO':
        return this.ratingColombia(company, ratePayload);
      case 'PE':
        return this.ratingPeru(company, ratePayload);
      case 'MX':
        return this.ratingMexico(company, ratePayload);
      default:
        return null;
    }
  }

  public chileDuties(whatsInside: NewRateShipmentWhatsInsideDataDTO[]): number {
    const shipPackage = whatsInside[0];

    let totalAmount = 0;

    for (const item of shipPackage.items) {
      totalAmount += item.price.value;
    }

    if (totalAmount <= 30) {
      return 0;
    }

    let handlingFee = 0;

    if (totalAmount >= 30 && totalAmount <= 100) {
      handlingFee = 2.0;
    }

    if (totalAmount > 100 && totalAmount <= 300) {
      handlingFee = 3.0;
    }

    if (totalAmount > 300) {
      handlingFee = 6;
    }

    totalAmount = totalAmount * 0.29 + handlingFee;

    return totalAmount;
  }
  public colombiaDuties(
    whatsInside: NewRateShipmentWhatsInsideDataDTO[],
  ): number {
    const shipPackage = whatsInside[0];

    let totalAmount = 0;

    for (const item of shipPackage.items) {
      totalAmount += item.price.value;
    }

    if (totalAmount <= 200) {
      return 0;
    }

    const genericTax = totalAmount * 0.1;

    const vatTax = totalAmount * 0.19;

    totalAmount = genericTax + vatTax;

    return totalAmount;
  }

  public mexicoDuties(
    whatsInside: NewRateShipmentWhatsInsideDataDTO[],
  ): number {
    const shipPackage = whatsInside[0];

    let totalAmount = 0;

    for (const item of shipPackage.items) {
      totalAmount += item.price.value;
    }

    if (totalAmount <= 50) {
      return 0;
    }

    let handlingFee = 0;

    if (totalAmount >= 50 && totalAmount <= 100) {
      handlingFee = 1.5;
    }

    if (totalAmount > 100 && totalAmount <= 300) {
      handlingFee = 2.0;
    }

    if (totalAmount > 300) {
      handlingFee = 5;
    }

    totalAmount = totalAmount + handlingFee;

    if (totalAmount > 50 && totalAmount < 117) {
      return totalAmount + totalAmount * 0.17;
    }

    if (totalAmount > 117 && totalAmount < 1000) {
      return totalAmount + totalAmount * 0.19;
    }

    if (totalAmount > 1000) {
      throw new BadRequestException(
        'Total items cost is above taxation limits for Mexico!',
      );
    }

    return 0;
  }

  public calculateDuties(
    destiny: string,
    whatsInside: NewRateShipmentWhatsInsideDataDTO[],
  ): number {
    switch (destiny) {
      case 'CL':
        return this.chileDuties(whatsInside);
      case 'CO':
        return this.colombiaDuties(whatsInside);
      case 'MX':
        return this.mexicoDuties(whatsInside);
      default:
        return null;
        break;
    }
  }

  public ratingMailAmericas(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    const origin = ratePayload.whereFrom.data;
    const destiny = ratePayload.whereTo.data;
    const servicesAvailable = this.getService(destiny.country);

    const rates: NewRateShipmentReturnDTO[] = [];

    for (const service of servicesAvailable) {
      const incoterm = service.incoterm;

      const allServices: NewRateShipmentReturnServiceDTO[] = [];

      const parcelFreight: NewRateShipmentReturnServiceDTO = {
        company,
        name: 'Parcel Freight',
        items: [
          {
            description: service.serviceName,
            name: 'Parcel Freight',
            price: { currency: 'USD', value: 50 },
            required: true,
          },
        ],
      };

      if (incoterm !== 'DDU') {
        if (incoterm === 'DDP') {
          const duties = {
            company,
            items: [
              {
                description: 'Federal Duties. ICMS NOT included',
                name: 'Duties & Taxes',
                price: {
                  currency: 'USD',
                  value: this.calculateDuties(
                    destiny.country,
                    ratePayload.whatsInside.data,
                  ),
                },
                required: true,
              },
            ],
            name: 'Duties & Taxes',
          };

          allServices.push(duties);
        }

        const dutiesAlreadyOnRates = rates.find((i) =>
          i.services.find((b) => b.name === 'Duties & Taxes'),
        );

        if (incoterm === 'BOTH' && !dutiesAlreadyOnRates) {
          const duties = {
            company,
            items: [
              {
                description: 'Federal Duties. ICMS NOT included',
                name: 'Duties & Taxes',
                price: {
                  currency: 'USD',
                  value: this.calculateDuties(
                    destiny.country,
                    ratePayload.whatsInside.data,
                  ),
                },
                required: true,
              },
            ],
            name: 'Duties & Taxes',
          };

          allServices.push(duties);
        }
      }

      allServices.push(parcelFreight);

      const rate: NewRateShipmentReturnDTO = {
        company,
        delivery: { date: null, days_in_transit: 15 },
        price: { currency: 'USD', value: 50 },
        rate_type: service.serviceName,
        service_code: service.serviceCode,
        services: allServices,
        category: 'parcel',
      };

      rates.push(rate);
    }

    return rates;
  }

  public ratingBrazil(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ) {
    return this.ratingMailAmericas(company, ratePayload);
  }

  public ratingMexico(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    return this.ratingMailAmericas(company, ratePayload);
  }
  public ratingColombia(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    return this.ratingMailAmericas(company, ratePayload);
  }
  public ratingChile(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    return this.ratingMailAmericas(company, ratePayload);
  }
  public ratingArgentina(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    return this.ratingMailAmericas(company, ratePayload);
  }
  public ratingPeru(
    company: NewRateShipmentReturnDTO['company'],
    ratePayload: NewRateShipmentDTO,
  ): NewRateShipmentReturnDTO[] {
    return this.ratingMailAmericas(company, ratePayload);
  }

  public buildBuyer(
    buyer: CheckoutParcelMember,
    destiny: NewRateShipmentDTO['whereTo']['data'],
  ): IMailAmericasShippingPayload['buyer'] {
    return {
      address1: `${destiny.streetNumber} ${destiny.street}`,
      address1_number: Number(destiny.streetNumber),
      city: `${destiny.city}`,
      country: `${destiny.country}`,
      email: `${buyer.email}`,
      name: `${buyer.full_name}`,
      phone: `${buyer.phone.number}`,
      postal_code: `${destiny.zipCode}`,
      state: `${destiny.state}`,
    };
  }
  public buildShipper(
    shipper: CheckoutParcelMember,
    origin: NewRateShipmentDTO['whereFrom']['data'],
  ): IMailAmericasShippingPayload['shipper'] {
    return {
      address1: `${origin.streetNumber} ${origin.street}`,
      city: `${origin.city}`,
      country: `${origin.country}`,
      email: `${shipper.email}`,
      name: `${shipper.full_name}`,
      phone: `${shipper.phone.number}`,
      postal_code: `${origin.zipCode}`,
      state: `${origin.state}`,
    };
  }
  public buildPackage(
    ratePayload: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
  ): IMailAmericasShippingPayload['package'] {
    const whatsInside = ratePayload.whatsInside.data[0];
    const duties = order.services.find((b) => b.name === 'Duties & Taxes');
    const parcelFreight = order.services.find(
      (i) => (i.name = 'Parcel Freight'),
    );

    const isDutiesSelectedOrRequested = !!duties?.items?.find(
      (i) => i?.required || i?.selected,
    );

    let totalAmount = 0;

    for (const item of whatsInside.items) {
      totalAmount += item.price.value;
    }

    const weight =
      whatsInside.weight.unit === 'kg'
        ? whatsInside.weight.value
        : this.formatter.convertPoundsToOunces(whatsInside.weight.value);

    return {
      weight,
      duties: isDutiesSelectedOrRequested ? duties?.items[0]?.price?.value : 0,
      freight: parcelFreight.items[0].price.value,
      declared_value: totalAmount,
      height: whatsInside.dimensions.height,
      length: whatsInside.dimensions.length,
      measurement_unit: whatsInside.dimensions.unit,
      weight_unit: whatsInside.weight.unit === 'kg' ? 'kg' : 'oz',
      width: whatsInside.dimensions.width,
    };
  }
  public buildItems(
    items: NewRateShipmentDTO['whatsInside']['data']['0']['items'],
  ): IMailAmericasShippingPayload['items'] {
    return items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      declared_value: item.price.value,
      hs_code: item.hts_code,
    }));
  }

  public getService(desintyCountry: string): IMailAmericasShippingServices[] {
    switch (desintyCountry) {
      case 'BR':
        return [
          {
            serviceCode: 'USPRMBR',
            serviceName: 'Prime Service',
            incoterm: 'DDU',
          },
          {
            serviceCode: 'USRPKTW1BR',
            serviceName: 'Packet Standard',
            incoterm: 'DDU',
          },
        ];
      case 'AR':
        return [
          {
            serviceCode: 'USEMSAR',
            serviceName: 'Postal Express',
            incoterm: 'DDU',
          },
          {
            serviceCode: 'US0030AR',
            serviceName: 'Postal Registered Service',
            incoterm: 'DDU',
          },
        ];
      case 'CL':
        return [
          {
            serviceCode: 'US0015CL',
            serviceName: 'E Commerce Express',
            incoterm: 'BOTH',
          },
        ];
      case 'CO':
        return [
          {
            serviceCode: 'US0030CO',
            serviceName: 'Comercial Registered Service',
            incoterm: 'BOTH',
          },
          {
            serviceCode: 'US0015CO',
            serviceName: 'E Commerce Express',
            incoterm: 'DDP',
          },
        ];
      case 'PE':
        return [
          {
            serviceCode: 'USHYBPE',
            serviceName: 'Hibrid Service',
            incoterm: 'DDU',
          },
        ];
      case 'MX':
        return [
          {
            serviceCode: 'US12EEMX',
            serviceName: 'Comercial Registered Service',
            incoterm: 'BOTH',
          },
          {
            serviceCode: 'US0030MX',
            serviceName: 'E Commerce Express Service',
            incoterm: 'DDP',
          },
        ];
      default:
        return null;
    }
  }

  public shipmentPayload(
    shipmentBody: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ): IMailAmericasShippingPayload {
    const order: NewRateShipmentReturnDTO = shipmentBody?.metadata as any;
    const quote: NewRateShipmentDTO = shipmentBody?.quote as any;

    const duties = order.services.find((b) => b.name === 'Duties & Taxes');

    const isDutiesSelectedOrRequested = !!duties?.items?.find(
      (i) => i?.required || i?.selected,
    );

    const destiny = quote.whereTo.data;
    const origin = quote.whereFrom.data;

    return {
      order_id: uuidv4(),
      delivery_duties_paid: isDutiesSelectedOrRequested ? 'Y' : 'N',
      sale_date: `${
        parseISO(quote.shipDate.data.date).toISOString().split('.')[0]
      }+00:00`,
      service: order.service_code,
      label_format: 'pdf',
      returns_allowed: 'N',
      shipper: this.buildShipper(sender, origin),
      buyer: this.buildBuyer(recipient, destiny),
      items: this.buildItems(quote.whatsInside.data[0].items),
      package: this.buildPackage(quote, order),
    };
  }

  public async servicesFirstMile(
    courier: 'usps' | 'ups' | 'fedex',
    rateRequest: NewRateShipmentDTO,
    quoteAll: boolean,
  ) {
    const mailAmericasAddress = {
      city: 'Doral',
      country: 'US',
      postal_code: '33172',
      state: 'FL',
      street: '8800 NW 24th Terrace',
      streetNumber: '8800',
    };

    const dropOffLocation: NewRateShipmentReturnDropOffLocationDTO[] = [
      {
        address: mailAmericasAddress,
        company_name: 'Mail Americas',
        phone_number: '',
      },
    ];

    const services: NewRateShipmentReturnServiceDTO[] = [];

    rateRequest = {
      ...rateRequest,
      whereTo: {
        formattedAddress: `${mailAmericasAddress.streetNumber} ${mailAmericasAddress.street}, ${mailAmericasAddress.city}, ${mailAmericasAddress.state} ${mailAmericasAddress.postal_code}, ${mailAmericasAddress.country}`,
        data: {
          addressType: rateRequest?.whereTo?.data?.addressType,
          zipCode: mailAmericasAddress.postal_code,
          additionalAddress: '',
          city: mailAmericasAddress.city,
          country: mailAmericasAddress.country,
          state: mailAmericasAddress.state,
          street: mailAmericasAddress.street,
          streetNumber: mailAmericasAddress.streetNumber,
        },
      },
    };

    if (courier === 'usps' || quoteAll) {
      console.log('quote usps');

      const quoteUsps = await this.uspsService.rate(rateRequest, []);

      if (quoteUsps?.data) {
        const response: NewRateShipmentReturnDTO[] = quoteUsps?.data;

        const filteredResponse = response.filter(
          (i) => i.service_code === '77',
        )[0];

        const items: NewRateShipmentReturnServiceServiceItemDTO[] =
          filteredResponse.services.map((i, index) => {
            return {
              name:
                i.items[0].name === 'Parcel Freight'
                  ? 'First Mile'
                  : i.items[0].name,
              description:
                i.items[0].description === 'Parcel Freight'
                  ? 'First Mile'
                  : i.items[0].description,
              price: i.items[0].price,
              drop_off: filteredResponse?.company?.drop_off,
              required: false,
            };
          });

        const company: NewRateShipmentReturnDeliveryCarrierDTO = {
          logo_url: response[0]?.company?.logo_url,
          rating: 0,
          name: 'USPS',
          drop_off: filteredResponse?.company?.drop_off,
        };

        const service: NewRateShipmentReturnServiceDTO = {
          company,
          name: 'Pick-up',
          items: items.reverse(),
        };

        services.push(service);
      }
    }

    if (courier === 'ups' || quoteAll) {
      console.log('quote ups');

      const quoteUps = await this.upsService.rate(rateRequest, []);

      if (quoteUps?.data) {
        const response: NewRateShipmentReturnDTO[] = quoteUps?.data;

        const filteredRate = response.filter((i) => i.service_code === '03')[0];

        if (filteredRate) {
          const items: NewRateShipmentReturnServiceServiceItemDTO[] =
            filteredRate.services.map((i, index) => {
              return {
                productName: filteredRate?.rate_type,
                name:
                  i.items[0].name === 'Parcel Freight'
                    ? 'First Mile'
                    : i.items[0].name,
                description:
                  i.items[0].name === 'Parcel Freight'
                    ? 'Transit time 2-8 days'
                    : i.items[0].name,
                price: i.items[0].price,
                drop_off: filteredRate?.company?.drop_off,
                required: false,
              };
            });

          const company: NewRateShipmentReturnDeliveryCarrierDTO = {
            logo_url: filteredRate?.company?.logo_url,
            rating: 0,
            name: 'UPS',
            drop_off: filteredRate?.company?.drop_off,
          };

          const service: NewRateShipmentReturnServiceDTO = {
            company,
            name: 'Pick-up',
            items: items.reverse(),
          };

          services.push(service);
        } else
          throw new BadRequestException('UPS parcel freight not available!');
      }
    }

    if (courier === 'fedex' || quoteAll) {
      console.log('quote fedex');
      const quoteFedex = await this.fedexService.rateFedexRest(rateRequest, []);

      if (quoteFedex?.data) {
        const response: NewRateShipmentReturnDTO[] = quoteFedex?.data;

        const filteredRate = response.filter(
          (i) => i.service_code === 'FEDEX_GROUND',
        )[0];

        if (filteredRate) {
          const items: NewRateShipmentReturnServiceServiceItemDTO[] =
            filteredRate.services.map((i, index) => {
              return {
                name:
                  i.items[0].name === 'Parcel Freight'
                    ? 'First Mile'
                    : i.items[0].name,
                description:
                  i.items[0].description === 'Parcel Freight'
                    ? 'First Mile'
                    : i.items[0].description,
                price: i.items[0].price,
                drop_off: filteredRate?.company?.drop_off,
                required: false,
              };
            });

          const company: NewRateShipmentReturnDeliveryCarrierDTO = {
            logo_url: filteredRate?.company?.logo_url,
            rating: 0,
            name: 'FEDEX',
            drop_off: filteredRate?.company?.drop_off,
          };

          const service: NewRateShipmentReturnServiceDTO = {
            company,
            name: 'Pick-up',
            items: items.reverse(),
          };

          services.push(service);
        } else
          throw new BadRequestException('Fedex parcel freight not available!');
      }
    }

    return { services, dropOffLocation };
  }

  public async makeMailAmericasLabels(labelsBase64: SkyPostalLabelsMerge[]) {
    try {
      const pdfDoc = await PDFDocument.create();
      for (const iterator of labelsBase64) {
        console.log('iterator', iterator?.courier);
        const label = Buffer.from(iterator.labelBase64, 'base64');
        const pdf = await PDFDocument.load(label);
        const copiedPages = await pdfDoc.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => {
          pdfDoc.addPage(page);
        });
      }
      const mergedPdfFile = await pdfDoc.save();
      const labelsFormattedPdf =
        this.documentHelper.uInt8ArrayToBase64(mergedPdfFile);
      return labelsFormattedPdf;
    } catch (error) {
      throw error;
    }
  }

  public async mergePngLabels(labels: SkyPostalLabelsMerge[]) {
    const trackingsArray: SkyPostalLabelsMerge[] = Array.isArray(labels)
      ? labels
      : [labels];

    const pdfDocument = new DocumentHelperService();

    for (const [index, data] of trackingsArray.entries()) {
      const label = data.labelBase64;

      const DOC_MARGIN_X = 7;
      const DOC_MARGIN_Y = 7;
      const DOC_MAX_WIDTH = 190;
      const DOC_MAX_HEIGHT = 290;

      const DOC_IMAGE_WIDTH = DOC_MAX_WIDTH - DOC_MARGIN_X * 2;
      const DOC_IMAGE_HEIGHT = (DOC_MAX_HEIGHT - DOC_MARGIN_Y * 4) / 2;

      const DOC_IMAGE_POSITIONS = {
        TOP: DOC_MARGIN_Y,
        BOTTOM: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 3,
      };

      const currentPosition = index % 2 === 0 ? 'TOP' : 'BOTTOM';

      pdfDocument.addImage({
        imageBase64: label,
        format: 'PNG',
        startX: DOC_MARGIN_X,
        startY: DOC_IMAGE_POSITIONS[currentPosition],
        width: DOC_IMAGE_WIDTH,
        height: DOC_IMAGE_HEIGHT,
      });

      if (currentPosition === 'TOP') {
        continue;
      }

      if (currentPosition === 'BOTTOM') {
        pdfDocument.addDashedLine({
          segment: {
            width: 7,
            space: 4,
            start: 0,
          },
          position: {
            startX: DOC_MARGIN_X,
            endX: DOC_MAX_WIDTH - DOC_MARGIN_X,
            startY: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 2,
            endY: DOC_IMAGE_HEIGHT + DOC_MARGIN_Y * 2,
          },
        });
      }

      if (index < trackingsArray.length - 1) {
        pdfDocument.addPage();
      }
    }

    return pdfDocument.toBase64();
  }

  public async handleFirstMileShipments(
    firstMile: NewRateShipmentReturnServiceServiceItemDTO,
    firstMilePickUp: NewRateShipmentReturnServiceServiceItemDTO,
    firstMileCourier: string,
    mainLabel: string,
    mainTrackingNumber: string,
    parcelBooking: parcel_bookings,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ) {
    let firstMileLabelBase64 = '';
    let firstMileTrackingNumber = '';
    const labels: SkyPostalLabelsMerge[] = [];
    const onlyLabels: SkyPostalLabelsMerge[] = [];
    let instructionsFile = '';

    if (firstMile?.selected) {
      const base64File = await getFirstMileInstructionsLabel();
      console.timeLog('labels', 'instructions');

      labels.push({
        labelBase64: base64File,
      });

      instructionsFile = base64File;
    }

    onlyLabels.push({
      labelBase64:
        firstMile?.selected && firstMileCourier?.toLocaleLowerCase() !== 'fedex'
          ? await this.formatter.rotateImage(
              Buffer.from(mainLabel, 'base64'),
              90,
            )
          : mainLabel,
      courier: 'mailamericas',
    });

    if (firstMile?.selected) {
      switch (firstMileCourier.toLowerCase()) {
        case 'ups':
          const {
            shipTo,
            shipFrom,
            label_base64,
            order,
            packages,
            quote,
            shipper,
            tracking_number,
          } = await this.upsService.firstMileShipment(
            parcelBooking,
            {
              sender,
              recipient,
            },
            'skypostal',
            String(mainTrackingNumber),
          );

          firstMileTrackingNumber = tracking_number;
          firstMileLabelBase64 = label_base64;
          console.timeLog('labels', 'ups label');

          if (firstMilePickUp?.selected) {
            await this.upsService.requestPickup({
              shipper,
              order,
              packages,
              quote,
              shipFrom,
              shipTo,
              trackingNumber: tracking_number,
            });
          }

          onlyLabels.push({
            labelBase64: firstMileLabelBase64.split(',').pop(),
            courier: 'ups',
          });
          break;

        case 'usps':
          const uspsShipping = await this.uspsService.firstMileShipment(
            parcelBooking,
            {
              sender,
              recipient,
            },
            'skypostal',
            String(mainTrackingNumber),
          );

          firstMileTrackingNumber = uspsShipping.tracking_number;

          const convertedLabelInPng = await this.formatter.convertBtwTiffPng(
            Buffer.from(uspsShipping.label_base64, 'base64'),
          );

          firstMileLabelBase64 = await this.formatter.rotateImage(
            Buffer.from(convertedLabelInPng.split(',').pop(), 'base64'),
            90,
          );

          console.timeLog('labels', 'usps label');

          onlyLabels.push({
            labelBase64: firstMileLabelBase64,
            courier: 'usps',
          });

          break;

        case 'fedex':
          const fedexShipping = await this.fedexService.shipmentRestFirstMile(
            parcelBooking,
            {
              sender,
              recipient,
            },
            'skypostal',
            String(mainTrackingNumber),
          );

          firstMileTrackingNumber = fedexShipping.tracking_number;

          firstMileLabelBase64 = fedexShipping.label_base64;
          console.timeLog('labels', 'fedex label');

          onlyLabels.push({
            labelBase64: firstMileLabelBase64,
            courier: 'fedex',
          });

        default:
          break;
      }
    }

    let masterLabel;

    if (
      firstMile?.selected &&
      firstMileCourier.toLocaleLowerCase() !== 'fedex'
    ) {
      masterLabel = await (await this.mergePngLabels(onlyLabels))
        .split(',')
        .pop();
    } else {
      masterLabel = await (await this.makeMailAmericasLabels(onlyLabels))
        .split(',')
        .pop();
    }
    console.timeLog('labels', 'make master label');
    const toMergeFiles: SkyPostalLabelsMerge[] = [];

    if (firstMile?.selected) {
      toMergeFiles.push({ labelBase64: instructionsFile });
    }

    toMergeFiles.push({ labelBase64: masterLabel });

    return toMergeFiles;
  }
}
