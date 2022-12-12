import { Injectable } from '@nestjs/common';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../../dto/newCouriers.dto';
import {
  IGLTCreateLoad,
  IGLTQuoteResponse,
  IGLTTender,
  IGLTUpdateLoadWithCustomerData,
} from '../interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GltHelperService {
  constructor(private readonly formatter: FormattersService) {}
  public authPayload(user: string, password: string, org: string) {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
      xmlns:urn="urn:enterprise.soap.sforce.com">
          <soapenv:Header>
              <urn:LoginScopeHeader>
                  <urn:organizationId>${org}</urn:organizationId>
              </urn:LoginScopeHeader>
          </soapenv:Header>
          <soapenv:Body>
              <urn:login>
                  <urn:username>${user}</urn:username>
                  <urn:password>${password}*</urn:password>
              </urn:login>
          </soapenv:Body>
      </soapenv:Envelope>`;
  }

  public;

  public loadPayload(
    rateData: NewRateShipmentDTO,
    loadId?: string,
    loadName?: string,
  ): IGLTCreateLoad {
    const payloadInLbs = this.formatter.convertPackagesToImperial(rateData);

    const origin = rateData?.whereFrom?.data;
    const destiny = rateData?.whereTo?.data;

    const Accessorials: IGLTCreateLoad['wsl']['Accessorials'] = [];

    const LineItems: IGLTCreateLoad['wsl']['LineItems'] = payloadInLbs.map(
      (i) => ({
        deliveryStopNumber: 1,
        dimensionUnits: 'lbs',
        handlingUnitCount: i.pieces,
        handlingUnitHeight: i.dimensions.height,
        handlingUnitLength: i.dimensions.length,
        handlingUnitWidth: i.dimensions.width,
        handlingUnits: 'Pallets',
        itemDescription: rateData?.description?.description || 'Description',
        itemNumber: 'Item',
        nmfcClass: '50',
        pickupStopNumber: 1,
        stackable: false,
        turnable: false,
        weight: i.weight.value * i.pieces,
        weightUnits: 'lbs',
      }),
    ) as [any];

    const originAddress = `${origin.streetNumber} ${origin.street}`;
    const destinyAddress = `${destiny.streetNumber} ${destiny.street}`;

    const Stops: IGLTCreateLoad['wsl']['Stops'] = [
      {
        isDropOff: false,
        isPickup: false,
        location: {
          //   companyName:,
          shippingAddress: originAddress,
          shippingCity: origin.city,
          shippingCountry: origin.country,
          shippingPostalCode: origin.zipCode,
          shippingStateProvince: origin.state,
        },
        // shippingContact: { email:, firstName, lastName, phone },
        shippingReceivingHours: '09:00-20:00',
        stopNumber: 1,
      },
      {
        isDropOff: true,
        isPickup: false,
        location: {
          //   companyName:,
          shippingAddress: destinyAddress,
          shippingCity: destiny.city,
          shippingCountry: destiny.country,
          shippingPostalCode: destiny.zipCode,
          shippingStateProvince: destiny.state,
        },
        // shippingContact: { email:, firstName, lastName, phone },
        shippingReceivingHours: '09:00-20:00',
        stopNumber: 1,
      },
    ];

    const loadNumber: IGLTCreateLoad['wsl']['loadNumber'] = uuidv4();

    const modeName: IGLTCreateLoad['wsl']['modeName'] = 'LTL';

    const totalWeight: IGLTCreateLoad['wsl']['totalWeight'] =
      this.formatter.calculateTotalWeight(rateData.whatsInside.data);

    const weightUnits: IGLTCreateLoad['wsl']['weightUnits'] = 'lbs';

    const payload: IGLTCreateLoad = {
      wsl: {
        Accessorials,
        LineItems,
        Stops,
        loadNumber,
        modeName,
        totalWeight,
        weightUnits,
        ...(loadId ? { loadId } : []),
        ...(loadName ? { loadName } : []),
      },
    };

    return payload;
  }

  public formatQuoteResponse(
    quotes: IGLTQuoteResponse[],
    loadId?: string,
    loadName?: string,
    tracking?: string,
  ): NewRateShipmentReturnDTO[] {
    const company: NewRateShipmentReturnDTO['company'] = {
      logo_url: '',
      name: 'GLT',
      rating: 0,
    };

    const formattedQuotes: NewRateShipmentReturnDTO[] = quotes.map((i) => ({
      company,
      delivery: { date: i.estimatedDelivery, days_in_transit: i.transitTime },
      price: { currency: 'USD', value: i.price },
      rate_type: i.serviceClass,
      service_code: { quoteId: i.quoteId, loadId, loadName, tracking },
      services: [{ company, items: [], name: 'Land Freight' }],
      category: 'land',
    }));

    return formattedQuotes;
  }

  public updatePayloadWithCustomerData(
    updateData: IGLTUpdateLoadWithCustomerData,
  ): IGLTCreateLoad {
    const senderData = updateData?.customerData?.sender;
    const destinationData = updateData?.customerData?.sender;

    const formattedStops = updateData.loadData.wsl.Stops.map((i) => {
      if (i.stopNumber === 1 && senderData.email) {
        return {
          ...i,
          shippingContact: {
            phone: senderData.phone,
            lastName: senderData.lastName,
            firstName: senderData.firstName,
            email: senderData.email,
          },
        };
      }

      if (i.stopNumber === 2 && senderData.email) {
        return {
          ...i,
          shippingContact: {
            phone: destinationData.phone,
            lastName: destinationData.lastName,
            firstName: destinationData.firstName,
            email: destinationData.email,
          },
        };
      }
    });

    updateData.loadData.wsl.Stops = formattedStops;

    return updateData.loadData;
  }
}
