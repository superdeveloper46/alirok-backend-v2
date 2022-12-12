export interface IMailAmericasShippingServices {
  serviceName: string;
  serviceCode: string;
  incoterm: 'DDU' | 'DDP' | 'BOTH';
}

export interface IMailAmericasShippingPayload {
  order_id: string;
  sale_date: string;
  service: string;
  delivery_duties_paid: 'N' | 'Y';
  returns_allowed: 'N' | 'Y';
  label_format?: 'pdf' | 'zpl';
  package: {
    net_weight?: number;
    weight: number;
    weight_unit?: 'kg' | 'oz';
    height?: number;
    width?: number;
    length?: number;
    measurement_unit?: 'cm' | 'in';
    declared_value?: number;
    freight?: number;
    cif?: number;
    insurance?: number;
    taxes?: number;
    duties?: number;
    payment_method?: string;
    issuing_entity?: string;
    last_four_digits_payment_method?: number;
    transaction_number?: string;
  };

  shipper?: {
    name: string;
    contact_name?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    district?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    email?: string;
    phone?: string;
  };

  buyer: {
    name: string;
    buyer_id?: string;
    company?: string;
    address1: string;
    address1_number: number;
    address2?: string;
    address3?: string;
    district?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    email: string;
    phone: string;
  };

  items: {
    quantity: number;
    sku?: string;
    description: string;
    description_alt?: string;
    net_weight?: number;
    declared_value?: number;
    hs_code?: string;
    external_item_id?: string;
    category?: string;
    product_url?: string;
  }[];
}

export interface IMailAmericasShipmentReturn {
  error: boolean;
  data: {
    tracking: string;
    format: string;
    label: string;
  };
}
