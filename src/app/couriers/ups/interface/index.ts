export interface UPSRateRequestTimeInTransitPayload {
  originCountryCode: string;
  originStateProvince: string;
  originCityName: string;
  originPostalCode: string;
  destinationCountryCode: string;
  destinationStateProvince: string;
  destinationCityName: string;
  destinationPostalCode: string;
  weight: number;
  weightUnitOfMeasure: string;
  shipmentContentsValue: number;
  shipmentContentsCurrencyCode: string;
  billType: string;
  shipDate: string;
  shipTime: string;
  residentialIndicator: string;
  numberOfPackages: number;
  returnUnfilteredServices: boolean;
  returnHeavyGoodsServices: boolean;
  dropOffAtFacilityIndicator: number;
  holdForPickupIndicator: number;
}

export interface UPSLabels {
  TrackingNumber: string;
  BaseServiceCharge: { CurrencyCode: 'USD'; MonetaryValue: string };
  ServiceOptionsCharges: { CurrencyCode: 'USD'; MonetaryValue: string };
  ShippingLabel: {
    ImageFormat: { Code: 'PNG'; Description: 'PNG' };
    GraphicImage: string;
    HTMLImage: string;
  };
  ItemizedCharges: { Code: string; CurrencyCode: 'USD'; MonetaryValue: string };
  NegotiatedCharges: {
    ItemizedCharges: {
      Code: string;
      CurrencyCode: string;
      MonetaryValue: string;
    };
  };
}

export interface UPSRateRequestQuote {
  RateResponse: {
    Response: {
      ResponseStatus: { Code: string; Description: string };
      Alert: [
        {
          Code: string;
          Description: string;
        },
      ];
      TransactionReference: string;
    };
    RatedShipment: [
      {
        Service: { Code: string; Description: string };
        RatedShipmentAlert: [
          {
            Code: string;
            Description: string;
          },
        ];
        BillingWeight: {
          UnitOfMeasurement: { Code: string; Description: string };
          Weight: string;
        };
        TransportationCharges: { CurrencyCode: string; MonetaryValue: string };
        BaseServiceCharge: { CurrencyCode: string; MonetaryValue: string };
        ItemizedCharges: {
          Code: string;
          CurrencyCode: string;
          MonetaryValue: string;
        };
        ServiceOptionsCharges: { CurrencyCode: string; MonetaryValue: string };
        TotalCharges: { CurrencyCode: string; MonetaryValue: string };
        NegotiatedRateCharges: {
          TotalCharge: { CurrencyCode: string; MonetaryValue: string };
        };
        GuaranteedDelivery: {
          BusinessDaysInTransit: string;
          DeliveryByTime: string;
        };
        RatedPackage: {
          TransportationCharges: {
            CurrencyCode: string;
            MonetaryValue: string;
          };
          BaseServiceCharge: { CurrencyCode: string; MonetaryValue: string };
          ServiceOptionsCharges: {
            CurrencyCode: string;
            MonetaryValue: string;
          };
          ItemizedCharges: [
            {
              Code: string;
              CurrencyCode: string;
              MonetaryValue: string;
              SubType: string;
            },
          ];
          TotalCharges: { CurrencyCode: string; MonetaryValue: string };
          Weight: string;
          BillingWeight: {
            UnitOfMeasurement: { Code: string; Description: string };
            Weight: string;
          };
        };
      },
    ];
  };
}

export interface UPSRateRequestTimeInTransitResponse {
  validationList?: {
    invalidFieldList: [string];
    destinationAmbiguous: false;
    originAmbiguous: true;
    invalidFieldListCodes: [string];
  };
  originPickList?: [
    {
      countryName: string;
      countryCode: string;
      stateProvince: string;
      city: string;
      postalCode: string;
      postalCodeLow: string;
      postalCodeHigh: string;
    },
  ];
  emsResponse: {
    shipDate: string;
    shipTime: string;
    serviceLevel: string;
    billType: string;
    residentialIndicator: string;
    destinationCityName: string;
    destinationCountryName: string;
    destinationCountryCode: string;
    destinationPostalCode: string;
    destinationPostalCodeLow: string;
    destinationPostalCodeHigh: string;
    destinationStateProvince: string;
    originCityName: string;
    originCountryName: string;
    originCountryCode: string;
    originPostalCode: string;
    originPostalCodeLow: string;
    originPostalCodeHigh: string;
    originStateProvince: string;
    shipmentContentsCurrencyCode: string;
    weightUnitOfMeasure: string;
    weight: string;
    shipmentContentsValue: string;
    guaranteeSuspended: false;
    numberOfServices: boolean;
    services: [
      {
        serviceLevel: string;
        serviceLevelDescription: string;
        businessTransitDays: number;
        totalTransitDays: number;
        deliveryDate: string;
        deliveryTime: string;
        deliveryDayOfWeek: string;
        nextDayPickupIndicator: string;
        saturdayPickupIndicator: string;
        saturdayDeliveryIndicator: string;
        sundayPickupIndicator: string;
        sundayDeliveryIndicator: string;
        guaranteeIndicator: string;
        restDaysCount: number;
        holidayCount: number;
        delayCount: number;
        commitTime: string;
        shipDate: string;
        pickupTime: string;
        pickupDate: string;
        cstccutoffTime: string;
        poddays: number;
      },
    ];
  };
}

export interface UPSDropoffReturn {
  company_name: string;
  phone_number: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}

export interface UPSDropoffError {
  message: string;
}

export interface UPSPickup {
  address: {
    country: string;
    state: string;
    city: string;
    postal_code: string;
    address: string;
    street: string;
    street_number: string;
    is_residential_address: boolean;
    complement_address: string | null;
  };
  pickup_date: Date;
}

export interface UPSPickupReturn {
  rate_type: any;
  rate_description: any;
  currency: any;
  charge_details: any[];
  total: number;
}

export interface UPSTrackingReturn {
  trackResponse: {
    shipment: [
      {
        package: [
          {
            trackingNumber: string;
            deliveryDate: [
              {
                type: string;
                date: string;
              },
            ];
            deliveryTime: {
              startTime: string;
              endTime: string;
              Type: string;
            };
            activity: [
              {
                location: {
                  address: {
                    city: string;
                    stateProvince: string;
                    postalCode: string;
                    country: string;
                  };
                };
                status: {
                  type: string;
                  description: string;
                  code: string;
                };
                date: string;
                time: string;
              },
            ];
          },
        ];
      },
    ];
  };
}
