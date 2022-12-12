import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FindDropoffsDTO } from '../dto/couriers.dto';
import { DhlHelperService } from './dhl-helper/dhl-helper.service';
import { lastValueFrom } from 'rxjs';
import {
  DHLCreateShipmentReturn,
  DHLDropoffLocations,
  DHLRateRequestReturn,
  DHLTrackingReturn,
} from './interface/dhl.interface';
import {
  NewRateShipmentDTO,
  NewRateShipmentFiltersDTO,
  NewRateShipmentReturnDTO,
} from '../dto/newCouriers.dto';
import { parcel_bookings } from '@generated/client';
import { CheckoutParcelMember } from '../../../app/checkout/interface/checkout.interface';
import { S3Service } from '../../../vendors/s3/s3.service';
@Injectable()
export class DhlService {
  private baseUrl: string;
  private baseUrlLocator: string;
  private environment: string;
  private header;
  private headerLocator;

  private status = {
    RR: 'TRANSIT',
    PU: 'PICK_UP',
    DF: 'TRANSIT',
    PL: 'TRANSIT',
    CR: 'TRANSIT',
    AF: 'TRANSIT',
    OH: 'TRANSIT',
    AR: 'TRANSIT',
    HP: 'TRANSIT',
    WC: 'DELIVERED',
  };

  constructor(
    private readonly dhlHelper: DhlHelperService,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    private readonly s3service: S3Service,
  ) {
    this.baseUrl = configService.get('DHL_API_URL');
    this.baseUrlLocator = configService.get('DHL_DROPOFF_API_URL');
    this.environment = configService.get('ENVIRONMENT');
    this.header = {
      Authorization: `Basic ${Buffer.from(
        `${configService.get('DHL_API_USERNAME')}:${configService.get(
          'DHL_API_PASSWORD',
        )}`,
      ).toString('base64')}`,
    };
    this.headerLocator = {
      'DHL-API-KEY': configService.get('DHL_DROPOFF_API_KEY'),
    };
  }

  public async rate(
    rateData: NewRateShipmentDTO,
    services: NewRateShipmentFiltersDTO['services'],
  ) {
    try {
      const accountNumber = this.dhlHelper.getDHLRateType(
        rateData.whereFrom.data.country,
        rateData.whereTo.data.country,
      );

      const quoteBody = this.dhlHelper.makeDHLQuoteBody(
        rateData,
        accountNumber,
      );

      const { data } = await lastValueFrom(
        this.http.post<DHLRateRequestReturn>(
          `${this.baseUrl}/rates`,
          quoteBody,
          {
            headers: this.header,
          },
        ),
      );

      console.log("data:", data)

      const whereFromAddress = rateData.whereFrom.data;

      const dropoffAddress = await this.dropoff({
        city: whereFromAddress.city,
        country: whereFromAddress.country,
        is_residential_address: true,
        postal_code: whereFromAddress.zipCode,
        state: whereFromAddress.state,
        street: whereFromAddress.street,
        address: `${whereFromAddress.street} ${whereFromAddress.streetNumber}, ${whereFromAddress.state} - ${whereFromAddress.country}`,
        street_number: whereFromAddress.streetNumber,
      });

      const quotes = data.products.map((product) =>
        this.dhlHelper.formatDHLDomesticQuoteReponse(
          rateData,
          product,
          dropoffAddress,
        ),
      );

      return { data: quotes };
    } catch (error) {
      console.log('dhl', error);
      return error;
    }
  }

  private isTherePickUp(services: NewRateShipmentFiltersDTO['services']) {
    return services?.length ? services?.find((i) => i === 'pickUp') : true;
  }

  public async rateWithType(
    rateData: NewRateShipmentDTO,
    serviceCode?: string,
    order?: NewRateShipmentReturnDTO
  ): Promise<number> {
    try {
      const accountNumber = this.dhlHelper.getDHLRateType(
        rateData.whereFrom.data.country,
        rateData.whereTo.data.country,
      );

      const quoteBody = this.dhlHelper.makeDHLQuoteBody(
        rateData,
        accountNumber,
        serviceCode,
      );

      console.timeLog("create parcel booking", "dhlquoteBody")

      const { data } = await lastValueFrom(
        this.http.post<DHLRateRequestReturn>(
          `${this.baseUrl}/rates`,
          quoteBody,
          {
            headers: this.header,
          },
        ),
      );

      const singleProduct = data.products?.find(
        (i) => i.productCode === serviceCode,
      );

      if (!singleProduct) throw new BadRequestException('Quote Fails');

      let currencyPrice = singleProduct.totalPrice.find(
        (price) =>
          price.currencyType === 'BILLC' && price.priceCurrency === 'USD',
      );

      if (!currencyPrice) {
        currencyPrice = singleProduct.totalPrice[0];
      }

      return Number(currencyPrice.price.toFixed(2));
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  public async dropoff(dropoff: FindDropoffsDTO) {
    const locatorPayload = this.dhlHelper.makeLocatorPayload(dropoff);

    try {
      const { data } = await lastValueFrom(
        this.http.get<DHLDropoffLocations>(
          `${this.baseUrlLocator}/find-by-address`,
          {
            params: locatorPayload,
            headers: this.headerLocator,
          },
        ),
      );

      const errorOnRequest =
        this.environment === 'production'
          ? this.dhlHelper.handleErrorsOnRequest(data)
          : false;

      if (errorOnRequest) {
        return errorOnRequest;
      }

      const responseData =
        this.environment === 'production'
          ? this.dhlHelper.makeResponseData(data)
          : this.dhlHelper.makeFakeDropOffLocation();

      return responseData;
    } catch (error) {
      return error;
    }
  }

  public async tracking(trackingNumber: string) {
    try {
      const { data } = await lastValueFrom(
        this.http.get<DHLTrackingReturn>(
          `${this.baseUrl}/shipments/${String(trackingNumber)}/tracking`,
          {
            headers: this.header,
          },
        ),
      );

      const events = data?.shipments[0]?.events.map((i) => {
        return {
          date: i?.date,
          description: i?.description,
          status: this.status[i?.typeCode],
          rawStatus: i?.typeCode,
        };
      });

      const labelIssued = data?.shipments[0]?.status === 'Success';

      return { events: events ?? [], labelIssued: labelIssued ?? false };
    } catch (error) {
      return error;
    }
  }

  public async shipment(
    parcelBooking: parcel_bookings,
    {
      sender,
      recipient,
    }: { sender: CheckoutParcelMember; recipient: CheckoutParcelMember },
  ) {
    try {
      const payload = await this.dhlHelper.inputAdapterCreateShipment({
        parcel_serial_number: parcelBooking.parcel_serial_number,
        quote: parcelBooking?.quote as any,
        order: parcelBooking?.metadata as any,
        recipient,
        sender,
      });

      const { data } = await lastValueFrom(
        this.http.post<DHLCreateShipmentReturn>(
          `${this.baseUrl}/shipments`,
          payload,
          {
            headers: this.header,
          },
        ),
      );
      const PackageID = `ALIROK${String(
        parcelBooking.parcel_serial_number,
      ).padStart(7, '0')}P`;

      const trackingNumber = data.shipmentTrackingNumber;

      const findLabel = data.documents.find((i) => i.typeCode === 'label');

      const findInvoice = data.documents.find((i) => i.typeCode === 'invoice');

      const labelUrl = await this.s3service.put({
        file: Buffer.from(findLabel.content, 'base64'),
        contentType: 'application/pdf',
        folder: 'documents/labels',
        name: `${PackageID}.pdf`,
      });

      let invoiceUrl = '';

      if (findInvoice?.content) {
        invoiceUrl = await this.s3service.put({
          file: Buffer.from(findInvoice.content, 'base64'),
          contentType: 'application/pdf',
          folder: 'documents/invoices',
          name: `${PackageID}.pdf`,
        });
      }

      return {
        id: trackingNumber,
        shipmentId: trackingNumber,
        tracking_number: trackingNumber,
        label_url: labelUrl,
        invoice_url: invoiceUrl,
        receipt_url: '',
        PackageID,
        dhlConfirmationNumber: data?.dispatchConfirmationNumber,
      };
    } catch (error) {
      throw error;
    }
  }

  public async pickup(
    rateData: NewRateShipmentDTO,
    order: NewRateShipmentReturnDTO,
  ) {
    const accountNumber = this.dhlHelper.getDHLRateType(
      rateData.whereFrom.data.country,
      rateData.whereTo.data.country,
    );

    const quoteBody = this.dhlHelper.makeDHLQuoteBody(rateData, accountNumber);

    const { data } = await lastValueFrom(
      this.http.post<DHLRateRequestReturn>(`${this.baseUrl}/rates`, quoteBody, {
        headers: this.header,
      }),
    );

    const singleProduct = data.products?.find(
      (i) => i.productCode === order.service_code,
    );

    const pickupCapabilities = singleProduct?.pickupCapabilities;

    if (pickupCapabilities) {
      return { total: 5.4 };
    }

    return { total: 0 };
  }

  public async cancelPickupRequest(confirmationNumber: string) {
    return await lastValueFrom(
      this.http.delete<DHLCreateShipmentReturn>(
        `${this.baseUrl}/pickups/${confirmationNumber}`,
        {
          headers: this.header,
        },
      ),
    );
  }

  // public async requestLandedCost(quote: NewRateShipmentDTO) {
  //   try {
  //     const payload = this.dhlHelper.createLandedCost(quote);

  //     const { data } = await lastValueFrom(
  //       this.http.post<DHLLandedCostReturn>(
  //         `${this.baseUrl}/landed-cost`,
  //         payload,
  //         {
  //           headers: this.header,
  //         },
  //       ),
  //     );

  //     let taxAmount = 0;
  //     let feeAmount = 0;
  //     let dutiesAmount = 0;
  //     let ddpServiceAmount = 0;
  //     let total = 0;

  //     if (data?.products) {
  //       let products = data?.products;

  //       const allTaxes = products[0]?.detailedPriceBreakdown?.map((i) =>
  //         i?.breakdown?.find((b) => b?.typeCode === 'TAX'),
  //       );

  //       const allDuties = products[0]?.detailedPriceBreakdown?.map((i) =>
  //         i?.breakdown?.find((b) => b?.typeCode === 'DUTY'),
  //       );

  //       const allFees = products[0]?.detailedPriceBreakdown?.map((i) =>
  //         i?.breakdown?.find((b) => b?.typeCode === 'FEE'),
  //       );

  //       const ddpCost = products[0]?.detailedPriceBreakdown?.map((i) =>
  //         i?.breakdown?.find((b) => b?.serviceCode === 'DD'),
  //       );

  //       if (allTaxes) {
  //         taxAmount = allTaxes?.reduce((acc, curr) => (acc += curr.price), 0);
  //       }

  //       if (allTaxes) {
  //         feeAmount = allFees?.reduce((acc, curr) => (acc += curr.price), 0);
  //       }

  //       if (allTaxes) {
  //         dutiesAmount = allDuties?.reduce(
  //           (acc, curr) => (acc += curr.price),
  //           0,
  //         );
  //       }

  //       if (allTaxes) {
  //         ddpServiceAmount = ddpCost?.reduce(
  //           (acc, curr) => (acc += curr.price),
  //           0,
  //         );
  //       }
  //       total = taxAmount + feeAmount + dutiesAmount + ddpServiceAmount;
  //       return { taxAmount, feeAmount, dutiesAmount, ddpServiceAmount, total };
  //     } else {
  //       return;
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
