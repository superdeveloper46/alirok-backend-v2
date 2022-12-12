export interface IFormatAddress {
  street_number: string;
  postal_codes: {
    value: string;
  };
  location_administrative_divisions: {
    administrative_divisions: {
      administrative_division_types: {
        name: string;
      };
      value: string;
    };
  }[];
}
