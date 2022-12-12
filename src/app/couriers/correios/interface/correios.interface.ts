export interface CorreiosTrackingNumberBalanceReturn {
  maxQuantity: number;
  requestedQuantity: number;
  availableQuantity: number;
  totalUsed: number;
  totalUnused: number;
}

export interface CorreiosPackage {
  customerControlCode: string;
  senderName: string;
  senderAddress: string;
  senderAddressNumber: number;
  senderAddressComplement: string;
  senderZipCode: string;
  senderCityName: string;
  senderState: string;
  senderCountryCode: string;
  senderEmail: string;
  senderWebsite: string;
  recipientName: string;
  recipientDocumentType: string;
  recipientDocumentNumber: string;
  recipientAddress: string;
  recipientAddressNumber: string;
  recipientAddressComplement: string;
  recipientCityName: string;
  recipientState: string;
  recipientZipCode: string;
  recipientEmail: string;
  recipientPhoneNumber: string;
  totalWeight: number;
  packagingLength: number;
  packagingWidth: number;
  packagingHeight: number;
  distributionModality: number;
  taxPaymentMethod: 'DDU';
  currency: 'USD';
  freightPaidValue: number;
  insurancePaidValue: number;
  items: [
    {
      hsCode: string;
      description: string;
      quantity: number;
      value: number;
    },
  ];
}

export interface CorreiosPackageCollectionReturn {
  packageResponseList: [
    {
      customerControlCode: string;
      trackingNumber: string;
    },
  ];
}

export interface CorreiosPackageCollectionRequest {
  packageList: CorreiosPackage[];
}

export interface CorreiosUnitRequest {
  dispatchNumber: number;
  originCountry: string;
  originOperatorName: string;
  destinationOperatorName: 'SAOD' | 'CRBA';
  postalCategoryCode: 'A' | 'B' | 'C' | 'D';
  serviceSubclassCode: 'NX' | 'IX' | 'XP';
  unitList: [
    {
      sequence: number;
      unitType: number;
      trackingNumbers: string[];
    },
  ];
}

export interface CorreiosUnitRequestReturn {
  unitResponseList: [
    {
      sequence: number;
      unitCode: string;
    },
  ];
}

export interface CorreiosGetUnitRequestReturn {
  dispatchNumber: number;
  unitList: [
    {
      unitCode: string;
      trackingNumbers: string[];
    },
  ];
}

export interface CorreiosCn38Request {
  dispatchNumbers: number[];
}

export interface CorreiosCn38Return {
  requestId: string;
  dispatchNumbers: number[];
  requestStatus: 'Pending' | 'Processing' | 'Success' | 'Error';
}

export interface CorreiosConfirmDepartureRequest {
  cn38CodeList: string[];
  flightList: [
    {
      flightNumber: number;
      airlineCode: string;
      departureDate: string;
      departureAirportCode: string;
      arrivalDate: string;
      arrivalAirportCode: string;
    },
  ];
}
