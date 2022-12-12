export interface SENDLEQuoteRequestDomesticBody {
    orderType?: string,
    product_code?: string,
    first_mile_option?: string,
    pickup_address_line1?: string,
    pickup_address_line2?: string,
    pickup_suburb?: string,
    pickup_postcode?: string,
    pickup_country?: string,
    delivery_address_line1?: string,
    delivery_address_line2?: string,
    delivery_suburb?: string,
    delivery_postcode?: string,
    delivery_country?: string,
    weight_value?: string,
    weight_units?: string,
    volume_value?: string,
    volume_units?: string,
    length_value?: string,
    width_value?: string,
    height_value?: string,
    dimension_units?: string
}

export interface SENDLEQuoteRequestInternationalBody {
    orderType?: string,
    product_code?: string,
    pickup_address_line1?: string,
    pickup_address_line2?: string,
    pickup_suburb?: string,
    pickup_postcode?: string,
    delivery_address_line1?: string,
    delivery_address_line2?: string,
    delivery_suburb?: string,
    delivery_postcode?: string,
    delivery_country?: string,
    weight_value?: string,
    weight_units?: string,
    volume_value?: string,
    volume_units?: string,
    length_value?: string,
    width_value?: string,
    height_value?: string,
    dimension_units?: string
}

export interface SENDLEDomesticORInternationalObject {
    sender_address_line1?: string,
    sender_address_line2?: string,
    sender_suburb?: string,
    sender_postcode?: string,
    sender_country?: string,
    receiver_address_line1?: string,
    receiver_address_line2?: string,
    receiver_suburb?: string,
    receiver_postcode?: string,
    receiver_country?: string,
    weight_value?: string,
    weight_units?: string,
    volume_value?: string,
    volume_units?: string,
    length_value?: string,
    width_value?: string,
    height_value?: string,
    dimension_units?: string
}

export type SENDLERateRequestProductsReturn = {
    quote: {
        gross?: NewSENDLEPriceDTO,
        net?: NewSENDLEPriceDTO,
        tax?: NewSENDLEPriceDTO,
    },
    plan?: string,
    eta?: {
        days_range?: number,
        date_range?:  number,
        for_send_date?: Date
    },
    route?: {
        type?: string,
        descrition?: string,
    },
    allowed_packaging?: string,
    product?: {
        code?: string,
        name?: string,
        first_mile_option: string,
        service: string
    },
    price_breakdown ?: {
        base?: NewSENDLEPriceDTO,
        base_tax?: NewSENDLEPriceDTO,
        cover?: NewSENDLEPriceDTO,
        cover_tax?: NewSENDLEPriceDTO,
        discount?: NewSENDLEPriceDTO,
        discount_tax?: NewSENDLEPriceDTO,
        fuel_surcharge?: NewSENDLEPriceDTO,
        fuel_surcharge_tax?: NewSENDLEPriceDTO,
    },
    tax_breakdown?: string,
}

export type NewSENDLEPriceDTO = {
    amount?: Number,
    currency?: string,
}