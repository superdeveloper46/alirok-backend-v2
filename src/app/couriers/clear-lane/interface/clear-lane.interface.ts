export interface IClearLaneTracking {
  station?: string;
  housebill: string;
  suffix?: string;
}

export interface IClearLaneRatingResponse {
  'soap:Envelope': {
    $: {
      'xmlns:soap': string;
      'xmlns:xsi': string;
      'xmlns:xsd': string;
    };
    'soap:Body': [
      {
        GetRatingResponse: [
          {
            $: { xmlns: string };
            GetRatingResult: [
              {
                RatingOutput: [
                  {
                    RequestID: [string];
                    ServiceLevelID: [string];
                    DeliveryDate: [string];
                    DeliveryTime: [string];
                    StandardFreightCharge: [string];
                    StandardTotalRate: [string];
                    Message: [string];
                    AccessorialOutput: [
                      {
                        AccessorialOutput: [
                          {
                            AccessorialCode: [string];
                            AccessorialDesc: [string];
                            AccessorialCharge: [string];
                          },
                        ];
                      },
                    ];
                    TransitDays: [string];
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
