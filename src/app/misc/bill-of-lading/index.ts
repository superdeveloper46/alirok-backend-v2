import { format } from 'date-fns';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface CheckoutParcelMember {
  parcel_member_uuid: string;
  is_residential_address: boolean;
  phone: { countryCode: string; number: string };
  firstName: string;
  lastName: string;
  full_name: string;
  first_name: string;
  last_name: string;
  company_name: string;
  tax_id: string;
  email: string;
  location_uuid: string;
  subject_role_type_uuid: string;
  user_uuid: any;
  company_uuid: any;
  subject_role_types: {
    subject_role_type_uuid: string;
    name: string;
  };
  locations: {
    location_uuid: string;
    street_number: string;
    complement: string;
    postal_code_uuid: string;
    location_administrative_divisions: [any];
  };
}

const getParcelMembers = async (bookingMembers) => {
  let sender: CheckoutParcelMember;
  let recipient: CheckoutParcelMember;

  bookingMembers.map((bookingMember) => {
    if (bookingMember.parcel_members.subject_role_types.name === 'Sender') {
      sender = {
        ...bookingMember.parcel_members,
      };
    } else if (
      bookingMember.parcel_members.subject_role_types.name === 'Recipient'
    ) {
      recipient = {
        ...bookingMember.parcel_members,
      };
    }
  });

  return { sender, recipient };
};

export const generateBL = async (
  booking: any,
  tracking: string,
  http: HttpService,
) => {
  const { sender, recipient } = await getParcelMembers(
    booking.parcel_member_parcel_bookings,
  );

  const allItems = booking.quote.whatsInside.data.map((item) => {
    return {
      type: item.type,
      dimensions: item.dimensions,
      pieces: item.pieces,
      weight: item.weight,
    };
  });

  const shipmentDate = format(
    new Date(booking.quote.shipDate.data.date),
    'MMM dd, yyyy',
  );

  const totalPieces: number = booking.quote.whatsInside.data
    .map((i) => ({
      amount: i.pieces,
    }))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalWeight: number = booking.quote.whatsInside.data
    .map((i) => {
      return { weight: i.weight.value * i.pieces };
    })
    .reduce((acc, curr) => acc + curr.weight, 0);

  const unitWeight = booking.quote.whatsInside.data[0].weight.unit;

  const unitMeasure =
    booking.quote.whatsInside.data[0].dimensions.unit === 'in'
      ? 'inches'
      : 'centimeters';

  const getInsurance = () => {
    booking.metadata?.services?.map((service) => {
      if (
        service.name === 'Insurance' &&
        (service.selected || service.required)
      ) {
        return 'Insured';
      }
    });
    return 'Not Insured';
  };

  const roundAmount = (number: number): number => {
    const rounded: number = Math.round((number + Number.EPSILON) * 100) / 100;
    return rounded.toFixed(2) as unknown as number;
  };

  const getWhereFromAddress = () => {
    let address;
    if (!booking.quote.whereFrom.data.formattedAddress) {
      address = `${booking.quote.whereFrom.data.street} - ${booking.quote.whereFrom.data.city} - ${booking.quote.whereFrom.data.state} - ${booking.quote.whereFrom.data.zipCode}, ${booking.quote.whereFrom.data.country}`;
    } else {
      address = booking.quote.whereFrom.data.formattedAddress;
    }
    return address;
  };

  const getWhereToAddress = () => {
    let address;
    if (!booking.quote.whereTo.data.formattedAddress) {
      address = `${booking.quote.whereTo.data.street} - ${booking.quote.whereTo.data.city} - ${booking.quote.whereTo.data.state} - ${booking.quote.whereTo.data.zipCode}, ${booking.quote.whereTo.data.country}`;
    } else {
      address = booking.quote.whereTo.data.formattedAddress;
    }
    return address;
  };

  const fullBooking = {
    shipper: {
      company_name: sender.company_name,
      complete_name: sender.full_name,
      tax_id: sender.tax_id,
      formatted_address: getWhereFromAddress(),
      phone: sender.phone.number,
      email: sender.email,
    },
    consignee: {
      company_name: recipient.company_name,
      complete_name: recipient.full_name,
      tax_id: recipient.tax_id,
      formatted_address: getWhereToAddress(),
      phone: recipient.phone.number,
      email: recipient.email,
    },
    ship_date: {
      date: shipmentDate,
    },
    quote: {
      pieces: totalPieces,
      total_weight: totalWeight,
      unit_weight: unitWeight,
      total_chargeable: 0,
      unit_measure_name: unitMeasure,
      unit_measure: booking.quote.whatsInside.data[0].dimensions.unit,
      currency: 'USD',
      items: allItems,
      cargo_value: booking.quote.description.price.value,
      country_origin: booking.quote.whereFrom.data.country,
      description: booking.quote.description.category,
    },
    services: {
      insurance: getInsurance(),
    },
    tracking_code: tracking,
    carrier: booking.metadata?.company?.name ?? '',
  };

  const convertKgsToLbs = (weight: string | number): number => {
    return Math.round(Number(weight) * 2.204 * 100) / 100;
  };

  const round = (weight: string | number): number => {
    return Math.round(Number(weight) * 100) / 100;
  };

  const getChargeableWeight = (item) => {
    let total = 0;

    if (
      fullBooking.quote.unit_weight == 'lb' &&
      fullBooking.quote.unit_measure == 'in'
    ) {
      total = (item.width * item.height * item.length) / 166;
      return round(total);
    } else if (
      fullBooking.quote.unit_weight == 'kg' &&
      fullBooking.quote.unit_measure == 'cm'
    ) {
      total = (item.width * item.height * item.length) / 6000;
      return round(total);
    } else if (
      fullBooking.quote.unit_weight == 'kg' &&
      fullBooking.quote.unit_measure == 'in'
    ) {
      total = (item.width * item.height * item.length) / 366;
      return round(total);
    } else {
      const convert = (item.width * item.height * item.length) / 6000;
      total = convertKgsToLbs(convert);
      return total;
    }
  };

  const getCompanyName = (name: string | undefined) => {
    if (name) {
      return `<tr>
      <td>
          <span>${name}</span>
      </td>
  </tr>`;
    } else return '';
  };

  const getDescription = (type: string) => {
    const CARGO_TYPE_OPTIONS = [
      { label: 'Plastic Pallet', value: 'plasticPallet' },
      { label: 'Wooden Pallet', value: 'woodenPallet' },
      { label: 'Loose Carton', value: 'looseCarton' },
      { label: 'Wooden crate', value: 'woodenCrate' },
      { label: 'Metal crate', value: 'metalCrate' },
      { label: 'Bags', value: 'bags' },
    ];

    const option = CARGO_TYPE_OPTIONS.find((item) => item.value == type);

    return option?.label || '';
  };

  const getItems = () => {
    let totalChargeable = 0;

    const line = fullBooking.quote.items?.map((i) => {
      const chargeable = getChargeableWeight(i.dimensions);
      totalChargeable = totalChargeable + chargeable;

      const type = getDescription(i.type);

      return `
          <tr>
              <td class="item-space">${type} - ${i.dimensions.length} x ${i.dimensions.width} x ${i.dimensions.height} ${fullBooking.quote.unit_measure_name}
              </td>
              <td class="item-space">${i.pieces}</td>
              <td class="item-space">${i.weight.value} ${i.weight.unit}</td>
              <td class="item-space">${chargeable} ${i.weight.unit}</td>
          </tr>
            `;
    });

    fullBooking.quote.total_chargeable = totalChargeable;

    return line;
  };

  const create64 = async (html) => {
    const resp = await lastValueFrom(
      http.post(
        'https://at04adu47g.execute-api.us-east-1.amazonaws.com/html-to-pdf',
        {
          html,
        },
      ),
    );

    return resp.data.data;
  };

  try {
    const html = `<!DOCTYPE html>
    <html
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
    >
      <head>
        <title></title>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <style type="text/css"></style>
        <style type="text/css">
          body {
            font-family: 'montserrat';
          }
    
          tr {
            page-break-inside: avoid !important;
          }
    
          .item-space {
            padding: 8px;
          }
    
          .card {
            font-size: 12px;
            width: 700px;
            position: relative;
            overflow: hidden;
            color: #1e1e1e;
            padding: 0px;
          }
    
          .alirok-logo {
            width: 100px;
            height: auto;
          }
    
          .title {
            text-align: center;
          }
    
          h3 {
            margin-block-end: 0px;
            margin-block-start: 0px;
          }
    
          .shipper {
            width: 100%;
            padding-bottom: 20px;
            height: fit-content;
          }
    
          .shipper span {
            height: 25px;
          }
    
          .consignee {
            width: 100%;
            padding-bottom: 20px;
            height: fit-content;
          }
    
          .consignee span {
            height: 25px;
          }
    
          th {
            text-align: left;
          }
    
          .header-line {
            border-bottom: 1px solid #1e1e1e;
            font-weight: bold;
          }
    
          .bold {
            font-weight: bold;
          }
    
          .left {
            text-align: left;
          }
    
          .right {
            text-align: right;
          }
    
          .center {
            text-align: center;
          }
    
          .logo-container {
            position: absolute;
            bottom: 20px;
            right: 20px;
            height: auto;
            font-weight: bold;
          }
    
          .divider {
            border-left: 1px solid #d2d2d2;
          }
    
          .no-wrap {
            white-space: nowrap;
          }
    
          strong {
            width: 100%;
          }
    
          .horizontal-divider {
            border-bottom: 1px solid #838383;
          }
    
          table {
            border-spacing: 0px !important;
          }
    
          .bl-info {
            width: 100%;
            border-spacing: 0px !important;
            border-collapse: collapse !important;
          }
    
          .bl-info td {
            height: 30px;
          }
    
          .bl-info-title {
            text-align: right;
            padding-right: 10px;
          }
    
          .bl-result {
            padding-left: 10px;
          }
    
          .line {
            border-bottom: 1px solid #020202;
            width: 100%;
            margin-bottom: 5px;
          }
    
          .dates {
            display: grid;
            grid-template-columns: 1fr 30%;
            gap: 15px;
          }
    
          .instructions-info {
            margin-top: 20px;
            margin-bottom: 30px;
          }
    
          .grid {
            display: grid;
            gap: 15px;
          }
    
          .date-wrapper {
            display: flex;
            width: 100%;
            padding-top: 5px;
          }
    
          .divisor-date {
            border-right: 1px solid #000;
            transform: rotate(30deg);
            transform-origin: bottom right;
          }
    
          .height-adjust {
            border-bottom: 1px solid #020202;
            opacity: 0.5;
            height: 15px;
            margin-bottom: 5px;
          }
    
          .total_weight {
            font-weight: bold;
            text-align: right;
          }
    
          .bold {
            font-weight: bold;
          }
    
          .qrcode {
            width: 100%;
          }
    
          .horizontal-divider-2 {
            border-bottom: 1px solid #eaeaea;
          }
    
          .td-date {
            height: 30px;
            padding-left: 10px;
          }
    
          .space-inside {
            height: 50px;
          }
        </style>
      </head>
      <body>
        <table>
          <tbody>
            <tr>
              <td class="card">
                <span class="title">
                  <h1>FREIGHT BILL OF LADING</h1>
                </span>
                <table width="100%">
                  <tbody>
                    <tr>
                      <td width="100%" style="padding-bottom: 10px">
                        <table width="100%">
                          <tbody>
                            <tr>
                              <td
                                width="70%"
                                style="min-width: 70%; padding-right: 20px"
                              >
                                <table class="shipper">
                                  <tbody>
                                    <tr>
                                      <td>
                                        <span style="font-weight: bold"
                                          >Pick up address</span
                                        >
                                      </td>
                                    </tr>
                                    ${getCompanyName(
                                      fullBooking.shipper.company_name,
                                    )}
                                    <tr>
                                      <td>
                                        <span
                                          >${
                                            fullBooking.shipper.complete_name
                                          }</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span>${
                                          fullBooking.shipper.tax_id
                                        }</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span
                                          >${
                                            fullBooking.shipper
                                              .formatted_address
                                          }</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span>
                                          ${fullBooking.shipper.phone} | ${
      fullBooking.shipper.email
    }
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span> open hours: </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                                <table class="consignee">
                                  <tbody>
                                    <tr>
                                      <td>
                                        <span style="font-weight: bold"
                                          >Delivery address</span
                                        >
                                      </td>
                                    </tr>
                                    ${getCompanyName(
                                      fullBooking.consignee.company_name,
                                    )}
                                    <tr>
                                      <td>
                                        <span
                                          >${
                                            fullBooking.consignee.complete_name
                                          }</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span>${
                                          fullBooking.consignee.tax_id
                                        }</span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span
                                          >${
                                            fullBooking.consignee
                                              .formatted_address
                                          }</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span>
                                          ${fullBooking.consignee.phone} | ${
      fullBooking.consignee.email
    }
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <span> open hours: </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td width="30%" align="right" style="vertical-align: top">
                                <table class="bl-info">
                                  <tbody>
                                    <tr>
                                      <td class="bl-info-title">
                                        <strong class="right no-wrap">
                                          Tracking No.
                                        </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="bl-result">
                                        <span class="left"
                                          >${fullBooking.tracking_code}</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="bl-info-title">
                                        <strong class="right no-wrap">
                                          Shipment date
                                        </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="bl-result">
                                        <span class="left"
                                          >${fullBooking.ship_date.date}</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="bl-info-title">
                                        <strong class="right"> Description </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="bl-result">
                                        <span class="left"
                                          >${
                                            fullBooking.quote.description
                                          }</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="bl-info-title">
                                        <strong class="right"> Insurance </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="bl-result">
                                        <span class="left"
                                          >${
                                            fullBooking.services.insurance
                                          }</span
                                        >
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="bl-info-title">
                                        <strong class="right no-wrap">
                                          Cargo value
                                        </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="bl-result">
                                        <span class="left"
                                          >${
                                            fullBooking.quote.currency
                                          } ${roundAmount(
      fullBooking.quote.cargo_value,
    )}</span
                                        >
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td width="100%">
                        <table width="100%">
                          <tbody width="100%">
                            <tr class="header-line" width="100%">
                              <th width="50%">Package type - Length x Width x Height</th>
                              <th width="10%">Qty</th>
                              <th width="20%">Gross weight</th>
                              <th width="20%">Volume weight</th>
                            </tr>
                            <tr>
                              <td class="horizontal-divider"></td>
                              <td class="horizontal-divider"></td>
                              <td class="horizontal-divider"></td>
                              <td class="horizontal-divider"></td>
                            </tr>
                            ${getItems()}
                            <tr>
                              <td class="horizontal-divider-2"></td>
                              <td class="horizontal-divider-2"></td>
                              <td class="horizontal-divider-2"></td>
                              <td class="horizontal-divider-2"></td>
                            </tr>
                            <tr>
                              <td class="item-space total_weight">Total</td>
                              <td class="item-space bold">
                                ${fullBooking.quote.pieces}
                              </td>
                              <td class="item-space bold">
                                ${fullBooking.quote.total_weight} ${
      fullBooking.quote.unit_weight
    }
                              </td>
                              <td class="item-space bold">
                                ${fullBooking.quote.total_chargeable}
                                ${fullBooking.quote.unit_weight}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 25px">
                        <div>
                          <div style="font-weight: bold">Instructions</div>
                          <div>
                            ORIGINAL INVOICE & PACKING LIST MUST BE PICKED UP WITH THE
                            CARGO
                          </div>
                        </div>
                      </td>
                    </tr>
    
                    <tr>
                      <td style="padding-top: 15px; padding-bottom: 30px">
                        <table class="instructions-info">
                          <tbody>
                            <tr>
                              <td width="65%" style="min-width: 65%; padding-top:15px">
                                <table width="100%">
                                  <tbody>
                                    <tr>
                                      <td>
                                        <div class="height-adjust"></div>
                                        <div><b>Driver's Name:</b> Victor Bandeiras</div>
                                      </td>
                                      <td class="td-date">
                                        <div class="date-wrapper">
                                          ______/______/______
                                        </div>
                                        <div style="font-weight: bold; margin-top: 4px">
                                          Pick up date
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <div>
                                          <b>Carrier: </b> ${
                                            fullBooking.carrier
                                          }
                                        </div>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="space-inside"></td>
                                      <td class="space-inside"></td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <div class="height-adjust"></div>
                                        <div>
                                          <b>Received by:</b>
                                        </div>
                                      </td>
                                      <td class="td-date">
                                        <div class="date-wrapper">
                                          ______/______/______
                                        </div>
                                        <div style="font-weight: bold; margin-top: 2px">
                                          Delivery date
                                        </div>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td width="35%">
                                <div class="qrcode"></div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html> 
    `;

    const data: any = await create64(html);

    return data;
  } catch (error) {
    console.log(error);

    return error;
  }
};
