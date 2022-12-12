import { Prisma, PrismaClient } from '@generated/client';
import { Injectable } from '@nestjs/common';
import { NewCreateParcelBookingAddressDataDTO } from '../../app/parcel-booking/dto/new-parcel-booking.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AddressService {
  // constructor(private readonly prisma: PrismaService) {}

  public async create(
    location: NewCreateParcelBookingAddressDataDTO,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      if (!location) return null;

      const { postal_code_uuid, divisions } =
        await this.createOrUpdateLocationPrerequisites(location, prisma);
      if (!divisions || !postal_code_uuid) return null;

      const { streetNumber, complementAddress } = location;

      const address_type =
        (location.addressType.toUpperCase() as 'RESIDENTIAL' | 'COMMERCIAL') ||
        'RESIDENTIAL';

      const createLocation = await prisma.locations.create({
        data: {
          location_uuid: uuidv4(),
          street_number: streetNumber,
          complement: complementAddress,
          postal_code_uuid: postal_code_uuid,
          address_type: address_type,
        },
      });
      await this.makeRelationship(
        createLocation.location_uuid,
        divisions,
        prisma,
      );

      return await this.getLocation(createLocation.location_uuid, prisma);
    } catch (error) {
      console.error('******************** error', error);
      return null;
    }
  }

  public async getLocation(
    locationUuid,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      const location = await prisma.locations.findUnique({
        where: { location_uuid: locationUuid },
        include: {
          postal_codes: true,
          location_administrative_divisions: {
            include: {
              administrative_divisions: {
                include: {
                  administrative_division_types: true,
                  location_administrative_divisions: true,
                },
              },
            },
            where: { location_uuid: locationUuid },
          },
        },
      });

      if (!location) return null;
      return this.formatLocation(location);
    } catch (error) {
      console.error('******************** error', error);
      return null;
    }
  }

  public formatLocation(location) {
    if (!location) return null;
    const divisionsList = location.location_administrative_divisions.map(
      (data) => ({
        [data?.administrative_divisions?.administrative_division_types?.name]:
          data?.administrative_divisions?.value,
      }),
    );

    const divisions =
      divisionsList.length > 0
        ? divisionsList.reduce((accumulator, element) => ({
            ...accumulator,
            ...element,
          }))
        : [];

    const addressObject = {
      location_uuid: location.location_uuid,
      ...divisions,
      street_number: location.street_number,
      postal_code: location.postal_codes.value,
      complement_address: location.complement,
      address_type: location.address_type,
    };

    return {
      ...addressObject,
      address_formatted: this.formattedAddress(addressObject),
    };
  }

  public formattedAddress(addressObject) {
    const street = addressObject?.street ?? '';
    const streetNumber = addressObject?.street_number ?? '';
    const postalCode = addressObject?.postal_code ?? '';
    const city = addressObject?.city ?? '';
    const state = addressObject?.state ?? '';
    const country = addressObject?.country ?? '';
    const complementAddress = addressObject?.complement_address
      ? `Complement: ${addressObject?.complement_address}.`
      : '';

    return `${street} ${streetNumber}, ${postalCode}, ${city}, ${state}-${country}. ${complementAddress}`;
  }

  public formatDustyLocation(location) {
    return {
      address_type: location.address_type ?? '',
      street: location.street ?? '',
      state: location.state ?? '',
      country: location.country ?? '',
      city: location.city ?? '',
      street_number: location.streetNumber ?? '',
      postal_code: location.zipCode ?? '',
      complement_address: location.complementAddress ?? '',
    };
  }

  public isSameLocation(location, anotherLocation) {
    if (!location || !anotherLocation) return false;

    let isSame = true;

    delete location.location_uuid;
    delete location.address_formatted;

    const formattedDustyLocation = this.formatDustyLocation(anotherLocation);

    const keys = Object.keys(location);
    keys.forEach((key) => {
      if (location[key] !== formattedDustyLocation[key]) isSame = false;
    });

    return isSame;
  }

  private async getOrSaveDivisions(
    divisions,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      const divisionsSaved = divisions.map(async (division) => {
        let savedDivision = await prisma.administrative_divisions.findFirst({
          where: { value: division.value },
        });

        if (!savedDivision) {
          savedDivision = await prisma.administrative_divisions.create({
            data: {
              administrative_division_uuid: uuidv4(),
              value: division.value,
              administrative_division_type_uuid:
                division.administrative_division_type_uuid,
            },
          });
        }

        return savedDivision;
      });

      return await Promise.all(divisionsSaved)
        .then((divisions) => divisions)
        .catch((error) => {
          console.error('******************** error', error);
          return null;
        });
    } catch (error) {
      console.error('******************** error', error);
      return null;
    }
  }

  private async createOrUpdateLocationPrerequisites(
    location: NewCreateParcelBookingAddressDataDTO,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      const { zipCode, country, state, street, city } = location;

      const { postal_code_uuid } = await this.getOrSavePostalCode(
        zipCode,
        prisma,
      );

      const [streetType, stateType, countryType, cityType]: any =
        await this.getOrSaveDivisionTypes(
          ['street', 'state', 'country', 'city'],
          prisma,
        );

      const divisions = await this.getOrSaveDivisions(
        [
          {
            value: street,
            administrative_division_type_uuid: streetType.uuid,
          },
          {
            value: state,
            administrative_division_type_uuid: stateType.uuid,
          },
          {
            value: country,
            administrative_division_type_uuid: countryType.uuid,
          },
          {
            value: city,
            administrative_division_type_uuid: cityType.uuid,
          },
        ],
        prisma,
      );

      return { postal_code_uuid, divisions };
    } catch (error) {
      console.error('******************** error', error);
    }
  }

  private async makeRelationship(
    location_uuid,
    divisions,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      divisions.forEach(async ({ administrative_division_uuid }) => {
        const uuid = uuidv4();
        await prisma.location_administrative_divisions.create({
          data: {
            location_administrative_division_uuid: uuid,
            location_uuid,
            administrative_division_uuid,
          },
        });
      });
    } catch (error) {
      console.error('******************** error', error);
      return null;
    }
  }

  private async getOrSaveDivisionTypes(
    divisionTypes,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      const divisionsUuid = await divisionTypes.map(async (division) => {
        let savedDivisionType: any =
          await prisma.administrative_division_types.findUnique({
            where: { name: division },
          });

        const uuid = uuidv4();
        if (!savedDivisionType) {
          savedDivisionType = prisma.administrative_division_types.create({
            data: {
              name: division,
              administrative_division_type_uuid: uuid,
            },
          });
        }

        return {
          type: division,
          uuid: savedDivisionType?.administrative_division_type_uuid || uuid,
        };
      });

      return await Promise.all(divisionsUuid);
    } catch (error) {
      console.error('******************** error', error);
      return null;
    }
  }

  async getOrSavePostalCode(
    postalCode,
    prisma: Omit<
      PrismaClient<
        Prisma.PrismaClientOptions,
        never,
        Prisma.RejectOnNotFound | Prisma.RejectPerOperation
      >,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'
    >,
  ) {
    try {
      const savedPostalCode = await prisma.postal_codes.findUnique({
        where: { value: postalCode },
      });

      if (!savedPostalCode) {
        const newPostalCode = await await prisma.postal_codes.create({
          data: {
            value: postalCode,
            postal_code_uuid: uuidv4(),
          },
        });

        return newPostalCode;
      }

      return savedPostalCode;
    } catch (error) {
      console.error('******************** error', error);
      return null;
    }
  }

  public getCountryName = (countryCode: string): string => {
    const isoCountries: any = {
      AF: 'Afghanistan',
      AX: 'Aland Islands',
      AL: 'Albania',
      DZ: 'Algeria',
      AS: 'American Samoa',
      AD: 'Andorra',
      AO: 'Angola',
      AI: 'Anguilla',
      AQ: 'Antarctica',
      AG: 'Antigua And Barbuda',
      AR: 'Argentina',
      AM: 'Armenia',
      AW: 'Aruba',
      AU: 'Australia',
      AT: 'Austria',
      AZ: 'Azerbaijan',
      BS: 'Bahamas',
      BH: 'Bahrain',
      BD: 'Bangladesh',
      BB: 'Barbados',
      BY: 'Belarus',
      BE: 'Belgium',
      BZ: 'Belize',
      BJ: 'Benin',
      BM: 'Bermuda',
      BT: 'Bhutan',
      BO: 'Bolivia',
      BA: 'Bosnia And Herzegovina',
      BW: 'Botswana',
      BV: 'Bouvet Island',
      BR: 'Brazil',
      IO: 'British Indian Ocean Territory',
      BN: 'Brunei Darussalam',
      BG: 'Bulgaria',
      BF: 'Burkina Faso',
      BI: 'Burundi',
      KH: 'Cambodia',
      CM: 'Cameroon',
      CA: 'Canada',
      CV: 'Cape Verde',
      KY: 'Cayman Islands',
      CF: 'Central African Republic',
      TD: 'Chad',
      CL: 'Chile',
      CN: 'China',
      CX: 'Christmas Island',
      CC: 'Cocos (Keeling) Islands',
      CO: 'Colombia',
      KM: 'Comoros',
      CG: 'Congo',
      CD: 'Congo, Democratic Republic',
      CK: 'Cook Islands',
      CR: 'Costa Rica',
      CI: "Cote D'Ivoire",
      HR: 'Croatia',
      CU: 'Cuba',
      CY: 'Cyprus',
      CZ: 'Czech Republic',
      DK: 'Denmark',
      DJ: 'Djibouti',
      DM: 'Dominica',
      DO: 'Dominican Republic',
      EC: 'Ecuador',
      EG: 'Egypt',
      SV: 'El Salvador',
      GQ: 'Equatorial Guinea',
      ER: 'Eritrea',
      EE: 'Estonia',
      ET: 'Ethiopia',
      FK: 'Falkland Islands (Malvinas)',
      FO: 'Faroe Islands',
      FJ: 'Fiji',
      FI: 'Finland',
      FR: 'France',
      GF: 'French Guiana',
      PF: 'French Polynesia',
      TF: 'French Southern Territories',
      GA: 'Gabon',
      GM: 'Gambia',
      GE: 'Georgia',
      DE: 'Germany',
      GH: 'Ghana',
      GI: 'Gibraltar',
      GR: 'Greece',
      GL: 'Greenland',
      GD: 'Grenada',
      GP: 'Guadeloupe',
      GU: 'Guam',
      GT: 'Guatemala',
      GG: 'Guernsey',
      GN: 'Guinea',
      GW: 'Guinea-Bissau',
      GY: 'Guyana',
      HT: 'Haiti',
      HM: 'Heard Island & Mcdonald Islands',
      VA: 'Holy See (Vatican City State)',
      HN: 'Honduras',
      HK: 'Hong Kong',
      HU: 'Hungary',
      IS: 'Iceland',
      IN: 'India',
      ID: 'Indonesia',
      IR: 'Iran, Islamic Republic Of',
      IQ: 'Iraq',
      IE: 'Ireland',
      IM: 'Isle Of Man',
      IL: 'Israel',
      IT: 'Italy',
      JM: 'Jamaica',
      JP: 'Japan',
      JE: 'Jersey',
      JO: 'Jordan',
      KZ: 'Kazakhstan',
      KE: 'Kenya',
      KI: 'Kiribati',
      KR: 'Korea',
      KW: 'Kuwait',
      KG: 'Kyrgyzstan',
      LA: "Lao People's Democratic Republic",
      LV: 'Latvia',
      LB: 'Lebanon',
      LS: 'Lesotho',
      LR: 'Liberia',
      LY: 'Libyan Arab Jamahiriya',
      LI: 'Liechtenstein',
      LT: 'Lithuania',
      LU: 'Luxembourg',
      MO: 'Macao',
      MK: 'Macedonia',
      MG: 'Madagascar',
      MW: 'Malawi',
      MY: 'Malaysia',
      MV: 'Maldives',
      ML: 'Mali',
      MT: 'Malta',
      MH: 'Marshall Islands',
      MQ: 'Martinique',
      MR: 'Mauritania',
      MU: 'Mauritius',
      YT: 'Mayotte',
      MX: 'Mexico',
      FM: 'Micronesia, Federated States Of',
      MD: 'Moldova',
      MC: 'Monaco',
      MN: 'Mongolia',
      ME: 'Montenegro',
      MS: 'Montserrat',
      MA: 'Morocco',
      MZ: 'Mozambique',
      MM: 'Myanmar',
      NA: 'Namibia',
      NR: 'Nauru',
      NP: 'Nepal',
      NL: 'Netherlands',
      AN: 'Netherlands Antilles',
      NC: 'New Caledonia',
      NZ: 'New Zealand',
      NI: 'Nicaragua',
      NE: 'Niger',
      NG: 'Nigeria',
      NU: 'Niue',
      NF: 'Norfolk Island',
      MP: 'Northern Mariana Islands',
      NO: 'Norway',
      OM: 'Oman',
      PK: 'Pakistan',
      PW: 'Palau',
      PS: 'Palestinian Territory, Occupied',
      PA: 'Panama',
      PG: 'Papua New Guinea',
      PY: 'Paraguay',
      PE: 'Peru',
      PH: 'Philippines',
      PN: 'Pitcairn',
      PL: 'Poland',
      PT: 'Portugal',
      PR: 'Puerto Rico',
      QA: 'Qatar',
      RE: 'Reunion',
      RO: 'Romania',
      RU: 'Russian Federation',
      RW: 'Rwanda',
      BL: 'Saint Barthelemy',
      SH: 'Saint Helena',
      KN: 'Saint Kitts And Nevis',
      LC: 'Saint Lucia',
      MF: 'Saint Martin',
      PM: 'Saint Pierre And Miquelon',
      VC: 'Saint Vincent And Grenadines',
      WS: 'Samoa',
      SM: 'San Marino',
      ST: 'Sao Tome And Principe',
      SA: 'Saudi Arabia',
      SN: 'Senegal',
      RS: 'Serbia',
      SC: 'Seychelles',
      SL: 'Sierra Leone',
      SG: 'Singapore',
      SK: 'Slovakia',
      SI: 'Slovenia',
      SB: 'Solomon Islands',
      SO: 'Somalia',
      ZA: 'South Africa',
      GS: 'South Georgia And Sandwich Isl.',
      ES: 'Spain',
      LK: 'Sri Lanka',
      SD: 'Sudan',
      SR: 'Suriname',
      SJ: 'Svalbard And Jan Mayen',
      SZ: 'Swaziland',
      SE: 'Sweden',
      CH: 'Switzerland',
      SY: 'Syrian Arab Republic',
      TW: 'Taiwan',
      TJ: 'Tajikistan',
      TZ: 'Tanzania',
      TH: 'Thailand',
      TL: 'Timor-Leste',
      TG: 'Togo',
      TK: 'Tokelau',
      TO: 'Tonga',
      TT: 'Trinidad And Tobago',
      TN: 'Tunisia',
      TR: 'Turkey',
      TM: 'Turkmenistan',
      TC: 'Turks And Caicos Islands',
      TV: 'Tuvalu',
      UG: 'Uganda',
      UA: 'Ukraine',
      AE: 'United Arab Emirates',
      GB: 'United Kingdom',
      US: 'United States',
      UM: 'United States Outlying Islands',
      UY: 'Uruguay',
      UZ: 'Uzbekistan',
      VU: 'Vanuatu',
      VE: 'Venezuela',
      VN: 'Viet Nam',
      VG: 'Virgin Islands, British',
      VI: 'Virgin Islands, U.S.',
      WF: 'Wallis And Futuna',
      EH: 'Western Sahara',
      YE: 'Yemen',
      ZM: 'Zambia',
      ZW: 'Zimbabwe',
    };

    if (Object.prototype.hasOwnProperty.call(isoCountries, countryCode)) {
      return isoCountries[countryCode] as any;
    } else {
      return countryCode;
    }
  };

  public convertWeekDayToString = (day: number) => {
    let dayOfWeek = '';

    switch (day) {
      case 0:
        dayOfWeek = 'SUN';
        break;
      case 1:
        dayOfWeek = 'MON';
        break;
      case 2:
        dayOfWeek = 'TUE';
        break;
      case 3:
        dayOfWeek = 'WED';
        break;
      case 4:
        dayOfWeek = 'THU';
        break;
      case 5:
        dayOfWeek = 'FRI';
        break;
      case 6:
        dayOfWeek = 'SAT';
        break;

      default:
        return dayOfWeek;
    }

    return dayOfWeek;
  };
}
