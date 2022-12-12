import * as _ from 'lodash';
import { IFormatAddress } from './dto/global-helpers.dto';

/**
 * Display payment/net terms in readable format
 *
 * @param  String term days
 * @return String
 */
export const renderNetTerms = (days: string): string => {
  const tmpDays = Number(days);

  if (tmpDays == 0) {
    return 'Advance payment';
  } else if (tmpDays > 0) {
    return `${tmpDays} days`;
  } else {
    return '-';
  }
};

/**
 * Sleep thread for specified milliseconds
 *
 * @param  number milliseconds, Default 1000 milliseconds
 * @return Promise<unknown>
 */
export const sleepThread = (milliseconds?: number): Promise<unknown> => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds || 1000));
};

/**
 * Format the address
 *
 * @param  data IFormatAddress
 * @return String formatted address
 */
export const formatAddress = (data: IFormatAddress): string => {
  try {
    const streetNumber = data.street_number;
    const postalCodes = data.postal_codes.value;
    let city = data.location_administrative_divisions.filter(
      (row) =>
        row.administrative_divisions.administrative_division_types.name ===
        'city',
    );
    let state = data.location_administrative_divisions.filter(
      (row) =>
        row.administrative_divisions.administrative_division_types.name ===
        'state',
    );
    let country = data.location_administrative_divisions.filter(
      (row) =>
        row.administrative_divisions.administrative_division_types.name ===
        'country',
    );

    city = _.get(city, '[0].administrative_divisions.value', '');
    state = _.get(state, '[0].administrative_divisions.value', '');
    country = _.get(country, '[0].administrative_divisions.value', '');
    const addPart1 = [streetNumber, city].filter((row) => row).join(' ');
    const addPart2 = [state, country, postalCodes]
      .filter((row) => row)
      .join(', ');
    return `${addPart1}, ${addPart2}`;
  } catch (error) {
    return 'N/A';
  }
};
