export interface SkyPostalUserInfo {
  user_code: any;
  user_key: string;
  app_key: string;
}

export interface SkyPostalRateRequest {
  user_info: SkyPostalUserInfo;
  weight: number;
  weight_type: 'kg' | 'lb';
  merchandise_value: number;
  copa_id: number;
  country_code: number;
  city_code: number;
  fmpr_cdg?: 'TEL' | 'VYC' | 'OTR' | any;
  height_dim: number;
  length_dim: number;
  width_dim: number;
  dim_type: 'cm' | 'in';
  coupon_code: string;
  iata_code_origin: string;
  zip_code: string;
  rate_service_code: number;
  zone?: string;
  import_service_code?: 'DDU' | 'DDP';
  iata_code_destination?: string;
  apply_discount?: number;
}

export interface SkyPostalRateRequestReturnData {
  incoterm?: string;
  rateServiceCode?: number;
  description?: string;
  daysInTransit?: number;
  _verify: boolean;
  additional_discount: number;
  custom_value: number;
  custom_value_additional: number;
  extra_value: number;
  fmpr_cdg: 'TEL' | 'VYC' | 'OTR' | any;
  fuel_surcharge: number;
  handling_fee: number;
  insurance_value: number;
  is_100pre_discount: number;
  promotion_code: string;
  rate_dis_com_part: number;
  rate_dsc_beyond: number;
  rate_dsc_commercial_partner: string;
  rate_dsc_gateway: number;
  rate_dsc_value_commercial_partner: number;
  rate_vlr_gatewaty: number;
  ship_discount: number;
  ship_subtotal_rate: number;
  ship_total_rate: number;
  total_customs: number;
  total_shipping: number;
  total_value: number;
  default_rate_applied: boolean;
  additional_info: any;
  error: any;
}

export interface SkyPostalRateRequestReturn {
  data: SkyPostalRateRequestReturnData[];
  additional_info: any;
  error: any;
}

export interface SkyPostalShipmentPhoneRequest {
  phone_type: 1 | 2;
  phone_number: string;
}

export interface SkyPostalShipmentAddressRequest {
  country_code?: number;
  country_iso_code: string;
  country_name?: string;
  state_code?: number;
  state_name?: string;
  state_abbreviation: string;
  county_code?: number;
  county_name?: string;
  city_code?: number;
  city_name?: string;
  zip_code: string;
  neighborhood?: string;
  address_01?: string;
  address_02?: string;
  address_03?: string;
}

export interface SkyPostalShipmentOptionsAdditionalServicesRequest {
  zipcode_validation: number;
  id_validation: number;
  harmonization_code_validation: number;
  destination_address_validation: boolean;
}

export interface SkyPostalShipmentOptionsRequest {
  include_label_data: boolean;
  include_label_zpl: boolean;
  zpl_encode_base64?: boolean;
  zpl_label_dpi: 203 | 300;
  include_label_image?: boolean;
  include_label_image_format?: 'PNG' | 'PDF';
  manifest_type: 'DDP' | 'DDU';
  insurance_code?: 0 | 1 | 2;
  rate_service_code: number;
  generate_label_default?: boolean;
  return_if_exists?: boolean;
  skip_dims_limit_validation?: boolean;
  skip_weight_limit_validation?: boolean;
  allow_saturday_delivery?: boolean;
  additional_services?: SkyPostalShipmentOptionsAdditionalServicesRequest;
}

export interface SkyPostalShipmentMerchant {
  name: string;
  email: string;
  address: SkyPostalShipmentAddressRequest;
  return_address?: SkyPostalShipmentAddressRequest;
  phone: SkyPostalShipmentPhoneRequest[];
}

export interface SkyPostalShipmentShipper {
  name: string;
  email: string;
  address: SkyPostalShipmentAddressRequest;
  return_address?: SkyPostalShipmentAddressRequest;
  phone: SkyPostalShipmentPhoneRequest[];
}

export interface SkyPostalShipmentSender {
  name: string;
  email: string;
  address: SkyPostalShipmentAddressRequest;
  return_address?: SkyPostalShipmentAddressRequest;
  phone: SkyPostalShipmentPhoneRequest[];
}

export interface SkyPostalShipmentConsignee {
  first_name: string;
  last_name: string;
  email: string;
  id_number: string;
  id_search_string?: string;
  address: SkyPostalShipmentAddressRequest;
  phone?: SkyPostalShipmentPhoneRequest[];
}

export interface SkyPostalShipmentDataItems {
  hs_code: string;
  family_product: 'TEL' | 'VYC' | 'OTR' | any;
  serial_number?: string;
  imei_number?: string;
  description: string;
  product_brand?: string;
  product_name?: string;
  product_model?: string;
  quantity: number;
  tax?: number;
  value: number;
  weight: number;
}

export interface SkyPostalShipmentDataPointOfEntry {
  ctry_iso_code: string;
  iata_code: string;
}

export interface SkyPostalLabelsMerge {
  labelBase64: string;
  courier?: 'usps' | 'ups' | 'skypostal' | 'fedex' | 'bps' | 'mailamericas';
}

export interface SkyPostalGetCityCode {
  user_info: SkyPostalUserInfo;
  zip_code_info: { country_iso_code: string; zip_code: string };
}

export interface SkyPostalShipmentData {
  external_tracking: string;
  reference_date: string;
  reference_number_01?: string;
  reference_number_02?: string;
  reference_number_03?: string;
  tax: number;
  value: number;
  discount: number;
  freight: number;
  insurance?: number;
  currency_iso_code: string;
  dimension_01: number;
  dimension_02: number;
  dimension_03: number;
  dimension_unit: 'CM' | 'IN';
  weight: number;
  weight_unit: 'KG' | 'LB';
  items: SkyPostalShipmentDataItems[];
  point_of_entry?: SkyPostalShipmentDataPointOfEntry;
}

export interface SkyPostalShipmentInfoRequest {
  copa_id: number;
  ssa_copa_id?: number;
  box_id?: any;
  merchant: SkyPostalShipmentMerchant;
  shipper: SkyPostalShipmentShipper;
  sender?: SkyPostalShipmentSender;
  consignee: SkyPostalShipmentConsignee;
  options: SkyPostalShipmentOptionsRequest;
  data: SkyPostalShipmentData;
}

export interface SkyPostalShipmentRequest {
  user_info: SkyPostalUserInfo;
  shipment_info: SkyPostalShipmentInfoRequest;
}

export interface SkyPostalShipmentDataLabelAdditionalData {
  default_label_reason: string;
  harmonization_code_validation_success: boolean;
  id_validation_success: boolean;
  zipcode_validation_success: boolean;
}

export interface SkyPostalShipmentDataLabelData {
  consignee: any;
  origin: any;
  destination: any;
  provider_service_type: any;
  provider_settings: any;
  additional_info: any;
  error: any;
}

export interface SkyPostalShipmentDataReturn {
  _verify: boolean;
  trck_nmr_fol: number;
  label_tracking_number_01: string;
  label_tracking_number_02: string;
  label_tracking_number_03: string;
  label_zpl: string;
  label_image: string;
  label_url: string;
  label_url_pdf: string;
  label_invoice_url: string;
  label_additional_data: SkyPostalShipmentDataLabelAdditionalData;
  label_data: SkyPostalShipmentDataLabelData;
  additional_info: any;
  error?: any;
}

export interface SkyPostalShipmentReturn {
  data: SkyPostalShipmentDataReturn[];
  additional_info: any;
  error?: any;
}

export interface SkyPostalShipmentCancelRequest {
  user_info: SkyPostalUserInfo;
  external_tracking: string;
  copa_id: number;
}

export interface SkyPostalShipmentCancelDataReturn {
  _verify: boolean;
  deleted_rows: number;
  additional_info: any;
  error?: any;
}

export interface SkyPostalShipmentCancelReturn {
  data: SkyPostalShipmentCancelDataReturn[];
  additional_info: any;
  error?: any;
}

export interface SkyPostalTrackingRequest {
  user_info: SkyPostalUserInfo;
  trck_nmr_fol: number;
  from_checkpoint?: string;
  language_iso_code?: string;
}

export interface SkyPostalTrackingRequestDataReturn {
  _verify: boolean;
  delivery_id: number;
  entry_date: string;
  entry_date_db: string;
  entry_date_db_str: string;
  entry_date_str: string;
  event_locality: string;
  iata_code: string;
  image_url_signature: string;
  order_label: string;
  time_zone: string;
  track_cdg: string;
  track_description: string;
  track_description_op: string;
  track_obs: string;
  track_type: string;
  track_type_description: string;
  trck_nmr_fol: number;
  additional_info?: any;
  error?: any;
}

export interface SkyPostalTrackingReturn {
  data: SkyPostalTrackingRequestDataReturn[];
  additional_info?: any;
  error?: any;
}

export interface SkypostalCSVOtherCountries {
  CTRY_ISO_CODE: string;
  STATE_CODE: string;
  STATE_NAME: string;
  CITY_CODE: string;
  CITY_NAME: string;
  ZIPCODE: string;
}

export interface SkypostalCSVUruguay {
  CTRY_ISO_CODE: string;
  COUNTRY_CODE: string;
  STATE_CODE: string;
  STATE_NAME: string;
  CITY_CODE: string;
  CITY_NAME: string;
  ZIPCODE: string;
}

export interface SkyPostalGetCityCodeReturn {
  _verify: boolean;
  additional_info: {
    internal: [any];
    server: {
      server_id: any;
      server_time: number;
    };
  };
  data: [
    {
      city_clean_name: string;
      city_code: number;
      city_iata_code: string;
      city_iso_code: string;
      city_name: string;
      country_code: number;
      country_iso_code: string;
      county_code: number;
      county_name: number;
      state_abreviation: string;
      state_code: number;
      state_name: string;
      zip_code: string;
    },
  ];
  error: {
    error_description: string;
    error_location: string;
    system_error: false;
  };
}
