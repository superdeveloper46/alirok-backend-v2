import { CheckoutParcelMember } from '../../../../app/checkout/interface/checkout.interface';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../../dto/newCouriers.dto';

export interface DHLRateRequestBodyCustomerDetailsReceiverDetails {
  postalCode: string;
  cityName: string;
  countryCode: string;
  provinceCode: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  countyName?: string;
}

export interface DHLRateRequestBodyValueAddedServices {
  serviceCode: string;
  localServiceCode: string;
  value?: number;
  currency?: string;
}

export interface DHLRateRequestBodyCustomerDetailsShipperDetails {
  postalCode: string;
  cityName: string;
  countryCode: string;
  provinceCode: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  countyName?: string;
}

export interface DHLRateRequestBodyCustomerDetails {
  shipperDetails: DHLRateRequestBodyCustomerDetailsShipperDetails;
  receiverDetails: DHLRateRequestBodyCustomerDetailsReceiverDetails;
}

export interface DHLRateRequestBodyAccounts {
  typeCode: string;
  number: string;
}

export interface DHLRateRequestBodyAccountsPackages {
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

export interface DHLRateRequestBody {
  customerDetails: DHLRateRequestBodyCustomerDetails;
  plannedShippingDateAndTime: string;
  unitOfMeasurement: 'metric';
  isCustomsDeclarable: boolean;
  returnStandardProductsOnly?: boolean;
  requestAllValueAddedServices?: true;
  valueAddedServices?: DHLRateRequestBodyValueAddedServices[];
  packages: DHLRateRequestBodyAccountsPackages[];
  accounts: DHLRateRequestBodyAccounts[];
  productCode?: string;
}

export interface DHLDropoffLocation {
  url: string;
  location: {
    ids: [
      {
        locationId: string;
        provider: string;
      },
    ];
    keyword: string;
    keywordId: string;
    type: 'servicepoint' | 'locker' | 'postoffice' | 'postbank';
  };
  name: string;
  distance: number;
  place: {
    address: {
      countryCode: string;
      postalCode: string;
      addressLocality: string;
      streetAddress: string;
    };
    geo: {
      latitude: number;
      longitude: number;
    };
  };
  openingHours: [
    {
      opens: string;
      closes: string;
      dayOfWeek:
        | 'Monday'
        | 'Tuesday'
        | 'Wednesday'
        | 'Thursday'
        | 'Friday'
        | 'Saturday'
        | 'Sunday';
    },
  ];
  closurePeriods: [];
  serviceTypes: string[];
  averageCapacityDayOfWeek: [
    {
      dayOfWeek:
        | 'Monday'
        | 'Tuesday'
        | 'Wednesday'
        | 'Thursday'
        | 'Friday'
        | 'Saturday'
        | 'Sunday';
      capacity: 'high' | 'low' | 'very-low' | 'unknown';
    },
  ];
}

export interface DHLDropoffLocations {
  locations: DHLDropoffLocation[];
  status?: number;
  title?: string;
  detail?: string;
}

export interface DHLTrackingShipmentShipperDetailsReturn {
  name: string;
  postalAddress: {
    cityName: string;
    countyName: string;
    postalCode: string;
    provinceCode: string;
    countryCode: string;
  };
  serviceArea: [
    {
      code: string;
      description: string;
      outboundSortCode: string;
    },
  ];
  accountNumber: string;
}

export interface DHLTrackingShipmentReceiverDetailsReturn {
  name: string;
  postalAddress: {
    cityName: string;
    countyName: string;
    postalCode: string;
    provinceCode: string;
    countryCode: string;
  };
  serviceArea: [
    {
      code: string;
      description: string;
      facilityCode: string;
      inboundSortCode: string;
    },
  ];
}

export interface DHLTrackingShipmentShipperReferenceReturn {
  value: string;
  typeCode:
    | 'AAO'
    | 'CU'
    | 'FF'
    | 'FN'
    | 'IBC'
    | 'LLR'
    | 'OBC'
    | 'PRN'
    | 'ACP'
    | 'ACS'
    | 'ACR'
    | 'CDN'
    | 'STD'
    | 'CO';
}

export interface DHLTrackingShipmentEventsReturn {
  date: string;
  time: string;
  typeCode: string;
  description: string;
  serviceArea: [
    {
      code: string;
      description: string;
    },
  ];
  signedBy: string;
}

export interface DHLTrackingShipmentPieceReturn {
  number: number;
  typeCode: string;
  shipmentTrackingNumber: string;
  trackingNumber: string;
  description: string;
  weight: number;
  dimensionalWeight: number;
  actualWeight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  actualDimensions: {
    length: number;
    width: number;
    height: number;
  };
  unitOfMeasurements: string;
  shipperReferences: DHLTrackingShipmentShipperReferenceReturn[];
  events: DHLTrackingShipmentEventsReturn[];
}

export interface DHLTrackingShipmentReturn {
  shipmentTrackingNumber: string;
  status: string;
  shipmentTimestamp: string;
  productCode: string;
  description: string;
  shipperDetails: DHLTrackingShipmentShipperDetailsReturn;
  receiverDetails: DHLTrackingShipmentReceiverDetailsReturn;
  totalWeight: number;
  unitOfMeasurements: string;
  shipperReferences: DHLTrackingShipmentShipperReferenceReturn[];
  events: DHLTrackingShipmentEventsReturn[];
  numberOfPieces: number;
  pieces: DHLTrackingShipmentPieceReturn[];
  estimatedDeliveryDate: string;
  childrenShipmentIdentificationNumbers: [string];
}

export interface DHLTrackingReturn {
  shipments: DHLTrackingShipmentReturn[];
}

export interface DHLRateRequestProductsTotalPriceBreadownReturn {
  currencyType: 'BILLC' | 'PULCL' | 'BASEC';
  priceCurrency: string;
  priceBreakdown: [
    {
      typeCode: 'STTXA' | 'STDIS' | 'SPRQT';
      price: number;
    },
  ];
}

export interface DHLRateRequestProductsDetailedPriceBreadownReturn {
  currencyType: 'BILLC' | 'PULCL' | 'BASEC';
  priceCurrency: string;
  breakdown: [
    {
      name: string;
      serviceCode: string;
      localServiceCode: string;
      typeCode: string;
      serviceTypeCode: string;
      price: number;
      priceCurrency: string;
      isCustomerAgreement: boolean;
      isMarketedService: boolean;
      isBillingServiceIndicator: boolean;
      priceBreakdown: [
        {
          priceType: 'TAX' | 'DISCOUNT';
          typeCode: 'P' | 'S' | 'DISCOUNT';
          price: number;
          rate: number;
          basePrice: number;
        },
      ];
      tariffRateFormula: [string];
    },
  ];
}

export interface DHLRateRequestProductsPickupCapabilitiesReturn {
  nextBusinessDay: boolean;
  localCutoffDateAndTime: string;
  GMTCutoffTime: string;
  pickupEarliest: string;
  pickupLatest: string;
  originServiceAreaCode: string;
  originFacilityAreaCode: string;
  pickupAdditionalDays: number;
  pickupDayOfWeek: number;
}

export interface DHLRateRequestProductsDeliveryCapabilitiesReturn {
  deliveryTypeCode: 'QDDF' | 'QDDC';
  estimatedDeliveryDateAndTime: string;
  destinationServiceAreaCode: string;
  destinationFacilityAreaCode: string;
  deliveryAdditionalDays: number;
  deliveryDayOfWeek: number;
  totalTransitDays: number;
}

export interface DHLRateRequestProductsItemsReturn {
  number: number;
  breakdown: [
    {
      name: string;
      serviceCode: string;
      localServiceCode: string;
      typeCode: 'DUTY' | 'TAX' | 'FEE';
      serviceTypeCode: 'FEE' | 'XCH' | 'SCH' | 'NRI';
      price: number;
      priceCurrency: string;
      isCustomerAgreement: boolean;
      isMarketedService: boolean;
      isBillingServiceIndicator: boolean;
      priceBreakdown: [
        {
          priceType: 'P' | 'S';
          typeCode: 'TAX' | 'DISCOUNT';
          price: number;
          rate: number;
          basePrice: number;
        },
      ];
      tariffRateFormula: [string];
    },
  ];
}
export interface DHLRateRequestProductsReturn {
  productName: string;
  productCode: string;
  localProductCode: string;
  localProductCountryCode: string;
  networkTypeCode: 'TD' | 'DD';
  isCustomerAgreement: boolean;
  weight: {
    volumetric: number;
    provided: number;
    unitOfMeasurement: string;
  };
  totalPrice: [
    {
      currencyType: 'BILLC' | 'PULCL' | 'BASEC';
      priceCurrency: string;
      price: number;
    },
  ];
  totalPriceBreakdown: DHLRateRequestProductsTotalPriceBreadownReturn[];
  detailedPriceBreakdown: DHLRateRequestProductsDetailedPriceBreadownReturn[];
  pickupCapabilities: DHLRateRequestProductsPickupCapabilitiesReturn;
  deliveryCapabilities: DHLRateRequestProductsDeliveryCapabilitiesReturn;
  items: DHLRateRequestProductsItemsReturn[];
  pricingDate: string;
}

export interface DHLRateRequestExchangeRatesReturn {
  currentExchangeRate: number;
  currency: string;
  baseCurrency: string;
}

export interface DHLRateRequestReturn {
  products: DHLRateRequestProductsReturn[];
  exchangeRates: DHLRateRequestExchangeRatesReturn[];
  warnings: [string];
}

export interface DHLCreateShipmentParentShipment {
  productCode: string;
  packagesCount: number;
}

export interface DHLCreateShipmentPrepaidCharges {
  typeCode: 'freight';
  currency: string;
  value: number;
  method: 'cash';
}

export interface DHLCreateShipmentShipmentNotification {
  typeCode: 'email';
  receiverId: string;
  languageCode?: string;
  languageCountryCode?: string;
  bespokeMessage?: string;
}

export interface DHLCreateShipmentDocumentImagesDefinition {
  typeCode?: 'INV' | 'PNV' | 'COO' | 'NAF' | 'CIN' | 'DCL' | 'AWB';
  imageFormat?: 'PDF' | 'PNG' | 'GIF' | 'TIFF' | 'JPEG';
  content: string;
}

export interface DHLCreateShipmentContentPackage {
  typeCode?:
    | '3BX'
    | '2BC'
    | '2BP'
    | 'CE1'
    | '7BX'
    | '6BX'
    | '4BX'
    | '2BX'
    | '1CE'
    | 'WB1'
    | 'WB3'
    | 'XPD'
    | '8BX'
    | '5BX'
    | 'WB6'
    | 'TBL'
    | 'TBS'
    | 'WB2';
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  customerReferences?: [
    {
      value: string;
      typeCode?:
        | 'AAO'
        | 'CU'
        | 'FF'
        | 'FN'
        | 'IBC'
        | 'LLR'
        | 'OBC'
        | 'PRN'
        | 'ACP'
        | 'ACS'
        | 'ACR'
        | 'CDN'
        | 'STD'
        | 'CO'
        | 'LID';
    },
  ];
  identifiers?: [
    {
      typeCode: 'parentId' | 'shipmentId' | 'pieceId';
      value: string;
    },
  ];
  description?: string;
  labelBarcodes?: [
    {
      position: 'left' | 'right';
      symbologyCode: '93' | '39' | '128';
      content: string;
      textBelowBarcode: string;
    },
  ];
  labelText?: [
    {
      position: 'left' | 'right';
      caption: string;
      value: string;
    },
  ];
  labelDescription?: string;
}

export interface DHLCreateShipmentContentExportDeclarationLineItem {
  number: number;
  description: string;
  price: number;
  quantity: {
    value: number;
    unitOfMeasurement:
      | 'BOX'
      | '2GM'
      | '2M'
      | '2M3'
      | '3M3'
      | 'M3'
      | 'DPR'
      | 'DOZ'
      | '2NO'
      | 'PCS'
      | 'GM'
      | 'GRS'
      | 'KG'
      | 'L'
      | 'M'
      | '3GM'
      | '3L'
      | 'X'
      | 'NO'
      | '2KG'
      | 'PRS'
      | '2L'
      | '3KG'
      | 'CM2'
      | '2M2'
      | '3M2'
      | 'M2'
      | '4M2'
      | '3M';
  };
  commodityCodes?: [
    {
      typeCode: 'outbound' | 'inbound';
      value: string;
    },
  ];
  exportReasonType?:
    | 'permanent'
    | 'temporary'
    | 'return'
    | 'used_exhibition_goods_to_origin'
    | 'intercompany_use'
    | 'commercial_purpose_or_sale'
    | 'personal_belongings_or_personal_use'
    | 'sample'
    | 'gift'
    | 'return_to_origin'
    | 'warranty_replacement'
    | 'diplomatic_goods'
    | 'defence_material';
  manufacturerCountry: string;
  exportControlClassificationNumber?: string;
  weight: {
    netValue: number;
    grossValue: number;
  };
  isTaxesPaid?: boolean;
  additionalInformation?: string[];
  customerReferences?: [
    {
      typeCode:
        | 'AFE'
        | 'BRD'
        | 'DGC'
        | 'AAJ'
        | 'INB'
        | 'MAK'
        | 'ALX'
        | 'PAN'
        | 'PON'
        | 'ABW'
        | 'SE'
        | 'SON'
        | 'OID'
        | 'DTC'
        | 'DTM'
        | 'DTQ'
        | 'DTR'
        | 'ITR'
        | 'MID'
        | 'OED'
        | 'OET'
        | 'OOR'
        | 'SME'
        | 'USM'
        | 'AAM'
        | 'CFR'
        | 'DOM'
        | 'FOR'
        | 'USG'
        | 'MAT';
      value: string;
    },
  ];
  customsDocuments?: [
    {
      typeCode:
        | '972'
        | 'AHC'
        | 'ALC'
        | 'ATA'
        | 'ATR'
        | 'BEX'
        | 'CHA'
        | 'CHD'
        | 'CHP'
        | 'CIT'
        | 'CIV'
        | 'CI2'
        | 'COO'
        | 'CPA'
        | 'CRL'
        | 'CSD'
        | 'DEX'
        | 'DGD'
        | 'DLI'
        | 'DOV'
        | 'ELP'
        | 'EU1'
        | 'EU2'
        | 'EUS'
        | 'EXL'
        | 'FMA'
        | 'HLC'
        | 'HWB'
        | 'INV'
        | 'IPA'
        | 'JLC'
        | 'LIC'
        | 'LNP'
        | 'NID'
        | 'PAS'
        | 'PFI'
        | 'PHY'
        | 'PLI'
        | 'POA'
        | 'PPY'
        | 'ROD'
        | 'T2M'
        | 'TAD'
        | 'TCS'
        | 'VET'
        | 'VEX';
      value: string;
    },
  ];
}

export interface DHLCreateShipmentContentExportDeclarationInvoice {
  number: string;
  date: string;
  signatureName?: string;
  signatureTitle?: string;
  signatureImage?: string;
  instructions?: string[];
  customerDataTextEntries?: string[];
  function?: 'import' | 'export' | 'both';
  totalNetWeight?: number;
  totalGrossWeight?: number;
  customerReferences?: [
    {
      typeCode:
        | 'ACL'
        | 'CID'
        | 'CN'
        | 'CU'
        | 'ITN'
        | 'UCN'
        | 'MRN'
        | 'OID'
        | 'PON'
        | 'RMA'
        | 'AAM'
        | 'ABT'
        | 'ADA'
        | 'AES'
        | 'AFD'
        | 'ANT'
        | 'BKN'
        | 'BOL'
        | 'CDN'
        | 'COD'
        | 'DSC'
        | 'FF'
        | 'FN'
        | 'FTR'
        | 'HWB'
        | 'IBC'
        | 'IPP'
        | 'LLR'
        | 'MAB'
        | 'MWB'
        | 'NLR'
        | 'OBC'
        | 'PD'
        | 'PRN'
        | 'RTL'
        | 'SID'
        | 'SS'
        | 'SWN';
      value: string;
    },
  ];
  termsOfPayment?: string;
}

export interface DHLCreateShipmentContentExportDeclarationRemarks {
  value: string;
}

export interface DHLCreateShipmentContentExportDeclarationAdditionalCharges {
  value: number;
  caption?: string;
  typeCode:
    | 'admin'
    | 'delivery'
    | 'documentation'
    | 'expedite'
    | 'export'
    | 'freight'
    | 'fuel_surcharge'
    | 'logistic'
    | 'other'
    | 'packaging'
    | 'pickup'
    | 'handling'
    | 'vat'
    | 'insurance'
    | 'reverse_charge';
}

export interface DHLCreateShipmentContentExportDeclaration {
  lineItems: DHLCreateShipmentContentExportDeclarationLineItem[];
  invoice?: DHLCreateShipmentContentExportDeclarationInvoice;
  remarks?: DHLCreateShipmentContentExportDeclarationRemarks[];
  additionalCharges?: DHLCreateShipmentContentExportDeclarationAdditionalCharges[];
  destinationPortName?: string;
  placeOfIncoterm?: string;
  payerVATNumber?: string;
  recipientReference?: string;
  exporter?: {
    id?: string;
    code?: string;
  };
  packageMarks?: string;
  declarationNotes?: [
    {
      value: string;
    },
  ];
  exportReference?: string;
  exportReason?: string;
  exportReasonType?:
    | 'permanent'
    | 'temporary'
    | 'return'
    | 'used_exhibition_goods_to_origin'
    | 'intercompany_use'
    | 'commercial_purpose_or_sale'
    | 'personal_belongings_or_personal_use'
    | 'sample'
    | 'gift'
    | 'return_to_origin'
    | 'warranty_replacement'
    | 'diplomatic_goods'
    | 'defence_material';
  licenses?: [
    {
      typeCode: 'export' | 'import';
      value: string;
    },
  ];
  shipmentType?: 'personal' | 'commercial';
  customsDocuments?: [
    {
      typeCode:
        | '972'
        | 'AHC'
        | 'ALC'
        | 'ATA'
        | 'ATR'
        | 'BEX'
        | 'CHA'
        | 'CHD'
        | 'CHP'
        | 'CIT'
        | 'CIV'
        | 'CI2'
        | 'COO'
        | 'CPA'
        | 'CRL'
        | 'CSD'
        | 'DEX'
        | 'DGD'
        | 'DLI'
        | 'DOV'
        | 'ELP'
        | 'EU1'
        | 'EU2'
        | 'EUS'
        | 'EXL'
        | 'FMA'
        | 'HLC'
        | 'HWB'
        | 'INV'
        | 'IPA'
        | 'JLC'
        | 'LIC'
        | 'LNP'
        | 'NID'
        | 'PAS'
        | 'PFI'
        | 'PHY'
        | 'PLI'
        | 'POA'
        | 'PPY'
        | 'ROD'
        | 'T2M'
        | 'TAD'
        | 'TCS'
        | 'VET'
        | 'VEX';
      value: string;
    },
  ];
}

export interface DHLCreateShipmentContent {
  packages: DHLCreateShipmentContentPackage[];
  isCustomsDeclarable: boolean;
  declaredValue?: number;
  declaredValueCurrency?: string;
  exportDeclaration?: DHLCreateShipmentContentExportDeclaration;
  description: string;
  USFilingTypeValue?: string;
  incoterm?:
    | 'EXW'
    | 'FCA'
    | 'CPT'
    | 'CIP'
    | 'DPU'
    | 'DAP'
    | 'DDP'
    | 'FAS'
    | 'FOB'
    | 'CFR'
    | 'CIF';
  unitOfMeasurement: 'metric' | 'imperial';
}

export interface DHLCreateShipmentPickUp {
  isRequested: boolean;
  closeTime?: string;
  location?: string;
  specialInstructions?: [
    {
      value: string;
      typeCode?: string;
    },
  ];
  pickupDetails?: {
    postalAddress: {
      postalCode: string;
      cityName: string;
      countryCode: string;
      provinceCode?: string;
      addressLine1: string;
      addressLine2?: string;
      addressLine3?: string;
      countyName?: string;
    };
    contactInformation: {
      email: string;
      phone: string;
      mobilePhone?: string;
      companyName?: string;
      fullName?: string;
    };
    registrationNumbers?: [
      {
        typeCode: string;
        number: string;
        issuerCountryCode: string;
      },
    ];
    bankDetails?: [
      {
        name?: string;
        settlementLocalCurrency?: string;
        settlementForeignCurrency?: string;
      },
    ];
    typeCode?:
      | 'business'
      | 'direct_consumer'
      | 'government'
      | 'other'
      | 'private'
      | 'reseller';
  };
  pickupRequestorDetails?: {
    postalAddress: {
      postalCode: string;
      cityName: string;
      countryCode: string;
      provinceCode?: string;
      addressLine1?: string;
      addressLine2?: string;
      addressLine3?: string;
      countyName?: string;
    };
    contactInformation?: {
      email: string;
      phone?: string;
      mobilePhone: string;
      companyName?: string;
      fullName?: string;
    };
    registrationNumbers?: [
      {
        typeCode: string;
        number: string;
        issuerCountryCode: string;
      },
    ];
    bankDetails?: [
      {
        name?: string;
        settlementLocalCurrency?: string;
        settlementForeignCurrency?: string;
      },
    ];
    typeCode?:
      | 'business'
      | 'direct_consumer'
      | 'government'
      | 'other'
      | 'private'
      | 'reseller';
  };
}

export interface DHLCreateShipmentOnDemandDelivery {
  deliveryOption: 'servicepoint' | 'neighbour' | 'signatureRelease';
  location?: string;
  specialInstructions?: string;
  gateCode?: string;
  whereToLeave?: 'concierge' | 'neighbour';
  neighbourName?: string;
  neighbourHouseNumber?: string;
  authorizerName?: string;
  servicePointId?: string;
  requestedDeliveryDate?: string;
}

export interface DHLCreateShipmentAccount {
  typeCode: string;
  number: string;
}

export interface DHLCreateShipmentValueAdded {
  serviceCode: string;
  value?: number;
  currency?: string;
  method?: string;
  dangerousGoods?: [
    {
      contentId: string;
      dryIceTotalNetWeight: number;
      unCode: string;
    },
  ];
}

export interface DHLCreateShipmentOutputImageProperties {
  printerDPI?: 200 | 300;
  customerBarcodes?: [
    {
      content: string;
      textBelowBarcode?: string;
      symbologyCode: string;
    },
  ];
  customerLogos?: [
    {
      fileFormat: 'PNG' | 'GIF' | 'JPEG' | 'JPG';
      content: string;
    },
  ];
  encodingFormat?: 'pdf' | 'zpl' | 'lp2' | 'epl';
  imageOptions?: [
    {
      typeCode: 'label' | 'waybillDoc' | 'invoice' | 'receipt' | 'qr-code';
      templateName?: string;
      isRequested?: boolean;
      hideAccountNumber?: boolean;
      numberOfCopies?: number;
      invoiceType?: 'commercial' | 'proforma';
      languageCode?: string;
      encodingFormat?: 'png';
      renderDHLLogo?: boolean;
    },
  ];
  splitTransportAndWaybillDocLabels?: boolean;
  allDocumentsInOneImage?: boolean;
  splitDocumentsByPages?: boolean;
  splitInvoiceAndReceipt?: boolean;
}

export interface DHLCreateShipmentCustomerReferences {
  value: string;
  typeCode?:
    | 'AAO'
    | 'CU'
    | 'FF'
    | 'FN'
    | 'IBC'
    | 'LLR'
    | 'OBC'
    | 'PRN'
    | 'ACP'
    | 'ACS'
    | 'ACR'
    | 'CDN'
    | 'STD'
    | 'CO';
}

export interface DHLCreateShipmentIdentifiers {
  typeCode: 'parentId' | 'shipmentId' | 'pieceId';
  value: string;
}

export interface DHLCreateCreateShipmentCustomerDetailsPostalAddress {
  postalCode: string;
  cityName: string;
  countryCode: string;
  provinceCode?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  countyName?: string;
}

export interface DHLCreateCreateShipmentCustomerDetailsContactInformation {
  email: string;
  phone: string;
  mobilePhone?: string;
  companyName?: string;
  fullName?: string;
}

export interface DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers {
  typeCode:
    | 'VAT'
    | 'EIN'
    | 'GST'
    | 'SSN'
    | 'EOR'
    | 'DUN'
    | 'FED'
    | 'STA'
    | 'CNP'
    | 'IE'
    | 'INN'
    | 'KPP'
    | 'OGR'
    | 'OKP'
    | 'MRN'
    | 'SDT'
    | 'FTZ'
    | 'DAN'
    | 'TAN'
    | 'DTF'
    | 'RGP'
    | 'DLI'
    | 'NID'
    | 'PAS'
    | 'MID';
  number: string;
  issuerCountryCode: string;
}

export interface DHLCreateCreateShipmentCustomerDetailsBankDetails {
  name: string;
  settlementLocalCurrency: string;
  settlementForeignCurrency: string;
}

export interface DHLCreateCreateShipmentCustomerDetailsShiperDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers?: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails?: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode?:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetailsReceiverDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers?: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails?: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode?:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetailsBuyerDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetailsImporterDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetailsExporterDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetailsSellerDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetailsPayerDetails {
  postalAddress: DHLCreateCreateShipmentCustomerDetailsPostalAddress;
  contactInformation: DHLCreateCreateShipmentCustomerDetailsContactInformation;
  registrationNumbers: DHLCreateCreateShipmentCustomerDetailsRegistrationNumbers[];
  bankDetails: DHLCreateCreateShipmentCustomerDetailsBankDetails[];
  typeCode:
    | 'business'
    | 'direct_consumer'
    | 'government'
    | 'other'
    | 'private'
    | 'reseller';
}

export interface DHLCreateCreateShipmentCustomerDetails {
  shipperDetails: DHLCreateCreateShipmentCustomerDetailsShiperDetails;
  receiverDetails: DHLCreateCreateShipmentCustomerDetailsReceiverDetails;
  buyerDetails?: DHLCreateCreateShipmentCustomerDetailsBuyerDetails;
  importerDetails?: DHLCreateCreateShipmentCustomerDetailsImporterDetails;
  exporterDetails?: DHLCreateCreateShipmentCustomerDetailsExporterDetails;
  sellerDetails?: DHLCreateCreateShipmentCustomerDetailsSellerDetails;
  payerDetails?: DHLCreateCreateShipmentCustomerDetailsPayerDetails;
}

export interface DHLCreateShipment {
  plannedShippingDateAndTime: string;
  pickup: DHLCreateShipmentPickUp;
  productCode: string;
  localProductCode: string;
  getRateEstimates?: boolean;
  accounts: DHLCreateShipmentAccount[];
  valueAddedServices?: DHLCreateShipmentValueAdded[];
  outputImageProperties?: DHLCreateShipmentOutputImageProperties;
  customerReferences?: DHLCreateShipmentCustomerReferences[];
  identifiers?: DHLCreateShipmentIdentifiers[];
  customerDetails: DHLCreateCreateShipmentCustomerDetails;
  content: DHLCreateShipmentContent;
  documentImages?: DHLCreateShipmentDocumentImagesDefinition[];
  onDemandDelivery?: DHLCreateShipmentOnDemandDelivery;
  requestOndemandDeliveryURL?: boolean;
  shipmentNotification?: DHLCreateShipmentShipmentNotification[];
  prepaidCharges?: DHLCreateShipmentPrepaidCharges[];
  getOptionalInformation?: boolean;
  parentShipment?: DHLCreateShipmentParentShipment;
}

export interface DHLCreateShipmentRequestBodyQuotePackageMeta {
  type: string;
  package_quantity: number;
  weight_total: number;
  weight_unit: 'KGS' | 'LBS';
  measure_unit: 'CM' | 'IN';
  cargo_value: number;
  currency: { code: string; symbol: string };
  has_perfume: boolean;
  has_battery: boolean;
}

export interface DHLCreateShipmentRequestBodyQuotePackageItem {
  commodity: {
    value: {
      other: string;
      superior: any;
      indent: string;
      description: string;
      statisticalSuffix: string;
      score: string;
      special: string;
      htsno: string;
      footnotes: string;
      general: string;
      units: [string];
    };
    label: string;
  };
  unit_price: string;
  quantity: number;
}

export interface DHLCreateShipmentRequestBodyQuotePackage {
  weight: string;
  width: string;
  height: string;
  length: string;
  quantity: number;
  items: DHLCreateShipmentRequestBodyQuotePackageItem[];
  contains: { perfume: false; battery: false };
}

export interface DHLCreateShipmentRequestBodyQuoteDestination {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
  street: string;
  street_number: string;
  is_residential_address: boolean;
  complement_address: string;
}

export interface DHLCreateShipmentRequestBodyQuoteOrigin {
  country: string;
  state: string;
  city: string;
  postal_code: string;
  address: string;
  street: string;
  street_number: string;
  is_residential_address: boolean;
  complement_address: string;
}

export interface DHLCreateShipmentRequestBodyQuote {
  origin: DHLCreateShipmentRequestBodyQuoteOrigin;
  destination: DHLCreateShipmentRequestBodyQuoteDestination;
  ship_date: string;
  packages: DHLCreateShipmentRequestBodyQuotePackage[];
  packages_meta: DHLCreateShipmentRequestBodyQuotePackageMeta;
}

export interface DHLCreateShipmentRequestBodyRecipient {
  full_name: string;
  category: string;
  tax_id: string;
  address: {
    country: string;
    state: string;
    city: string;
    postal_code: string;
    address: string;
    street: string;
    street_number: string;
    is_residential_address: boolean;
    complement_address: string;
  };
  email: string;
  phone: { prefix: string; number: string };
}

export interface DHLCreateShipmentRequestBodySender {
  full_name: string;
  category: string;
  tax_id: string;
  address: {
    country: string;
    state: string;
    city: string;
    postal_code: string;
    address: string;
    street: string;
    street_number: string;
    is_residential_address: boolean;
    complement_address: string;
  };
  email: string;
  phone: { prefix: string; number: string };
}

export interface DHLCreateShipmentRequestBodyProduct {
  productCode: string;
  localProductCode: string;
}

export interface DHLCreateShipmentRequestBody {
  quote: NewRateShipmentDTO;
  recipient: CheckoutParcelMember;
  parcel_serial_number: number;
  sender: CheckoutParcelMember;
  order: NewRateShipmentReturnDTO;
}

export interface DHLCreateShipmentReturn {
  url: string;
  shipmentTrackingNumber: string;
  cancelPickupUrl: string;
  trackingUrl: string;
  dispatchConfirmationNumber: string;
  packages: [
    {
      referenceNumber: number;
      trackingNumber: string;
      trackingUrl: string;
      volumetricWeight: number;
      documents: [
        {
          imageFormat: string;
          content: string;
          typeCode: string;
        },
      ];
    },
  ];
  documents: [
    {
      imageFormat: string;
      content: string;
      typeCode: string;
    },
  ];
  onDemandDeliveryURL: string;
  shipmentDetails: [
    {
      serviceHandlingFeatureCodes: [string];
      volumetricWeight: number;
      billingCode: string;
      serviceContentCode: string;
      customerDetails: {
        shipperDetails: {
          postalAddress: {
            postalCode: string;
            cityName: string;
            countryCode: string;
            provinceCode: string;
            addressLine1: string;
            addressLine2: string;
            addressLine3: string;
            cityDistrictName: string;
          };
          contactInformation: {
            companyName: string;
            fullName: string;
          };
        };
        receiverDetails: {
          postalAddress: {
            postalCode: string;
            cityName: string;
            countryCode: string;
            provinceCode: string;
            addressLine1: string;
            addressLine2: string;
            addressLine3: string;
            cityDistrictName: string;
          };
          contactInformation: {
            companyName: string;
            fullName: string;
          };
        };
      };
    },
  ];
  shipmentCharges: [
    {
      currencyType: 'BILLC' | 'PULCL' | 'BASEC';
      priceCurrency: string;
      price: number;
      serviceBreakdown: [
        {
          name: string;
          price: number;
          typeCode: string;
        },
      ];
    },
  ];
  warnings: [string];
}

export interface DHLLandedCostRequest {
  customerDetails: {
    receiverDetails: {
      countryCode: string;
      postalCode: string;
      cityName: string;
      provinceCode: string;
      addressLine1: string;
    };
    shipperDetails: {
      countryCode: string;
      postalCode: string;
      cityName: string;
      provinceCode: string;
      addressLine1: string;
    };
  };
  accounts: [
    {
      typeCode: string;
      number: string;
    },
  ];
  unitOfMeasurement: 'metric';
  currencyCode: string;
  productCode: string;
  localProductCode: string;
  isCustomsDeclarable: true;
  isDTPRequested: true;
  getCostBreakdown: true;
  shipmentPurpose: string;
  transportationMode: 'air';
  merchantSelectedCarrierName: 'DHL';
  packages: [
    {
      weight: number;
      dimensions: {
        length: number;
        width: number;
        height: number;
      };
    },
  ];
  items: [
    {
      number: number;
      quantity: number;
      unitPrice: number;
      unitPriceCurrencyCode: string;
      customsValueCurrencyCode: string;
      commodityCode: string;
      weight: number;
      weightUnitOfMeasurement: 'metric';
      estimatedTariffRateType: 'default_rate';
    },
  ];
}

export interface DHLLandedCostReturn {
  products: [
    {
      totalPrice: [
        {
          priceCurrency: string;
          price: number;
        },
      ];
      detailedPriceBreakdown: [
        {
          priceCurrency: string;
          breakdown: [
            {
              name: string;
              price: number;
              priceCurrency: string;
              typeCode: string;
              serviceCode: string;
            },
          ];
        },
      ];
      items: [
        {
          number: number;
          breakdown: [
            {
              name: string;
              price: number;
              priceCurrency: string;
              tariffRateFormula: string;
            },
          ];
        },
      ];
    },
  ];
}

export interface IDhlRequestPickup {
  plannedPickupDateAndTime: string;
  closeTime: '18:00';
  accounts: [
    {
      typeCode: string;
      number: string;
    },
  ];
  customerDetails: {
    shipperDetails: {
      postalAddress: {
        postalCode: string;
        cityName: string;
        countryCode: string;
        provinceCode: string;
        addressLine1: string;
      };
      contactInformation: {
        phone: string;
        companyName: string;
        fullName: string;
      };
    };
    receiverDetails: {
      postalAddress: {
        postalCode: string;
        cityName: string;
        countryCode: string;
        provinceCode: string;
        addressLine1: string;
      };
      contactInformation: {
        phone: string;
        companyName: string;
        fullName: string;
      };
    };
    bookingRequestorDetails: {
      postalAddress: {
        postalCode: string;
        cityName: string;
        countryCode: string;
        provinceCode: string;
        addressLine1: string;
      };
      contactInformation: {
        phone: string;
        companyName: string;
        fullName: string;
      };
    };
    pickupDetails: {
      postalAddress: {
        postalCode: string;
        cityName: string;
        countryCode: string;
        provinceCode: string;
        addressLine1: string;
      };
      contactInformation: {
        phone: string;
        companyName: string;
        fullName: string;
      };
    };
  };
  shipmentDetails: [
    {
      productCode: string;
      localProductCode: string;
      accounts: [
        {
          typeCode: string;
          number: string;
        },
      ];
      valueAddedServices: [
        {
          serviceCode: string;
          localServiceCode: string;
        },
      ];
      isCustomsDeclarable: boolean;
      unitOfMeasurement: 'metric' | 'imperial';
      packages: [
        {
          weight: number;
          dimensions: {
            length: number;
            width: number;
            height: number;
          };
        },
      ];
    },
  ];
}
