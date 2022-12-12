export interface IGLTLoadDataResponse {
  weightUnits: string;
  volumeUnits: any;
  trackingProvider: any;
  trackingProviderCustomer: any;
  trackingNumber: any;
  trackingNumberCustomer: any;
  totalWeight: number;
  totalVolume: any;
  tenderAcceptedDate: string;
  Stops: [
    {
      stopStatus: string;
      stopNumber: number;
      shippingReceivingHours: string;
      shippingContact: {
        phone: string;
        lastName: string;
        firstName: string;
        email: string;
      };
      references: string;
      pickupDeliveryNumber: string;
      milesAway: number;
      location: {
        shippingStateProvince: string;
        shippingPostalCode: string;
        shippingCountry: string;
        shippingCity: string;
        shippingAddress: string;
        companyName: string;
      };
      kilometersAway: number;
      isPickup: boolean;
      isGeolocation: boolean;
      isDropOff: boolean;
      instructions: any;
      expectedDate: string;
      departureTime: any;
      departureDate: any;
      cumulativeMiles: number;
      carrierStatusComments: any;
      carrierStatusAsOf: string;
      carrierStatus: string;
      carrierEtaTime: string;
      carrierEtaDate: string;
      arrivalTime: any;
      arrivalStatus: string;
      arrivalDate: any;
      appointmentTime: string;
      appointmentRequired: boolean;
      address: string;
    },
  ];
  stateLane: string;
  shipToAddress: string;
  shipStatus: string;
  shipFromAddress: string;
  scheduleStatus: string;
  proNumber: any;
  poNumber: any;
  podReceived: boolean;
  otherInstructions: any;
  origin: string;
  orderNumber: any;
  orderDate: string;
  modeName: string;
  loadStatusComments: any;
  loadStatus: string;
  loadPostingDescription: string;
  loadNumber: string;
  loadId: string;
  LineItems: [
    {
      weightUnits: string;
      weight: number;
      volumeUnits: any;
      volume: any;
      turnable: boolean;
      stackable: boolean;
      scheduleBCode: string;
      pickupStopNumber: number;
      packagingUnits: string;
      packagingUnitCount: number;
      nmfcNumber: string;
      nmfcClass: string;
      linearFeet: number;
      itemNumber: string;
      itemDescription: string;
      htsCode: string;
      hsCode: string;
      hazMatPackingGroup: any;
      hazMatNumber: any;
      hazMatContact: any;
      hazMatClassDivision: any;
      hazardousMaterials: boolean;
      handlingUnitWidth: number;
      handlingUnits: string;
      handlingUnitLength: number;
      handlingUnitHeight: number;
      handlingUnitCount: number;
      dimensionUnits: string;
      deliveryStopNumber: number;
    },
  ];
  linearFeet: number;
  lastReportedState: string;
  lastReportedLongitude: number;
  lastReportedLatitude: number;
  lastReportedCountry: string;
  lastReportedCity: string;
  lastModifiedDate: string;
  hazardousMaterials: boolean;
  expectedShipDate: string;
  expectedDeliveryDate: any;
  distanceMiles: number;
  distanceKilometers: number;
  destination: string;
  deliveryStatus: string;
  currencyCode: string;
  createdDate: string;
  containerTrailerNumber: string;
  cityLane: string;
  carrierUploads: any;
  carrier: string;
  cargoValue: number;
  bookingNumber: any;
  billOfLadingNumber: string;
  apiLoadId: any;
  Accessorials: [
    {
      stopNumber: number;
      accessorialName: string;
      accessorialId: string;
    },
  ];
}

export interface IGLTCreateLoad {
  wsl: {
    weightUnits: 'lbs';
    totalWeight: number;
    Stops: {
      stopNumber: number;
      shippingReceivingHours: string;
      shippingContact?: {
        phone: string;
        lastName: string;
        firstName: string;
        email: string;
      };
      location: {
        shippingStateProvince: string;
        shippingPostalCode: string;
        shippingCountry: string;
        shippingCity: string;
        shippingAddress: string;
        companyName?: string;
      };
      isPickup: boolean;
      isDropOff: boolean;
    }[];
    modeName: 'LTL';
    loadNumber: string;
    loadId?: string;
    loadName?: string;
    LineItems: {
      weightUnits: 'lbs';
      weight: number;
      stackable: boolean;
      turnable: boolean;
      pickupStopNumber: number;
      nmfcClass: string;
      itemNumber: string;
      itemDescription: string;
      handlingUnitWidth: number;
      handlingUnits: string;
      handlingUnitLength: number;
      handlingUnitHeight: number;
      handlingUnitCount: number;
      dimensionUnits: 'in';
      deliveryStopNumber: number;
    }[];
    Accessorials?: {
      stopNumber?: number;
      accessorialName?: string;
      accessorialId?: string;
    }[];
  };
}

export interface IGLTUpdateLoadWithCustomerData {
  loadData: IGLTCreateLoad;
  customerData: {
    sender: {
      phone: string;
      lastName: string;
      firstName: string;
      email: string;
      companyName?: string;
    };
    receiver: {
      phone: string;
      lastName: string;
      firstName: string;
      email: string;
      companyName?: string;
    };
  };
}

export interface IGLTCreateLoadResponse {
  weightUnits: 'lbs';
  volumeUnits: any;
  trackingProvider: any;
  trackingProviderCustomer: any;
  trackingNumber: any;
  trackingNumberCustomer: any;
  totalWeight: number;
  totalVolume: any;
  tenderAcceptedDate: string;
  Stops: [
    {
      stopStatus: string;
      stopNumber: number;
      shippingReceivingHours: string;
      shippingContact: {
        phone: string;
        lastName: string;
        firstName: string;
        email: string;
      };
      references: string;
      pickupDeliveryNumber: string;
      milesAway: number;
      location: {
        shippingStateProvince: string;
        shippingPostalCode: string;
        shippingCountry: string;
        shippingCity: string;
        shippingAddress: string;
        companyName: string;
      };
      kilometersAway: number;
      isPickup: boolean;
      isDropOff: boolean;
      isGeolocation: boolean;
      instructions: any;
      expectedDate: string;
      departureTime: any;
      departureDate: any;
      cumulativeMiles: number;
      carrierStatusComments: any;
      carrierStatusAsOf: string;
      carrierStatus: string;
      carrierEtaTime: string;
      carrierEtaDate: string;
      arrivalTime: any;
      arrivalStatus: string;
      arrivalDate: any;
      appointmentTime: string;
      appointmentRequired: boolean;
      address: string;
    },
    {
      stopStatus: any;
      stopNumber: number;
      shippingReceivingHours: string;
      shippingContact: {
        phone: string;
        lastName: string;
        firstName: string;
        email: string;
      };
      references: any;
      pickupDeliveryNumber: any;
      milesAway: number;
      location: {
        shippingStateProvince: string;
        shippingPostalCode: string;
        shippingCountry: string;
        shippingCity: string;
        shippingAddress: string;
        companyName: string;
      };
      kilometersAway: number;
      isPickup: boolean;
      isDropOff: boolean;
      isGeolocation: boolean;
      instructions: any;
      expectedDate: any;
      departureTime: any;
      departureDate: any;
      cumulativeMiles: number;
      carrierStatusComments: any;
      carrierStatusAsOf: any;
      carrierStatus: any;
      carrierEtaTime: any;
      carrierEtaDate: any;
      arrivalTime: any;
      arrivalStatus: string;
      arrivalDate: any;
      appointmentTime: string;
      appointmentRequired: boolean;
      address: string;
    },
  ];
  stateLane: string;
  shipToAddress: string;
  shipStatus: string;
  shipFromAddress: string;
  scheduleStatus: string;
  proNumber: any;
  poNumber: any;
  podReceived: boolean;
  otherInstructions: any;
  origin: string;
  orderNumber: any;
  orderDate: string;
  modeName: 'LTL';
  loadStatusComments: any;
  loadStatus: string;
  loadPostingDescription: string;
  loadNumber: string;
  loadId: string;
  LineItems: [
    {
      weightUnits: 'lbs';
      weight: number;
      volumeUnits: any;
      volume: any;
      turnable: boolean;
      stackable: boolean;
      scheduleBCode: string;
      pickupStopNumber: number;
      packagingUnits: string;
      packagingUnitCount: number;
      nmfcNumber: string;
      nmfcClass: string;
      linearFeet: number;
      itemNumber: string;
      itemDescription: string;
      htsCode: string;
      hsCode: string;
      hazMatPackingGroup: any;
      hazMatNumber: any;
      hazMatContact: any;
      hazMatClassDivision: any;
      hazardousMaterials: boolean;
      handlingUnitWidth: number;
      handlingUnits: string;
      handlingUnitLength: number;
      handlingUnitHeight: number;
      handlingUnitCount: number;
      dimensionUnits: 'in';
      deliveryStopNumber: number;
    },
  ];
  linearFeet: number;
  lastReportedState: string;
  lastReportedLongitude: number;
  lastReportedLatitude: number;
  lastReportedCountry: string;
  lastReportedCity: string;
  lastModifiedDate: string;
  hazardousMaterials: boolean;
  expectedShipDate: string;
  expectedDeliveryDate: any;
  distanceMiles: number;
  distanceKilometers: number;
  destination: string;
  deliveryStatus: string;
  currencyCode: string;
  createdDate: string;
  containerTrailerNumber: string;
  cityLane: string;
  carrierUploads: any;
  carrier: string;
  cargoValue: number;
  bookingNumber: any;
  billOfLadingNumber: string;
  apiLoadId: any;
  Accessorials: [
    {
      stopNumber: number;
      accessorialName: string;
      accessorialId: string;
    },
    {
      stopNumber: number;
      accessorialName: string;
      accessorialId: string;
    },
  ];
}

export interface IGLTQuoteResponse {
  usedLiability: number;
  transitTime: number;
  serviceClass: string;
  rating: string;
  quoteNumber: string;
  quoteId: string;
  price: number;
  newliability: number;
  modeName: 'LTL';
  loadNumber: string;
  estimatedDelivery: any;
  directInterline: string;
  currencyCode: '$';
  carrier: string;
}

export interface IGLTTender {
  txn: {
    loadId: string;
    quoteId: string;
  };
}

export interface IGLTTenderResponse {
  tenderSuccessful: boolean;
  errorMessage: any;
  carrierBillToState: string;
  carrierBillToPostalCode: string;
  carrierBillToName: string;
  carrierBillToCountry: string;
  carrierBillToCity: string;
  carrierBillToAddress: string;
}

export interface IGLTAuthTokenResponse {
  'soapenv:Envelope': {
    $: {
      'xmlns:soapenv': string;
      xmlns: string;
      'xmlns:xsi': string;
    };
    'soapenv:Body': [
      {
        loginResponse: [
          {
            result: [
              {
                metadataServerUrl: [string];
                passwordExpired: [string];
                sandbox: [string];
                serverUrl: [string];
                sessionId: [string];
                userId: [string];
                userInfo: [
                  {
                    accessibilityMode: [string];
                    chatterExternal: [string];
                    currencySymbol: [{ $: { 'xsi:nil': string } }];
                    orgAttachmentFileSizeLimit: [string];
                    orgDefaultCurrencyIsoCode: [{ $: { 'xsi:nil': string } }];
                    orgDefaultCurrencyLocale: [{ $: { 'xsi:nil': string } }];
                    orgDisallowHtmlAttachments: [string];
                    orgHasPersonAccounts: [string];
                    organizationId: [string];
                    organizationMultiCurrency: [string];
                    organizationName: [string];
                    profileId: [string];
                    roleId: [string];
                    sessionSecondsValid: [string];
                    userDefaultCurrencyIsoCode: [string];
                    userEmail: [string];
                    userFullName: [string];
                    userId: [string];
                    userLanguage: [string];
                    userLocale: [string];
                    userName: [string];
                    userTimeZone: [string];
                    userType: [string];
                    userUiSkin: [string];
                  },
                ];
              },
            ];
          },
        ];
      },
    ];
  };
}

export interface IGLTLoadStatusResponse {
  stopList: [
    {
      stopStatus: string;
      stopNumber: number;
      stopName: string;
      milesAway: string;
      departureTime: string;
      departureDate: string;
      carrierStatus: string;
      carrierETATime: string;
      carrierETADate: string;
      arrivalTime: string;
      arrivalDate: string;
      appointmentTime: string;
      appointmentRequired: boolean;
    },
    {
      stopStatus: string;
      stopNumber: number;
      stopName: string;
      milesAway: number;
      departureTime: string;
      departureDate: string;
      carrierStatus: string;
      carrierETATime: string;
      carrierETADate: string;
      arrivalTime: string;
      arrivalDate: string;
      appointmentTime: string;
      appointmentRequired: boolean;
    },
  ];
  podList: [
    {
      fileType: string;
      fileName: string;
      contents: string;
    },
  ];
  loadStatusComments: string;
  loadStatus: string;
  loadName: string;
  loadId: string;
  lastReportedState: string;
  lastReportedLongitude: number;
  lastReportedLocation: string;
  lastReportedLatitude: number;
  lastReportedCountry: string;
  lastReportedCity: string;
}
