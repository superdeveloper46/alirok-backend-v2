import { Injectable } from '@nestjs/common';
import {
  NewRateShipmentDTO,
  NewRateShipmentWhatsInsideDataDTO,
} from '../../../app/couriers/dto/newCouriers.dto';
import * as Jimp from 'jimp';

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

@Injectable()
export class FormattersService {
  public async convertBtwTiffPng(imgBuffer: Buffer): Promise<string> {
    let imageB64;

    await Jimp.read(imgBuffer)
      .then((file) => {
        imageB64 = file.getBase64Async(Jimp.MIME_PNG);
      })
      .catch((err) => {
        console.error(err);
      });

    const formattedImage = await imageB64;

    return formattedImage;
  }

  public async rotateImage(imgBuffer: Buffer, deg: number): Promise<string> {
    let imageB64;

    await Jimp.read(imgBuffer)
      .then((file) => {
        imageB64 = file.rotate(deg).getBase64Async(Jimp.MIME_PNG);
      })
      .catch((err) => {
        console.error(err);
      });

    const formattedImage = await imageB64;

    return formattedImage;
  }

  public getCountryName = (countryCode: string): string => {
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

  public convertPackagesToImperial({
    whatsInside: { data },
  }: NewRateShipmentDTO) {
    return data.map((i) => ({
      ...i,
      dimensions: {
        ...i.dimensions,
        unit: 'in',
        height:
          i.dimensions.unit === 'in'
            ? i.dimensions.height
            : this.convertCmInInches(i.dimensions.height),
        length:
          i.dimensions.unit === 'in'
            ? i.dimensions.length
            : this.convertCmInInches(i.dimensions.length),
        width:
          i.dimensions.unit === 'in'
            ? i.dimensions.width
            : this.convertCmInInches(i.dimensions.width),
      },
      weight: {
        ...i.weight,
        unit: 'lb',
        value:
          i.weight.unit === 'lb'
            ? i.weight.value
            : this.convertKgsToLbs(i.weight.value),
      },
    }));
  }

  public convertPackagesToXMLMultiplePackagesRequest(
    data: NewRateShipmentWhatsInsideDataDTO[],
  ) {
    return data.map((i) => {
      return Array(Number(i.pieces)).fill({
        ...i,
      });
    });
  }

  public convertPackagesToMetric({
    whatsInside: { data },
  }: NewRateShipmentDTO) {
    return data.map((i) => ({
      ...i,
      dimensions: {
        ...i.dimensions,
        unit: 'cm',
        height:
          i.dimensions.unit === 'cm'
            ? i.dimensions.height
            : this.convertInchesInCM(i.dimensions.height),
        length:
          i.dimensions.unit === 'cm'
            ? i.dimensions.length
            : this.convertInchesInCM(i.dimensions.length),
        width:
          i.dimensions.unit === 'cm'
            ? i.dimensions.width
            : this.convertInchesInCM(i.dimensions.width),
      },
      weight: {
        ...i.weight,
        unit: 'kg',
        value:
          i.weight.unit === 'kg'
            ? i.weight.value
            : this.convertLbsToKgs(i.weight.value),
      },
    }));
  }

  public convertPoundsToOunces = (weight: string | number): number => {
    return Math.round(Number(weight) * 16 * 100) / 100;
  };

  public convertKgsToLbs = (weight: string | number): number => {
    return Math.round(Number(weight) * 2.204 * 100) / 100;
  };

  public convertLbsToKgs = (weight: string | number): number => {
    return Math.round((Number(weight) / 2.204) * 100) / 100;
  };

  public convertCmInInches = (size: string | number): number => {
    return Math.round(Number(size) * 0.3937 * 100) / 100;
  };

  public convertInchesInCM = (size: string | number): number => {
    return Math.round((Number(size) / 0.3937) * 100) / 100;
  };

  public roundAmount = (number: number): number => {
    return Math.round((number + Number.EPSILON) * 100) / 100;
  };

  public roundUpperInteger = (number: number): number => {
    return Math.ceil(number);
  };

  public toNetWeight = (number: number): number => {
    return Math.round((number * 0.7 + Number.EPSILON) * 100) / 100;
  };

  public betweenRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  public uInt8ArrayToBase64(uInt8Array) {
    /*
  MIT License
  Copyright (c) 2020 Egor Nepomnyaschih
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
  */

    const base64abc = [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '+',
      '/',
    ];

    let bytes = uInt8Array;

    let result = '',
      i,
      l = bytes.length;
    for (i = 2; i < l; i += 3) {
      result += base64abc[bytes[i - 2] >> 2];
      result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
      result += base64abc[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
      result += base64abc[bytes[i] & 0x3f];
    }
    if (i === l + 1) {
      // 1 octet yet to write
      result += base64abc[bytes[i - 2] >> 2];
      result += base64abc[(bytes[i - 2] & 0x03) << 4];
      result += '==';
    }
    if (i === l) {
      // 2 octets yet to write
      result += base64abc[bytes[i - 2] >> 2];
      result += base64abc[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
      result += base64abc[(bytes[i - 1] & 0x0f) << 2];
      result += '=';
    }

    return result;
  }

  public calculateTotalWeight = (
    whatsInside: NewRateShipmentDTO['whatsInside']['data'],
  ): number => {
    let totalWeight = 0;

    whatsInside.forEach((i) => {
      totalWeight = totalWeight + i.pieces * i.weight.value;
    });

    return totalWeight;
  };
}
