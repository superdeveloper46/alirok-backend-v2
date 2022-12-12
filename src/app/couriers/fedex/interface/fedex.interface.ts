export interface FedexRequestsTypes {
  serviceCode: string;
  rateType: string;
  transitTime: number;
}

export interface FedexShipmentReturnJson {
  transactionId: 'fb48153e-f534-4965-b333-666817ec852b';
  output: {
    transactionShipments: [
      {
        masterTrackingNumber: string;
        serviceType: 'INTERNATIONAL_ECONOMY';
        shipDatestamp: '2021-12-23';
        serviceName: 'FedEx International Economy®';
        shipmentDocuments: [
          {
            contentType: 'COMMERCIAL_INVOICE';
            copiesToPrint: 3;
            encodedLabel: string;
            trackingNumber: '794697097987';
            docType: 'PDF';
          },
        ];
        pieceResponses: [
          {
            masterTrackingNumber: '794697097987';
            trackingNumber: '794697097987';
            additionalChargesDiscount: 0.0;
            netRateAmount: 769.58;
            netChargeAmount: 0.0;
            netDiscountAmount: 0.0;
            packageDocuments: [
              {
                contentType: 'LABEL';
                copiesToPrint: 1;
                encodedLabel: string;
                docType: 'PDF';
              },
            ];
            currency: 'USD';
            customerReferences: [];
            codcollectionAmount: 0.0;
            baseRateAmount: 732.93;
          },
        ];
        completedShipmentDetail: {
          usDomestic: false;
          carrierCode: 'FDXE';
          masterTrackingId: {
            trackingIdType: 'FEDEX';
            formId: '0430';
            trackingNumber: '794697097987';
          };
          serviceDescription: {
            serviceId: 'EP1000000004';
            serviceType: 'INTERNATIONAL_ECONOMY';
            code: '04';
            names: [
              {
                type: 'long';
                encoding: 'utf-8';
                value: 'FedEx International EconomyÂ®';
              },
              {
                type: 'long';
                encoding: 'ascii';
                value: 'FedEx International Economy';
              },
              {
                type: 'medium';
                encoding: 'utf-8';
                value: 'FedEx International EconomyÂ®';
              },
              {
                type: 'medium';
                encoding: 'ascii';
                value: 'FedEx International Economy';
              },
              {
                type: 'short';
                encoding: 'utf-8';
                value: 'IE';
              },
              {
                type: 'short';
                encoding: 'ascii';
                value: 'IE';
              },
              {
                type: 'abbrv';
                encoding: 'ascii';
                value: 'IE';
              },
            ];
            operatingOrgCodes: ['FXE'];
            serviceCategory: 'parcel';
            description: 'International Economy';
            astraDescription: 'IE';
          };
          packagingDescription: 'Customer Packaging';
          operationalDetail: {
            ursaPrefixCode: 'S8';
            ursaSuffixCode: 'SSAA ';
            originLocationId: 'SEAA ';
            originLocationNumber: 0;
            originServiceArea: 'A1';
            destinationLocationId: 'SSAA ';
            destinationLocationNumber: 0;
            destinationServiceArea: 'AA';
            destinationLocationStateOrProvinceCode: 'BA';
            deliveryDate: '';
            deliveryDay: '';
            commitDate: '';
            commitDay: '';
            ineligibleForMoneyBackGuarantee: false;
            astraPlannedServiceLevel: 'AA';
            astraDescription: 'INTL ECONOMY';
            postalCode: '41815';
            stateOrProvinceCode: 'BA';
            countryCode: 'BR';
            airportId: 'VCP';
            serviceCode: '04';
            packagingCode: '01';
            publishedDeliveryTime: '';
            scac: '';
          };
          shipmentRating: {
            actualRateType: 'PAYOR_ACCOUNT_SHIPMENT';
            shipmentRateDetails: [
              {
                rateType: 'PAYOR_ACCOUNT_SHIPMENT';
                rateScale: 'US001OFL_04_YOUR_PACKAGING';
                rateZone: 'US001O';
                pricingCode: '';
                ratedWeightMethod: 'ACTUAL';
                currencyExchangeRate: {
                  fromCurrency: 'USD';
                  intoCurrency: 'USD';
                  rate: 1.0;
                };
                dimDivisor: 139;
                fuelSurchargePercent: 5.0;
                totalBillingWeight: {
                  units: 'LB';
                  value: 30.0;
                };
                totalBaseCharge: 732.93;
                totalFreightDiscounts: 0.0;
                totalNetFreight: 732.93;
                totalSurcharges: 36.65;
                totalNetFedExCharge: 769.58;
                totalTaxes: 0.0;
                totalNetCharge: 769.58;
                totalRebates: 0.0;
                totalDutiesAndTaxes: 0.0;
                totalAncillaryFeesAndTaxes: 0.0;
                totalDutiesTaxesAndFees: 0.0;
                totalNetChargeWithDutiesAndTaxes: 769.58;
                surcharges: [
                  {
                    surchargeType: 'FUEL';
                    description: 'Fuel';
                    amount: 36.65;
                  },
                ];
                freightDiscounts: [];
                taxes: [];
                currency: 'USD';
              },
            ];
          };
          completedPackageDetails: [
            {
              sequenceNumber: 1;
              trackingIds: [
                {
                  trackingIdType: 'FEDEX';
                  formId: '0430';
                  trackingNumber: '794697097987';
                },
              ];
              groupNumber: 0;
              signatureOption: 'SERVICE_DEFAULT';
              operationalDetail: {
                barcodes: {
                  binaryBarcodes: [
                    {
                      type: 'COMMON_2D';
                      value: string;
                    },
                  ];
                  stringBarcodes: [
                    {
                      type: 'FEDEX_1D';
                      value: string;
                    },
                  ];
                };
                astraHandlingText: '';
                operationalInstructions: [
                  {
                    number: 2;
                    content: 'TRK#';
                  },
                  {
                    number: 3;
                    content: '0430';
                  },
                  {
                    number: 5;
                    content: 'S8 SSAA ';
                  },
                  {
                    number: 7;
                    content: '1010095733510018411100794697097987';
                  },
                  {
                    number: 8;
                    content: '56DJ3/E934/FE4A';
                  },
                  {
                    number: 10;
                    content: '7946 9709 7987';
                  },
                  {
                    number: 12;
                    content: 'AA';
                  },
                  {
                    number: 13;
                    content: 'INTL ECONOMY';
                  },
                  {
                    number: 15;
                    content: '41815';
                  },
                  {
                    number: 16;
                    content: 'BA-BR';
                  },
                  {
                    number: 17;
                    content: 'VCP';
                  },
                ];
              };
            },
          ];
          exportComplianceStatement: 'NO EEI 30.37(a)';
          documentRequirements: {
            requiredDocuments: [
              'AIR_WAYBILL',
              'COMMERCIAL_OR_PRO_FORMA_INVOICE',
            ];
            generationDetails: [
              {
                type: 'PRO_FORMA_INVOICE';
                minimumCopiesRequired: 3;
                letterhead: 'OPTIONAL';
                electronicSignature: 'OPTIONAL';
              },
              {
                type: 'AIR_WAYBILL';
                minimumCopiesRequired: 3;
              },
              {
                type: 'COMMERCIAL_INVOICE';
                minimumCopiesRequired: 3;
                letterhead: 'OPTIONAL';
                electronicSignature: 'REQUIRED';
              },
            ];
            prohibitedDocuments: [
              'USMCA_COMMERCIAL_INVOICE_CERTIFICATION_OF_ORIGIN',
              'USMCA_CERTIFICATION_OF_ORIGIN',
            ];
          };
          shipmentDocuments: [
            {
              type: 'COMMERCIAL_INVOICE';
              shippingDocumentDisposition: 'RETURNED';
              imageType: 'PDF';
              resolution: 200;
              copiesToPrint: 3;
              parts: [
                {
                  documentPartSequenceNumber: 1;
                  image: string;
                },
              ];
            },
          ];
        };
        serviceCategory: 'EXPRESS';
      },
    ];
  };
}

export interface FedexShipmentJson {
  labelResponseOptions: 'URL_ONLY' | 'LABEL';
  requestedShipment: {
    shipper: {
      contact: {
        personName: string;
        phoneNumber: string;
        companyName: string;
        emailAddress: string;
      };
      address: {
        streetLines: string[];
        city: string;
        stateOrProvinceCode: string;
        postalCode: string;
        countryCode: string;
      };
      tins: [
        {
          number: string;
          tinType?: string;
        },
      ];
    };
    recipients: [
      {
        contact: {
          personName: string;
          phoneNumber: string;
          companyName: string;
          emailAddress: string;
        };
        address: {
          streetLines: string[];
          city: string;
          stateOrProvinceCode: string;
          postalCode: string;
          countryCode: string;
        };
        tins: [
          {
            number: string;
            tinType?: string;
          },
        ];
      },
    ];
    shipDatestamp: string;
    serviceType: string;
    packagingType: 'YOUR_PACKAGING';
    pickupType: 'CONTACT_FEDEX_TO_SCHEDULE' | 'DROPOFF_AT_FEDEX_LOCATION';
    blockInsightVisibility: boolean;
    shippingChargesPayment: {
      paymentType: 'SENDER';
    };
    labelSpecification: {
      imageType: 'PDF' | 'PNG';
      labelStockType: string;
    };
    customsClearanceDetail?: {
      dutiesPayment: {
        paymentType: 'SENDER';
      };
      isDocumentOnly?: boolean;
      commodities: [
        {
          description: string;
          countryOfManufacture: string;
          quantity: number;
          quantityUnits: string;
          unitPrice: {
            amount: number;
            currency: 'USD';
          };
          customsValue: {
            amount: number;
            currency: 'USD';
          };
          weight: {
            units: 'LB';
            value: number;
          };
        },
      ];
    };
    expressFreightDetail: {
      bookingConfirmationNumber: string;
      shippersLoadAndCount: number;
    };
    requestedPackageLineItems: [
      {
        weight: {
          value: string;
          units: 'LB';
        };
        dimensions: {
          length: number;
          width: number;
          height: number;
          units: 'IN';
        };
      },
    ];
  };
  accountNumber: {
    value: string;
  };
}

export interface FedexRequests {
  services: FedexRequestsTypes[];
  isParcel: boolean;
}

export interface FedexJsonAuth {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface FedexRatingReturnJson {
  transactionId: string;
  output: {
    rateReplyDetails: [
      {
        serviceType: string;
        serviceName: string;
        packagingType: string;
        ratedShipmentDetails: [
          {
            rateType: string;
            ratedWeightMethod: string;
            totalDiscounts: number;
            totalBaseCharge: number;
            totalNetCharge: number;
            totalNetFedExCharge: number;
            shipmentRateDetail: {
              rateZone: string;
              dimDivisor: number;
              fuelSurchargePercent: number;
              totalSurcharges: number;
              totalFreightDiscount: number;
              surCharges: [
                { type: string; description: string; amount: number },
              ];
              pricingCode: string;
              totalBillingWeight: { units: string; value: number };
              currency: string;
              rateScale: string;
            };
            ratedPackages: [
              {
                groupNumber: number;
                effectiveNetDiscount: number;
                packageRateDetail: {
                  rateType: string;
                  ratedWeightMethod: string;
                  baseCharge: number;
                  netFreight: number;
                  totalSurcharges: number;
                  netFedExCharge: number;
                  totalTaxes: number;
                  netCharge: number;
                  totalRebates: number;
                  billingWeight: { units: string; value: number };
                  totalFreightDiscounts: number;
                  surcharges: [
                    {
                      type: string;
                      description: string;
                      amount: number;
                    },
                  ];
                  currency: string;
                };
              },
            ];
            currency: string;
          },
        ];
        operationalDetail: {
          ineligibleForMoneyBackGuarantee: boolean;
          astraDescription: string;
          airportId: string;
          serviceCode: string;
        };
        signatureOptionType: string;
        serviceDescription: {
          serviceId: string;
          serviceType: string;
          code: string;
          names: [
            { type: 'long'; encoding: 'utf-8'; value: string },
            { type: 'long'; encoding: 'ascii'; value: string },
            { type: 'medium'; encoding: 'utf-8'; value: string },
            { type: 'medium'; encoding: 'ascii'; value: string },
            { type: 'short'; encoding: 'utf-8'; value: string },
            { type: 'short'; encoding: 'ascii'; value: string },
            { type: 'abbrv'; encoding: 'ascii'; value: string },
          ];
          serviceCategory: string;
          description: string;
          astraDescription: string;
        };
      },
    ];
    quoteDate: string;
    encoded: boolean;
  };
}

export interface FedexRatingJson {
  accountNumber: {
    value: string;
  };
  requestedShipment: {
    shipper: {
      address: {
        postalCode: number | string;
        city?: string;
        stateOrProvinceCode?: string;
        countryCode: string;
      };
    };
    recipient: {
      address: {
        postalCode: number | string;
        city?: string;
        stateOrProvinceCode?: string;
        countryCode: string;
      };
    };
    shipDateStamp: string;
    pickupType:
      | 'DROPOFF_AT_FEDEX_LOCATION'
      | 'CONTACT_FEDEX_TO_SCHEDULE'
      | 'USE_SCHEDULED_PICKUP';
    serviceType: string;
    preferredCurrency?: 'USD';
    rateRequestType: ['PREFERRED' | 'LIST' | 'ACCOUNT'];
    customsClearanceDetail?: {
      commercialInvoice?: {
        freightCharge: {
          amount: any;
          currency: 'USD';
        };
      };
      dutiesPayment: {
        paymentType: string;
      };
      commodities: [
        {
          description: string;
          quantity: number;
          isDocumentOnly?: boolean;
          harmonizedCode: string;
          quantityUnits: 'PCS';
          weight: {
            units: 'LB';
            value: number;
          };
          customsValue: {
            amount: number;
            currency: 'USD';
          };
        },
      ];
    };
    shippingDocumentSpecification?: {
      shippingDocumentTypes: ['COMMERCIAL_INVOICE'];
      commercialInvoiceDetail: {
        documentFormat: {
          docType: 'PDF';
          stockType: 'PAPER_LETTER';
        };
      };
    };
    requestedPackageLineItems: [
      {
        groupPackageCount: number;
        weight: {
          units: 'LB';
          value: number;
        };
        dimensions: {
          length: number;
          width: number;
          height: number;
          units: 'IN';
        };
      },
    ];
  };
}

export interface FedexPickUpAvaibilityRestReturn {
  transactionId: string;
  output: {
    requestTimestamp: string;
    options: [
      {
        carrier: string;
        available: true;
        pickupDate: string;
        cutOffTime: string;
        accessTime: {
          hours: number;
          minutes: number;
        };
        residentialAvailable: boolean;
        defaultReadyTime: string;
        defaultLatestTimeOptions: string;
        countryRelationship: string;
        scheduleDay: string;
      },
    ];
  };
}

export interface FedexDropoffLocationsReturnRest {
  transactionId: string;
  output: {
    totalResults: number;
    resultsReturned: number;
    matchedAddress: {
      city: string;
      stateOrProvinceCode: string;
      postalCode: string;
      countryCode: string;
      residential: boolean;
    };
    matchedAddressGeoCoord: {
      latitude: number;
      longitude: number;
    };
    locationDetailList: [
      {
        distance: { units: 'MI'; value: number };
        contactAndAddress: {
          contact: {
            companyName: string;
            phoneNumber: string;
            emailAddress: string;
            faxNumber: string;
          };
          address: {
            streetLines: [string];
            city: string;
            stateOrProvinceCode: string;
            postalCode: string;
            countryCode: string;
            residential: boolean;
          };
          addressAncillaryDetail: {
            displayName: string;
            locationInCity: string;
            building: string;
          };
        };
        locationId: string;
        storeHours: [
          {
            dayOfWeek: string;
            operationalHoursType: string;
            operationalHours: { begins: string; ends: string };
          },
        ];
        geoPositionalCoordinates: {
          latitude: number;
          longitude: number;
        };
        locationType: string;
        locationAttributeTypes: [
          'ACCEPTS_CASH',
          'PACK_AND_SHIP',
          'PACKAGING_SUPPLIES',
          'RETURNS_SERVICES',
          'SIGNS_AND_BANNERS_SERVICE',
          'COPY_AND_PRINT_SERVICES',
        ];
        lockerAvailability: boolean;
      },
    ];
    lockerAvailabilityCode: number;
    lockerAvailabilityMessage: string;
  };
}

export interface FedexDropoffLocationsReturn {
  'SOAP-ENV:Envelope': {
    $: { 'xmlns:SOAP-ENV': string };
    'SOAP-ENV:Header': [string];
    'SOAP-ENV:Body': [
      {
        SearchLocationsReply: [
          {
            $: { xmlns: string };
            HighestSeverity: [string];
            Notifications: [
              {
                Severity: [string];
                Source: [string];
                Code: [string];
                Message: [string];
                LocalizedMessage: [string];
              },
            ];
            Version: [
              {
                ServiceId: [string];
                Major: [string];
                Intermediate: [string];
                Minor: [string];
              },
            ];
            TotalResultsAvailable: [string];
            ResultsReturned: [string];
            AddressToLocationRelationships: [
              {
                MatchedAddress: [
                  {
                    StreetLines: [string];
                    City: [string];
                    StateOrProvinceCode: [string];
                    PostalCode: [string];
                    CountryCode: [string];
                    Residential: [string];
                  },
                ];
                MatchedAddressGeographicCoordinates: [string];
                DistanceAndLocationDetails: [
                  {
                    Distance: [{ Value: [string]; Units: [string] }];
                    LocationDetail: [
                      {
                        LocationId: [string];
                        StoreNumber: [string];
                        LocationContactAndAddress: [
                          {
                            Address: [
                              {
                                StreetLines: [string];
                                City: [string];
                                StateOrProvinceCode: [string];
                                PostalCode: [string];
                                CountryCode: [string];
                                Residential: [string];
                                GeographicCoordinates: [string];
                              },
                            ];
                            AddressAncillaryDetail: [
                              {
                                LocationInProperty: [string];
                                Accessibility: [string];
                                AdditionalDescriptions: [string];
                              },
                            ];
                          },
                        ];
                        LocationType: [string];
                        LocationTypeForDisplay: [string];
                        Attributes: [string];
                        LocationCapabilities: [
                          {
                            CarrierCode: [string];
                            TransferOfPossessionType: [string];
                            DaysOfWeek: [string];
                          },
                          {
                            CarrierCode: [string];
                            ServiceCategory: [string];
                            TransferOfPossessionType: [string];
                            DaysOfWeek: [string];
                          },
                          {
                            CarrierCode: [string];
                            ServiceCategory: [string];
                            TransferOfPossessionType: [string];
                            DaysOfWeek: [string];
                          },
                        ];
                        NormalHours: [
                          {
                            DayofWeek: [string];
                            OperationalHours: [string];
                          },
                        ];
                        HoursForEffectiveDate: [
                          {
                            DayofWeek: [string];
                            OperationalHours: [string];
                          },
                        ];
                        CarrierDetails: [
                          {
                            Carrier: [string];
                            NormalLatestDropOffDetails: [
                              { DayOfWeek: [string]; Time: [string] },
                            ];
                            EffectiveLatestDropOffDetails: [
                              { DayOfWeek: [string]; Time: [string] },
                            ];
                          },
                        ];
                      },
                    ];
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

export interface FedexRateRequestReturn {
  'SOAP-ENV:Envelope': {
    $: { 'xmlns:SOAP-ENV': string };
    'SOAP-ENV:Header': [string];
    'SOAP-ENV:Body': [
      {
        RateReply: [
          {
            $: { xmlns: string };
            HighestSeverity: [string];
            Notifications: [
              {
                Severity: [string];
                Source: [string];
                Code: [string];
                Message: [string];
                LocalizedMessage: [string];
              },
            ];
            Version: [
              {
                ServiceId: [string];
                Major: [string];
                Intermediate: [string];
                Minor: [string];
              },
            ];
            RateReplyDetails: [
              {
                ServiceType: [string];
                ServiceDescription: [
                  {
                    ServiceType: [string];
                    Code: [string];
                    Names: [
                      {
                        Type: [string];
                        Encoding: [string];
                        Value: [string];
                      },
                    ];
                    Description: [string];
                    AstraDescription: [string];
                  },
                ];
                PackagingType: [string];
                DestinationAirportId: [string];
                IneligibleForMoneyBackGuarantee: [string];
                SignatureOption: [string];
                ActualRateType: [string];
                RatedShipmentDetails: [
                  {
                    ShipmentRateDetail: [
                      {
                        RateType: [string];
                        RateZone: [string];
                        RatedWeightMethod: [string];
                        DimDivisor: [string];
                        FuelSurchargePercent: [string];
                        TotalBillingWeight: [
                          { Units: [string]; Value: [string] },
                        ];
                        TotalBaseCharge: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalFreightDiscounts: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalNetFreight: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalSurcharges: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalNetFedExCharge: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalTaxes: [{ Currency: [string]; Amount: [string] }];
                        TotalNetCharge: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalRebates: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalDutiesAndTaxes: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalAncillaryFeesAndTaxes: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalDutiesTaxesAndFees: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        TotalNetChargeWithDutiesAndTaxes: [
                          { Currency: [string]; Amount: [string] },
                        ];
                        Surcharges: [
                          {
                            SurchargeType: [string];
                            Level: [string];
                            Description: [string];
                            Amount: [{ Currency: [string]; Amount: [string] }];
                          },
                        ];
                      },
                    ];
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

export interface FedexPickUpAvaibilityReturn {
  'SOAP-ENV:Envelope': {
    $: { 'xmlns:SOAP-ENV': string };
    'SOAP-ENV:Header': [string];
    'SOAP-ENV:Body': [
      {
        PickupAvailabilityReply: [
          {
            $: { xmlns: string };
            HighestSeverity: [string];
            Notifications: [
              {
                Severity: [string];
                Source: [string];
                Code: [string];
                Message: [string];
                LocalizedMessage: [string];
              },
            ];
            Version: [
              {
                ServiceId: [string];
                Major: [string];
                Intermediate: [string];
                Minor: [string];
              },
            ];
            RequestTimestamp: [string];
            Options: [
              {
                Carrier: [string];
                ScheduleDay: [string];
                Available: [string];
                PickupDate: [string];
                CutOffTime: [string];
                AccessTime: [string];
                ResidentialAvailable: [string];
              },
            ];
            CloseTime: [string];
            OpenTime: [string];
            LocalTime: [string];
          },
        ];
      },
    ];
  };
}

export interface FedexPickupRequestReturn {
  transactionId: string;
  customerTransactionId: string;
  output: {
    pickupConfirmationCode: string;
    message: string;
    location: string;
    alerts: [
      {
        code: string;
        alertType: string;
        message: string;
      },
    ];
  };
}

export interface FedexTrackingReturn {
  transactionId: string;
  customerTransactionId: string;
  output: {
    completeTrackResults: [
      {
        trackingNumber: string;
        trackResults: [
          {
            trackingNumberInfo: {
              trackingNumber: string;
              trackingNumberUniqueId: string;
              carrierCode: string;
            };
            additionalTrackingInfo: {
              nickname: string;
              hasAssociatedShipments: boolean;
            };
            shipperInformation: {
              contact: unknown;
              address: {
                city: string;
                stateOrProvinceCode: string;
                countryCode: string;
                residential: boolean;
                countryName: string;
              };
            };
            recipientInformation: {
              contact: unknown;
              address: {
                city: string;
                stateOrProvinceCode: string;
                countryCode: string;
                residential: boolean;
                countryName: string;
              };
            };
            latestStatusDetail: {
              code: string;
              derivedCode: string;
              statusByLocale: string;
              description: string;
              scanLocation: {
                city: string;
                stateOrProvinceCode: string;
                countryCode: string;
                residential: boolean;
                countryName: string;
              };
            };
            dateAndTimes: [
              {
                type: string;
                dateTime: string;
              },
              {
                type: string;
                dateTime: string;
              },
              {
                type: string;
                dateTime: string;
              },
              {
                type: string;
                dateTime: string;
              },
              {
                type: string;
                dateTime: string;
              },
            ];
            availableImages: [
              {
                type: string;
              },
            ];
            packageDetails: {
              packagingDescription: {
                type: string;
                description: string;
              };
              physicalPackagingType: string;
              sequenceNumber: string;
              count: string;
              weightAndDimensions: {
                weight: [
                  {
                    value: string;
                    unit: string;
                  },
                  {
                    value: string;
                    unit: string;
                  },
                ];
              };
              packageContent: [];
            };
            shipmentDetails: {
              possessionStatus: boolean;
            };
            scanEvents: [
              {
                date: string;
                eventType: string;
                eventDescription: string;
                exceptionCode: string;
                exceptionDescription: string;
                scanLocation: {
                  streetLines: string[];
                  city: string;
                  stateOrProvinceCode: string;
                  postalCode: string;
                  countryCode: string;
                  residential: boolean;
                  countryName: string;
                };
                locationType: string;
                derivedStatusCode: string;
                derivedStatus: string;
              },
            ];
            availableNotifications: string[];
            deliveryDetails: {
              actualDeliveryAddress: {
                city: string;
                stateOrProvinceCode: string;
                countryCode: string;
                residential: boolean;
                countryName: string;
              };
              deliveryAttempts: string;
              receivedByName: string;
              deliveryOptionEligibilityDetails: [
                {
                  option: string;
                  eligibility: string;
                },
              ];
            };
            originLocation: {
              locationContactAndAddress: {
                address: {
                  city: string;
                  stateOrProvinceCode: string;
                  countryCode: string;
                  residential: boolean;
                  countryName: string;
                };
              };
            };
            lastUpdatedDestinationAddress: {
              city: string;
              stateOrProvinceCode: string;
              countryCode: string;
              residential: boolean;
              countryName: string;
            };
            serviceDetail: {
              type: string;
              description: string;
              shortDescription: string;
            };
            standardTransitTimeWindow: {
              window: {
                ends: string;
              };
            };
            estimatedDeliveryTimeWindow: {
              window: unknown;
            };
            goodsClassificationCode: string;
            returnDetail: unknown;
          },
        ];
      },
    ];
  };
}

export interface FedexTrackinRequest {
  includeDetailedScans: boolean;
  trackingInfo: [
    {
      trackingNumberInfo: {
        trackingNumber: string;
      };
    },
  ];
}
