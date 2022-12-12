import {
  RateShipmentPackageMetaDTO,
  RateShipmentPackagesDTO,
} from '../../dto/couriers.dto';
import {
  NewRateShipmentAddressDataDTO,
  NewRateShipmentWhatsInsideDataDTO,
} from '../../dto/newCouriers.dto';

export interface USPSServicesCommitmentResponse {
  SDCGetLocationsResponse: {
    Release: ['2.0'];
    CallerID: ['4'];
    SourceID: ['004'];
    MailClass: ['0'];
    OriginZIP: ['97070'];
    OriginCity: ['WILSONVILLE'];
    OriginState: ['OR'];
    DestZIP: ['97070'];
    DestCity: ['WILSONVILLE'];
    DestState: ['OR'];
    AcceptDate: ['2022-01-10'];
    AcceptTime: ['1400'];
    Expedited: [
      {
        EAD: ['2022-01-10'];
        Commitment: [
          {
            MailClass: ['1'];
            CommitmentName: ['1-Day'];
            CommitmentTime: ['1800'];
            CommitmentSeq: ['A0118'];
            Location: [
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['POST OFFICE'];
                Street: ['29333 SW TOWN CENTER LOOP E'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['1'];
              },
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['EXPRESS MAIL COLLECTION BOX'];
                Street: ['9200 SW HILLMAN CT'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['1'];
              },
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['EXPRESS MAIL COLLECTION BOX'];
                Street: ['9450 SW COMMERCE CIR'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['1'];
              },
            ];
          },
          {
            MailClass: ['1'];
            CommitmentName: ['1-Day'];
            CommitmentTime: ['1800'];
            CommitmentSeq: ['B0118'];
            Location: [
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['POST OFFICE'];
                Street: ['29333 SW TOWN CENTER LOOP E'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['1'];
              },
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['EXPRESS MAIL COLLECTION BOX'];
                Street: ['9200 SW HILLMAN CT'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['1'];
              },
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['EXPRESS MAIL COLLECTION BOX'];
                Street: ['9450 SW COMMERCE CIR'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['1'];
              },
            ];
          },
          {
            MailClass: ['2'];
            CommitmentName: ['1-Day'];
            CommitmentTime: [''];
            CommitmentSeq: ['C0100'];
            Location: [
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['POST OFFICE'];
                Street: ['29333 SW TOWN CENTER LOOP E'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['2'];
              },
            ];
          },
          {
            MailClass: ['2'];
            CommitmentName: ['1-Day'];
            CommitmentTime: [''];
            CommitmentSeq: ['D0100'];
            Location: [
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['POST OFFICE'];
                Street: ['29333 SW TOWN CENTER LOOP E'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['2'];
              },
            ];
          },
          {
            MailClass: ['2'];
            CommitmentName: ['1-Day'];
            CommitmentTime: [''];
            CommitmentSeq: ['E0100'];
            Location: [
              {
                SDD: ['2022-01-11'];
                COT: ['1700'];
                FacType: ['POST OFFICE'];
                Street: ['29333 SW TOWN CENTER LOOP E'];
                City: ['WILSONVILLE'];
                State: ['OR'];
                ZIP: ['97070'];
                IsGuaranteed: ['2'];
              },
            ];
          },
        ];
      },
    ];
    NonExpedited: [
      {
        MailClass: ['3'];
        NonExpeditedDestType: ['1'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['1 Day'];
        SvcStdDays: ['1'];
        SchedDlvryDate: ['2022-01-11'];
      },
      {
        MailClass: ['3'];
        NonExpeditedDestType: ['2'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['1 Day'];
        SvcStdDays: ['1'];
        SchedDlvryDate: ['2022-01-11'];
      },
      {
        MailClass: ['3'];
        NonExpeditedDestType: ['3'];
        HFPU: [
          {
            EAD: ['2022-01-10'];
            COT: ['1700'];
            ServiceStandard: [
              {
                SvcStdMsg: ['1 Day'];
                SvcStdDays: ['1'];
                Location: [
                  {
                    SchedDlvryDate: ['2022-01-11'];
                    RAUName: ['WILSONVILLE'];
                    Street: ['29333 SW TOWN CENTER LOOP E'];
                    ZIP: ['970709465'];
                    CloseTimes: [
                      {
                        M: ['1700'];
                        Tu: ['1700'];
                        W: ['1700'];
                        Th: ['1700'];
                        F: ['1700'];
                        Sa: ['1100'];
                        Su: ['0000'];
                        H: ['0000'];
                      },
                    ];
                    City: ['WILSONVILLE'];
                    State: ['OR'];
                  },
                ];
              },
            ];
          },
        ];
      },
      {
        MailClass: ['4'];
        NonExpeditedDestType: ['1'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['3 Days'];
        SvcStdDays: ['3'];
        SchedDlvryDate: ['2022-01-13'];
      },
      {
        MailClass: ['4'];
        NonExpeditedDestType: ['2'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['3 Days'];
        SvcStdDays: ['3'];
        SchedDlvryDate: ['2022-01-13'];
      },
      {
        MailClass: ['4'];
        NonExpeditedDestType: ['3'];
        HFPU: [
          {
            EAD: ['2022-01-10'];
            COT: ['1700'];
            ServiceStandard: [
              {
                SvcStdMsg: ['3 Days'];
                SvcStdDays: ['3'];
                Location: [
                  {
                    SchedDlvryDate: ['2022-01-13'];
                    RAUName: ['WILSONVILLE'];
                    Street: ['29333 SW TOWN CENTER LOOP E'];
                    ZIP: ['970709465'];
                    CloseTimes: [
                      {
                        M: ['1700'];
                        Tu: ['1700'];
                        W: ['1700'];
                        Th: ['1700'];
                        F: ['1700'];
                        Sa: ['1100'];
                        Su: ['0000'];
                        H: ['0000'];
                      },
                    ];
                    City: ['WILSONVILLE'];
                    State: ['OR'];
                  },
                ];
              },
            ];
          },
        ];
      },
      {
        MailClass: ['5'];
        NonExpeditedDestType: ['1'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['2 Days'];
        SvcStdDays: ['2'];
        SchedDlvryDate: ['2022-01-12'];
      },
      {
        MailClass: ['5'];
        NonExpeditedDestType: ['2'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['2 Days'];
        SvcStdDays: ['2'];
        SchedDlvryDate: ['2022-01-12'];
      },
      {
        MailClass: ['5'];
        NonExpeditedDestType: ['3'];
        HFPU: [
          {
            EAD: ['2022-01-10'];
            COT: ['1700'];
            ServiceStandard: [
              {
                SvcStdMsg: ['2 Days'];
                SvcStdDays: ['2'];
                Location: [
                  {
                    SchedDlvryDate: ['2022-01-12'];
                    RAUName: ['WILSONVILLE'];
                    Street: ['29333 SW TOWN CENTER LOOP E'];
                    ZIP: ['970709465'];
                    CloseTimes: [
                      {
                        M: ['1700'];
                        Tu: ['1700'];
                        W: ['1700'];
                        Th: ['1700'];
                        F: ['1700'];
                        Sa: ['1100'];
                        Su: ['0000'];
                        H: ['0000'];
                      },
                    ];
                    City: ['WILSONVILLE'];
                    State: ['OR'];
                  },
                ];
              },
            ];
          },
        ];
      },
      {
        MailClass: ['6'];
        NonExpeditedDestType: ['1'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['2 Days'];
        SvcStdDays: ['2'];
        SchedDlvryDate: ['2022-01-12'];
      },
      {
        MailClass: ['6'];
        NonExpeditedDestType: ['2'];
        EAD: ['2022-01-10'];
        COT: ['1700'];
        SvcStdMsg: ['2 Days'];
        SvcStdDays: ['2'];
        SchedDlvryDate: ['2022-01-12'];
      },
      {
        MailClass: ['6'];
        NonExpeditedDestType: ['3'];
        HFPU: [
          {
            EAD: ['2022-01-10'];
            COT: ['1700'];
            ServiceStandard: [
              {
                SvcStdMsg: ['2 Days'];
                SvcStdDays: ['2'];
                Location: [
                  {
                    SchedDlvryDate: ['2022-01-12'];
                    RAUName: ['WILSONVILLE'];
                    Street: ['29333 SW TOWN CENTER LOOP E'];
                    ZIP: ['970709465'];
                    CloseTimes: [
                      {
                        M: ['1700'];
                        Tu: ['1700'];
                        W: ['1700'];
                        Th: ['1700'];
                        F: ['1700'];
                        Sa: ['1100'];
                        Su: ['0000'];
                        H: ['0000'];
                      },
                    ];
                    City: ['WILSONVILLE'];
                    State: ['OR'];
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

export interface USPSPickUpAvailability {
  CarrierPickupAvailabilityResponse: {
    FirmName: [string];
    SuiteOrApt: [string];
    Address2: [string];
    Urbanization: [string];
    City: [string];
    State: [string];
    ZIP5: [string];
    ZIP4: [string];
    DayOfWeek: [string];
    Date: [string];
    CarrierRoute: [string];
  };
}

export interface USPSSchedulePickupResponse {
  CarrierPickupScheduleResponse: {
    FirstName: [string];
    LastName: [string];
    FirmName: [string];
    SuiteOrApt: [string];
    Address2: [string];
    Urbanization: [string];
    City: [string];
    State: [string];
    ZIP5: [string];
    ZIP4: [string];
    Phone: [string];
    Extension: [string];
    Package: { ServiceType: [string]; Count: [string] }[];
    EstimatedWeight: [string];
    PackageLocation: [string];
    SpecialInstructions: [string];
    ConfirmationNumber: [string];
    DayOfWeek: [string];
    Date: [string];
    CarrierRoute: [string];
  };
}

export interface USPSAddressValidation {
  AddressValidateResponse: {
    Address: [
      {
        $: { ID: string };
        Error: [
          {
            Number: [string];
            Source: [string];
            Description: [string];
            HelpFile: [string];
            HelpContext: [string];
          },
        ];
        Address2: [string];
        City: [string];
        State: [string];
        Zip5: [string];
        Zip4: [string];
        DeliveryPoint: [string];
        CarrierRoute: [string];
        DPVConfirmation: [string];
        DPVCMRA: [string];
        DPVFootnotes: [string];
        Business: [string];
        CentralDeliveryPoint: [string];
        Vacant: [string];
        ReturnText: [string];
      },
    ];
  };
}

export interface USPSCreateShippingLabelReturn {
  Error?: {
    Number: [string];
    Source: [string];
    Description: [string];
    HelpFile: [string];
    HelpContext: [string];
  };
  eVSResponse?: {
    BarcodeNumber: [string];
    LabelImage: [string];
    ReceiptImage: [string];
    ToName: [string];
    ToFirm: [string];
    ToAddress1: [string];
    ToAddress2: [string];
    ToCity: [string];
    ToState: [string];
    ToZip5: [string];
    ToZip4: [string];
    Postnet: [string];
    RDC: [string];
    Postage: [string];
    ExtraServices: [
      {
        ExtraService: [
          {
            ServiceID: [string];
            ServiceName: [string];
            Price: [string];
          },
        ];
      },
    ];
    Zone: [string];
    CarrierRoute: [string];
    PermitHolderName: [string];
    InductionType: [string];
    LogMessage: [string];
    Commitment: [
      {
        CommitmentName: [string];
        ScheduledDeliveryDate: [string];
      },
    ];
  };
  eVSExpressMailIntlResponse?: any;
  eVSPriorityMailIntlResponse?: any;
  eVSGXGGetLabelResponse?: any;
}

export interface USPSCreateUspsLabelOrPackage {
  totalPackages: string;
  actualPackage: string;
  weight: string;
  totalWeight?: string;
  width: string;
  length: string;
  height: string;
  shipDate: string;
  price?: any;
  htsCode?: any;
  description?: any;
  value?: any;
  dimensionUnit: 'cm' | 'in';
  weightUnit: 'lb' | 'kg';
  quantity?: any;
  totalItemAmount?: number;
  whatsInside?: NewRateShipmentWhatsInsideDataDTO;
  origin: NewRateShipmentAddressDataDTO;
  destiny: NewRateShipmentAddressDataDTO;
}

export interface USPSDropOffs {
  lbro?: string;
  maxDistance: string;
  requestRefineHours?: string;
  requestRefineTypes?: string;
  requestServices?: string;
  requestType: 'PO';
  requestZipCode: string;
  requestZipPlusFour?: string;
}

export interface USPSDropOffsLocationServiceHoursTimesReturn {
  open: string;
  close: string;
}

export interface USPSDropOffsLocationServiceHoursReturn {
  name: string;
  dailyHoursList: [
    {
      dayOfTheWeek: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
      times: USPSDropOffsLocationServiceHoursTimesReturn[];
    },
  ];
}

export interface USPSDropOffsLocationReturn {
  locationID: string;
  locationName: string;
  locationType: string;
  radius: string;
  address1: string;
  city: string;
  state: string;
  zip5: string;
  zip4: string;
  latitude: string;
  longitude: string;
  distance: string;
  phone: string;
  fax: string;
  tollFree: string;
  services: [
    'BRMACCTBAL',
    'BRMNEW',
    'BURIALFLAGS',
    'CALLREFERRAL',
    'CARRIER',
    'DUCKSTAMPS',
    'GENERALDELIVERY',
    'GREETINGCARDS',
    'GXG',
    'LBRORETAIL',
    'MONEYORDERSDOM',
    'MONEYORDERSINQ',
    'MONEYORDERSINTL',
    'PASSPORTAPPT',
    'PASSPORTPHOTO',
    'PICKUPACCOUNTABLE',
    'PICKUPHOLDMAIL',
    'PICKUPNOTICELEFT',
    'PMI',
    'POBOXONLINE',
    'SUREMONEY',
  ];
  parking: string;
  passportApptRUSPSDropOffsLocationReturnequired: string;
  tty: string;
  locationServiceHours: USPSDropOffsLocationServiceHoursReturn[];
  preferredSort: string;
  holdMailFacility: boolean;
  accountableMailFacility: boolean;
  passportTelephoneNumber: string;
  passportTelephoneNumberExtension: string;
}

export interface USPSDropOffsReturn {
  locations?: USPSDropOffsLocationReturn[];
  extendedSearchPerformed: boolean;
  entireRadiusListSearched: boolean;
  lastRadiusSearched: string;
  errorCode?: string;
}

export interface RateRequestBodyPackage {
  weight: string;
  width: string;
  height: string;
  length: string;
  quantity: number;
  items: [
    {
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
          footnotes: [
            {
              value: string;
              columns: [string];
              type: string;
            },
          ];
          general: string;
          units: null;
        };
        label: string;
      };
      unit_price: string;
      quantity: number;
    },
  ];
  contains: {
    perfume: false;
    battery: false;
  };
}

export interface RateRequestBodyOrigin {
  country: 'US';
  state: 'VA';
  city: 'Ashburn';
  postal_code: '20147';
  address: 'Ashburn Shopping Plaza 44131, VA - US';
  street: 'Ashburn Shopping Plaza';
  street_number: '44131';
  is_residential_address: true;
  complement_address: null;
}

export interface RateRequestBodyDestiny {
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

export interface RateRequestBodyPackagesMeta {
  type: string;
  package_quantity: number;
  weight_total: number;
  weight_unit: string;
  measure_unit: string;
  cargo_value: number;
  currency: {
    code: string;
    symbol: string;
  };
  has_perfume: false;
  has_battery: false;
}

export interface RateRequestBody {
  origin: RateRequestBodyOrigin;
  destination: RateRequestBodyDestiny;
  ship_date: string;
  packages: RateRequestBodyPackage[];
  packages_meta: RateRequestBodyPackagesMeta;
}

export interface USPSRateRequestError {
  Error: {
    Number: [string];
    Source: [string];
    Description: [string];
    HelpFile: [string];
    HelpContext: [string];
  };
}

export interface USPSDomesticRateRequestXMLParsedPackageError {
  Number: [string];
  Source: [string];
  Description: [string];
  HelpFile: [string];
  HelpContext: [string];
}

export interface USPSDomesticRateRequestXMLParsedPackageDropoffLocation {
  CutOff: [string];
  Facility: [string];
  Street: [string];
  City: [string];
  State: [string];
  Zip: [string];
}

export interface USPSDomesticRateRequestXMLParsedPackagePostage {
  $: {
    CLASSID: string;
  };
  Error?: USPSDomesticRateRequestXMLParsedPackageError;
  MailService: [string];
  Rate: [string];
  CommercialRate: [string];
  CommitmentDate?: [string];
  CommitmentName?: [string];
  Location: [USPSDomesticRateRequestXMLParsedPackageDropoffLocation];
}

export interface USPSDomesticRateRequestXMLParsedPackageResponse {
  $: {
    ID: string;
  };
  Error?: [any];
  ZipOrigination: [string];
  ZipDestination: [string];
  Pounds: [string];
  Ounces: [string];
  Machinable: ['TRUE' | 'FALSE'];
  Zone: [string];
  Postage: [USPSDomesticRateRequestXMLParsedPackagePostage];
}

export interface USPSDomesticRateRequestXMLParsedResponse {
  RateV4Response: {
    Package: [USPSDomesticRateRequestXMLParsedPackageResponse];
  };
}

export interface USPSInternationalRateRequestXMLParsedResponsePackageServiceExtraService {
  ServiceID: [string];
  ServiceName: [string];
  Available: [string];
  Price: [string];
  DeclaredValueRequired: [string];
}

export interface USPSInternationalRateRequestXMLParsedResponsePackageService {
  $: {
    ID: string;
  };
  Pounds: [string];
  Ounces: [string];
  Machinable: [string];
  MailType: [string];
  Width: [string];
  Length: [string];
  Height: [string];
  Country: [string];
  Postage: [string];
  CommercialPostage?: [string];
  ExtraServices: [
    {
      ExtraService: [
        USPSInternationalRateRequestXMLParsedResponsePackageServiceExtraService,
      ];
    },
  ];
  ValueOfContents: [string];
  SvcCommitments: [string];
  SvcDescription: [string];
  MaxDimensions: [string];
  MaxWeight: [string];
}

export interface USPSInternationalRateRequestXMLParsedResponsePackage {
  $: {
    ID: string;
  };
  Error: [any];
  Prohibitions: [string];
  Restrictions: [string];
  Observations: [string];
  CustomsForms: [string];
  ExpressMail: [string];
  AreasServed: [string];
  AdditionalRestrictions: [string];
  Service: [USPSInternationalRateRequestXMLParsedResponsePackageService];
}

export interface USPSInternationalRateRequestXMLParsedResponse {
  IntlRateV2Response: {
    Package: [USPSInternationalRateRequestXMLParsedResponsePackage];
  };
}

export interface USPSCreateShipmentRequestBodyQuotePackageMeta {
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

export interface USPSCreateShipmentRequestBodyQuotePackageItem {
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

export interface USPSCreateShipmentRequestBodyQuotePackage {
  weight: string;
  width: string;
  height: string;
  length: string;
  quantity: number;
  items: USPSCreateShipmentRequestBodyQuotePackageItem[];
  contains: { perfume: false; battery: false };
}

export interface USPSCreateShipmentRequestBodyQuoteDestination {
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

export interface USPSCreateShipmentRequestBodyQuoteOrigin {
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

export interface USPSCreateShipmentRequestBodyQuote {
  origin: USPSCreateShipmentRequestBodyQuoteOrigin;
  destination: USPSCreateShipmentRequestBodyQuoteDestination;
  ship_date: string;
  packages: USPSCreateShipmentRequestBodyQuotePackage[];
  packages_meta: USPSCreateShipmentRequestBodyQuotePackageMeta;
}

export interface USPSCreateShipmentRequestBodyRecipient {
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

export interface USPSCreateShipmentRequestBodySender {
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

export interface USPSCreateShipmentRequestBodyProduct {
  productCode: string;
  localProductCode?: string;
}

export interface USPSCreateShipmentRequestBody {
  quote: USPSCreateShipmentRequestBodyQuote;
  recipient: USPSCreateShipmentRequestBodyRecipient;
  parcel_serial_number: number;
  sender: USPSCreateShipmentRequestBodySender;
  product: USPSCreateShipmentRequestBodyProduct;
}
