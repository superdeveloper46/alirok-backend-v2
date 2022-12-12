export interface IReturnMaskedAddressData {
  additionalAddress?: string;
  streetNumber: string;
  zipCode: string;
  city: string;
  street: string;
  state: string;
  country: string;
  addressType?: 'residential' | 'commercial';
}

export interface IReturnMaskedData {
  phone: any;
  taxId: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

export interface IPickupAvailabilityData {
  address: {
    country: string;
    state: string;
    city: string;
    postal_code: string;
    address: string;
    street: string;
    street_number: string;
    is_residential_address: boolean;
    complement_address: string | null;
  };
  pickup_date: Date;
}
