export interface IBPSAuth {
  accessToken: string;
  authentication: {
    strategy: string;
    payload: {
      iat: number;
      exp: number;
      aud: string;
      iss: string;
      sub: string;
      jti: string;
    };
  };
  user: {
    id: number;
    username: string;
    email: string;
    isEnabled: number;
    isVerified: number;
    verifyToken: null;
    resetToken: null;
    invalidTokensBeforeAt: string;
    metadata: {
      method: string;
      path: string;
      editedVia: string;
    };
    uid: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
    avatarId: string;
    avatar: {
      id: string;
      md5: string;
      height: string;
      width: string;
      format: string;
    };
    user_detail: {
      id: number;
      taxId: string;
      phone: string;
      firstName: string;
      lastName: string;
      displayName: string;
      gender: string;
      birthday: string;
      city: string;
      state: string;
      postalCode: string;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string;
      userId: number;
      countryId: number;
      accountTypeId: number;
      country: {
        id: number;
        name: string;
        isoCode: string;
        phoneNumberPrefix: string;
        allowShipTo: number;
        allowPickup: number;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
      };
    };
    roles: [
      {
        id: number;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
        roleId: number;
        userId: number;
        role: {
          role: string;
          uid: string;
          createdAt: string;
          updatedAt: string;
          deletedAt: string;
        };
      },
    ];
    accounts: [];
  };
  success: boolean;
  data: string;
}

export interface IBPSRatingPayload {
  from: {
    city: string;
    state: string;
    postalCode: string;
    country: {
      isoCode: string;
    };
  };
  to: {
    country: {
      isoCode: string;
    };
    state: string;
    city: string;
    postalCode: string;
  };
  packages: [
    {
      harmonized_code: string | number;
      description: string;
      weight: number;
      width: number;
      height: number;
      length: number;
      quantity: number;
      value: number;
      insurance_value: number;
    },
  ];
  service: {
    code: string;
  };
  shippingDate: string;
  declaredValue: number;
}

export interface IBPSServiceListReturn {
  id: number;
  integration_stage: string;
  name: string;
  code: string;
  type: string;
  tax_modalities: ['ddu', 'ddp'];
  external_service_code: string;
  allow_pickups: number;
  allow_dg: number;
  required_deposit: number;
  use_imperial_system: any;
  use_billable_weight: any;
  billing_factor: any;
  volume_weight_calculator_round_each_size: any;
  round_weight_style: any;
  dimension_tolerance: any;
  gross_weight_tolerance: any;
  volume_weight_tolerance: any;
  driver: string;
  label_template: any;
  active: number;
  cost_based_on_origin: any;
  cost_based_on_destination: number;
  is_pickup_service: number;
  uid: string;
  created_at: string;
  updated_at: string;
  deleted_at: any;
  external_service_id: number;
  service_consignee_id: number;
  country_id: number;
  redirect_to_service_id: any;
  external_service: {
    id: number;
    name: string;
    internal_service_name: string;
    zone_accuracy: string;
    active: number;
    uid: string;
    created_at: string;
    updated_at: string;
    deleted_at: any;
    external_service_provider_id: 2;
    inherit_rules_from_id: any;
    external_service_provider: {
      id: number;
      code: string;
      name: string;
      dispatch_count: number;
      driver: string;
      active: number;
      uid: string;
      created_at: string;
      updated_at: string;
      deleted_at: any;
    };
  };
  service_consignee: {
    id: number;
    name: string;
    address: string;
    uid: string;
    created_at: string;
    updated_at: string;
    deleted_at: any;
  };
  service_countries: [
    {
      id: number;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: any;
      serviceId: number;
      originCountryId: number;
      destinationCountryId: number;
    },
  ];
  external_service_rules: [
    {
      id: number;
      isUnitType: number;
      _key: string;
      value: string;
      description: string;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: any;
      externalServiceId: number;
      externalServiceRuleTypeId: number;
    },
  ];
  service_options: [
    {
      id: number;
      isDefault: true;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: any;
      serviceConsigneeId: any;
      serviceId: number;
      serviceRouteId: number;
      service_route: {
        id: number;
        name: string;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: any;
        airlineId: number;
        countryFromId: number;
        countryToId: number;
        service_route_legs: [
          {
            id: number;
            position: number;
            serviceRouteId: number;
            uid: string;
            createdAt: string;
            updatedAt: string;
            deletedAt: any;
            airportRouteId: number;
            countryFromId: number;
            countryToId: number;
            service_route_service_route_leg: {
              id: number;
              position: number;
              uid: string;
              createdAt: string;
              updatedAt: string;
              deletedAt: any;
              serviceRouteLegId: number;
              serviceRouteId: number;
            };
            airport_route: {
              id: number;
              name: string;
              uid: string;
              createdAt: string;
              updatedAt: string;
              deletedAt: string;
              countryFromId: number;
              airportFromId: number;
              countryToId: number;
              airportToId: number;
              airlineId: number;
              airportFrom: {
                id: number;
                code: string;
                name: string;
                uid: string;
                createdAt: string;
                updatedAt: string;
                deletedAt: string;
                countryId: number;
              };
              airportTo: {
                id: number;
                code: string;
                name: string;
                uid: string;
                createdAt: string;
                updatedAt: string;
                deletedAt: string;
                countryId: number;
              };
            };
          },
        ];
      };
    },
  ];
}

export interface IBPSTrackingReturn {
  uid: string;
  id: number;
  timestamp: string;
  location: string;
  city: string;
  state: string;
  parcelTrackingQueueId: number;
  parcelTrackingDestinationId: string;
  trackingCodeId: number;
  updatedAt: string;
  createdAt: string;
}

export interface IBPSSeviceValidationReturn {
  measurement_units: 'cm';
  weight_units: 'gms';
  max_total_value: string;
  max_parcel_weight: string;
  min_parcel_weight: string;
  max_parcel_length: string;
  min_parcel_length: string;
  max_parcel_width: string;
  min_parcel_width: string;
  max_parcel_height: string;
  min_parcel_height: string;
  max_total_parcel_size: string;
}

export interface IBPSAcceptedCountryList {
  name: string;
  iso_code: string;
  allow_pickup: number;
}
export interface IBPSAcceptedCountryStateList {
  name: string;
  iso_code: string;
}

export interface IBPSShipmentRequestItem {
  description: string;
  quantity: number;
  sh_code: string;
  value: number;
  sku_code?: string;
  weight?: string;
  item_details: {
    contains_battery: boolean;
    contains_flammable_liquid: boolean;
    contains_perfume: boolean;
  };
}

export interface IBPSShipmentRequest {
  external_customer_id: string;
  external_reference_code: string;
  items: IBPSShipmentRequestItem[];
  parcel_details: {
    destination_country_iso: string;
    freight_value: number;
    height: number;
    insurance_value: number;
    length: number;
    measurement_unit: 'cm' | 'inches';
    parcel_type: 'box' | 'bag';
    service_code: string;
    tax_modality: string;
    value: number;
    weight: number;
    weight_unit: 'kilogram' | 'gram' | 'ounce' | 'pound';
    width: number;
    apply_min_dimension_override: boolean;
    domestic_required?: boolean;
  };
  recipient: {
    address: {
      address_line_1: string;
      city: string;
      country: string;
      number: string;
      postal_code: string;
      state: string;
      mailbox?: string;
      address_line_2?: string;
      address_line_3?: string;
    };
    first_name: string;
    last_name: string;
    phone: string;
    tax_id: string;
    type: 'individual' | 'business';
  };
  sender: {
    address: {
      address_line_1: string;
      city: string;
      country: string;
      number: string;
      postal_code: string;
      state: string;
      mailbox?: string;
      address_line_2?: string;
      address_line_3?: string;
    };
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
    phone: string;
    tax_id: string;
    type: 'individual' | 'business';
    website: string;
  };
  is_humanitarian?: boolean;
}

export interface IBPSShipmentReturn {
  status: string;
  isUndeliverable: boolean;
  isVerifiedDims: boolean;
  isVerifiedWeight: boolean;
  pendingStoreSync: boolean;
  unitizerStatus: boolean;
  dispatchStatus: boolean;
  isRelabeled: boolean;
  isRepacked: boolean;
  isBillable: boolean;
  uid: string;
  id: number;
  externalCustomerId: string;
  externalReferenceCode: string;
  freightValue: string;
  height: string;
  insuranceValue: string;
  length: string;
  measurementUnit: string;
  taxModality: string;
  weight: string;
  weightUnit: string;
  width: string;
  parcelType: string;
  applyMinDimensionOverride: boolean;
  totalValue: number;
  serviceId: number;
  accountId: number;
  isHumanitarian: boolean;
  reissueLabelNeeded: boolean;
  userId: number;
  lastEditById: number;
  hasDimensions: boolean;
  domesticRequired: boolean;
  allowPickup: number;
  serviceOptionId: number;
  senderId: number;
  recipientId: number;
  metadata: {
    ip: string;
    userAgent: string;
    editedVia: string;
    serviceProvider: string;
  };
  updatedAt: string;
  createdAt: string;
  parcel_items: [
    {
      uid: string;
      id: number;
      containsBattery: boolean;
      containsFlammableLiquid: boolean;
      containsPerfume: boolean;
      description: string;
      quantity: string;
      shCode: string;
      value: string;
      isHumanitarian: boolean;
      weight: number;
      skuCode: any;
      parcelId: number;
      updatedAt: string;
      createdAt: string;
    },
  ];
  label: {
    uid: string;
    id: number;
    trackingNumber: string;
    model: string;
    updatedAt: string;
    createdAt: string;
  };
  labelId: number;
  service: {
    id: number;
    integrationStage: string;
    name: string;
    code: string;
    type: string;
    taxModalities: [string];
    externalServiceCode: string;
    allowPickups: boolean;
    allowDg: boolean;
    requiredDeposit: boolean;
    useImperialSystem: any;
    useBillableWeight: any;
    billingFactor: any;
    volumeWeightCalculatorRoundEachSize: any;
    roundWeightStyle: any;
    dimensionTolerance: any;
    grossWeightTolerance: any;
    volumeWeightTolerance: any;
    driver: string;
    labelTemplate: any;
    active: boolean;
    costBasedOnOrigin: any;
    costBasedOnDestination: boolean;
    isPickupService: boolean;
    uid: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: any;
    externalServiceId: number;
    serviceConsigneeId: number;
    countryId: number;
    redirectToServiceId: any;
    redirectToService: any;
  };
  service_option: {
    id: 5;
    isDefault: true;
    uid: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
    serviceConsigneeId: string;
    serviceId: 4;
    serviceRouteId: 4;
    service_route: {
      id: 4;
      name: string;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string;
      airlineId: 3;
      countryFromId: 236;
      countryToId: 32;
    };
  };
  recipient: {
    address: {
      addressLine1: string;
      country: {
        id: 32;
        name: string;
        isoCode: string;
        isoCode3: string;
        isoNumeric: 76;
        fips: string;
        capital: string;
        areaSqKm: 8511965;
        population: 209469333;
        continent: string;
        tld: string;
        currencyCode: string;
        currencyName: string;
        postalCodeFormat: string;
        postalCodeRegex: string;
        languages: string;
        equivalentFipsCode: string;
        phoneNumberPrefix: string;
        allowShipFrom: boolean;
        allowShipTo: boolean;
        allowPickup: boolean;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
      };
      state: string;
      city: string;
      postalCode: string;
      number: string;
      countryId: 32;
      streetNumber: string;
      street: string;
      address_type: {
        id: 1;
        name: string;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
      };
      address_detail: {
        addressLine1: string;
        country: {
          id: 32;
          name: string;
          isoCode: string;
          isoCode3: string;
          isoNumeric: 76;
          fips: string;
          capital: string;
          areaSqKm: 8511965;
          population: 209469333;
          continent: string;
          tld: string;
          currencyCode: string;
          currencyName: string;
          postalCodeFormat: string;
          postalCodeRegex: string;
          languages: string;
          equivalentFipsCode: string;
          phoneNumberPrefix: string;
          allowShipFrom: boolean;
          allowShipTo: boolean;
          allowPickup: boolean;
          uid: string;
          createdAt: string;
          updatedAt: string;
          deletedAt: string;
        };
        state: string;
        city: string;
        postalCode: string;
        number: string;
        countryId: 32;
        streetNumber: string;
        street: string;
        address_type: {
          id: 1;
          name: string;
          uid: string;
          createdAt: string;
          updatedAt: string;
          deletedAt: null;
        };
      };
    };
    type: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    taxId: string;
    countryId: 32;
    country: {
      id: 32;
      name: string;
      isoCode: string;
      isoCode3: string;
      isoNumeric: 76;
      fips: string;
      capital: string;
      areaSqKm: 8511965;
      population: 209469333;
      continent: string;
      tld: string;
      currencyCode: string;
      currencyName: string;
      postalCodeFormat: string;
      postalCodeRegex: string;
      languages: string;
      equivalentFipsCode: string;
      phoneNumberPrefix: string;
      allowShipFrom: boolean;
      allowShipTo: boolean;
      allowPickup: boolean;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string;
    };
  };
  sender: {
    address: {
      addressLine1: string;
      street: string;
      country: {
        id: 236;
        name: string;
        isoCode: string;
        isoCode3: string;
        isoNumeric: 840;
        fips: string;
        capital: string;
        areaSqKm: 9629091;
        population: 327167434;
        continent: string;
        tld: string;
        currencyCode: string;
        currencyName: string;
        postalCodeFormat: string;
        postalCodeRegex: string;
        languages: string;
        equivalentFipsCode: string;
        phoneNumberPrefix: string;
        allowShipFrom: boolean;
        allowShipTo: boolean;
        allowPickup: boolean;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
      };
      city: string;
      state: string;
      number: string;
      postalCode: string;
      countryId: number;
      streetNumber: string;
      address_type: {
        id: 1;
        name: string;
        uid: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string;
      };
      address_detail: {
        addressLine1: string;
        street: string;
        country: {
          id: 236;
          name: string;
          isoCode: string;
          isoCode3: string;
          isoNumeric: 840;
          fips: string;
          capital: string;
          areaSqKm: 9629091;
          population: 327167434;
          continent: string;
          tld: string;
          currencyCode: string;
          currencyName: string;
          postalCodeFormat: string;
          postalCodeRegex: string;
          languages: string;
          equivalentFipsCode: string;
          phoneNumberPrefix: string;
          allowShipFrom: boolean;
          allowShipTo: boolean;
          allowPickup: boolean;
          uid: string;
          createdAt: string;
          updatedAt: string;
          deletedAt: string;
        };
        city: string;
        state: string;
        number: string;
        postalCode: string;
        countryId: 236;
        streetNumber: string;
        address_type: {
          id: 1;
          name: string;
          uid: string;
          createdAt: string;
          updatedAt: string;
          deletedAt: string;
        };
      };
    };
    type: string;
    companyName: string;
    firstName: string;
    lastName: string;
    website: string;
    email: string;
    phone: string;
    taxId: string;
    countryId: 236;
    country: {
      id: 236;
      name: string;
      isoCode: string;
      isoCode3: string;
      isoNumeric: 840;
      fips: string;
      capital: string;
      areaSqKm: 9629091;
      population: 327167434;
      continent: string;
      tld: string;
      currencyCode: string;
      currencyName: string;
      postalCodeFormat: string;
      postalCodeRegex: string;
      languages: string;
      equivalentFipsCode: string;
      phoneNumberPrefix: string;
      allowShipFrom: boolean;
      allowShipTo: boolean;
      allowPickup: boolean;
      uid: string;
      createdAt: string;
      updatedAt: string;
      deletedAt: string;
    };
  };
  errors: [
    {
      message: string;
      data: {
        vendorErrorData: {
          msgs: [string];
          date: string;
          path: string;
          errorDetails: [
            {
              objectName: string;
              message: string;
            },
          ];
        };
        bpsData: {
          parcelLabelPayload: {
            packageList: [
              {
                senderState: string;
                customerControlCode: string;
                senderName: string;
                senderAddress: string;
                senderAddressNumber: string;
                senderZipCode: string;
                senderCityName: string;
                senderCountryCode: string;
                senderEmail: string;
                senderPhoneNumber: string;
                senderWebsite: string;
                recipientDocumentType: string;
                recipientDocumentNumber: string;
                recipientName: string;
                recipientAddress: string;
                recipientAddressNumber: string;
                recipientZipCode: string;
                recipientCityName: string;
                recipientState: string;
                recipientEmail: string;
                recipientPhoneNumber: string;
                totalWeight: string;
                packagingLength: string;
                packagingWidth: string;
                packagingHeight: string;
                distributionModality: string;
                taxPaymentMethod: string;
                currency: string;
                freightPaidValue: string;
                insurancePaidValue: string;
                items: [
                  {
                    hsCode: string;
                    description: string;
                    quantity: string;
                    value: string;
                    weight: string;
                  },
                ];
              },
            ];
          };
        };
        stopErrorChain: true;
      };
      errors: [
        {
          message: string;
          code: string;
          vendorCode: string;
        },
      ];
      raw: {
        name: string;
        message: string;
        code: number;
        className: string;
        data: {
          vendorErrorData: {
            msgs: [string];
            date: string;
            path: string;
            errorDetails: [
              {
                objectName: string;
                message: string;
              },
            ];
          };
          bpsData: {
            parcelLabelPayload: {
              packageList: [
                {
                  senderState: string;
                  customerControlCode: string;
                  senderName: string;
                  senderAddress: string;
                  senderAddressNumber: string;
                  senderZipCode: string;
                  senderCityName: string;
                  senderCountryCode: string;
                  senderEmail: string;
                  senderPhoneNumber: string;
                  senderWebsite: string;
                  recipientDocumentType: string;
                  recipientDocumentNumber: string;
                  recipientName: string;
                  recipientAddress: string;
                  recipientAddressNumber: string;
                  recipientZipCode: string;
                  recipientCityName: string;
                  recipientState: string;
                  recipientEmail: string;
                  recipientPhoneNumber: string;
                  totalWeight: string;
                  packagingLength: string;
                  packagingWidth: string;
                  packagingHeight: string;
                  distributionModality: string;
                  taxPaymentMethod: string;
                  currency: string;
                  freightPaidValue: string;
                  insurancePaidValue: string;
                  items: [
                    {
                      hsCode: string;
                      description: string;
                      quantity: string;
                      value: string;
                      weight: string;
                    },
                  ];
                },
              ];
            };
          };
          stopErrorChain: true;
        };
        errors: [
          {
            message: string;
            code: string;
            vendorCode: string;
          },
        ];
      };
    },
  ];
}
