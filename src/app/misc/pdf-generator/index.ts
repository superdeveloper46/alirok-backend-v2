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

const roundAmount = (number: number): number => {
  const rounded: number = Math.round((number + Number.EPSILON) * 100) / 100;
  return rounded.toFixed(2) as unknown as number;
};

export const pdfInvoice = async (
  booking: any,
  tracking: string,
  http: HttpService,
) => {
  const { sender, recipient } = await getParcelMembers(
    booking.parcel_member_parcel_bookings,
  );

  const currentDate = format(new Date(), 'yyyy-MMM-dd');

  const itemsTypeAmount: number = booking.quote.whatsInside.data
    .map((i) => ({
      amount: i.pieces,
    }))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalWeight: number = booking.quote.whatsInside.data
    .map((i) => {
      return { weight: i.weight.value * i.pieces };
    })
    .reduce((acc, curr) => acc + curr.weight, 0);

  const allItems = booking.quote.whatsInside.data.map((parcelPackage) => {
    const items = parcelPackage.items.map((item) => {
      return {
        description: item.description,
        hts_code: item.hts_code,
        quantity: item.quantity,
        price: item.price,
      };
    });
    return items;
  });

  const getCargoValue = () => {
    let cargoValue = 0;
    booking.quote.whatsInside.data.map((parcelPackage) => {
      parcelPackage.items.map((item) => {
        cargoValue += item.price?.value;
      });
    });

    return cargoValue;
  };

  const getInsurance = () => {
    let serviceValue = 0;
    booking.metadata?.services?.map((service) => {
      if (service.name === 'Insurance') {
        service?.items?.map((item) => {
          if (item?.price?.value) {
            serviceValue += item?.price?.value;
          }
        });
      }
    });
    return serviceValue;
  };

  const getDuties = () => {
    let serviceValue = 0;
    booking.metadata?.services?.map((service) => {
      if (service.name === 'Duties & Taxes' && service.selected) {
        service?.items?.map((item) => {
          if (item?.price?.value) {
            serviceValue += item?.price?.value;
          }
        });
      }
    });

    return serviceValue;
  };

  const getFreight = () => {
    let serviceValue = 0;
    booking.metadata?.services?.map((service) => {
      if (service.name === 'Parcel Freight') {
        service?.items?.map((item) => {
          if (item?.price?.value) {
            serviceValue += item?.price?.value;
          }
        });
      }
    });
    return serviceValue;
  };

  const getIncoterm = () => {
    let incoterm = 'DDU';
    booking.metadata?.services?.map((service) => {
      if (service.name === 'Duties & Taxes' && service.selected) {
        incoterm = 'DDP';
      }
    });

    return incoterm;
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

  const getCompanyName = (name: string | undefined) => {
    if (name) {
      return `<tr>
      <td>
          <span>${name}</span>
      </td>
  </tr>`;
    } else return '';
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
    invoice: {
      invoice_date: currentDate,
      invoice_number: booking.parcel_serial_number,
      incoterm: getIncoterm(),
    },
    quote: {
      packages: itemsTypeAmount,
      total_weight: totalWeight,
      unit_weight: 'kg',
      currency: 'USD',
      reason: booking.quote.whatsInside?.data[0]?.purpose,
      items: allItems,
      cargo_value: getCargoValue(),
      country_origin: booking.quote.whereFrom.data.country,
    },
    services: {
      freight: getFreight(),
      insurance: getInsurance(),
      duties: getDuties(),
    },
    tracking_code: tracking,
  };

  const getTotalServices = () => {
    const total =
      fullBooking.quote.cargo_value +
      fullBooking.services.freight +
      fullBooking.services.insurance +
      fullBooking.services.duties;
    return total;
  };

  const getItems = () => {
    const line = fullBooking.quote.items.map((item) => {
      const itemLine = item.map((i) => {
        return `
          <tr>
              <td class="item-space">${i.description} - ${i.hts_code} - ${
          fullBooking.quote.country_origin
        }
              </td>
              <td class="item-space">${i.quantity}</td>
              <td class="item-space">$ ${roundAmount(
                i.price?.value / i.quantity,
              )}</td>
              <td class="item-space">$ ${roundAmount(i.price?.value)}</td>
          </tr>
            `;
      });
      return itemLine;
    });

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
    const html = `
    <!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap" rel="stylesheet">
    <style type="text/css">
    </style>
    <style type="text/css">
        body{
            font-family: 'montserrat';
        }

        tr {
          page-break-inside: avoid !important;
        }

        .item-space {
          padding: 8px;
        }

        .card {
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: 20px;
            font-size: 12px;
            width: 640px;
            position: relative;
            overflow: hidden;
            color: #1e1e1e;
            padding: 0px 20px;
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

        .content-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            height: fit-content;
        }

        .shipper {
            display: grid;
            grid-template-columns: 1fr;
            height: fit-content;
        }

        .shipper span {
            height: 25px;
        }

        .consignee {
            display: grid;
            grid-template-columns: 1fr;
            height: fit-content;
            margin-top:10px;
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

        .freight-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            min-height: 160px;
        }

        .bold {
            font-weight: bold;
        }

        .details-divide {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .details-divide span {
            padding: 5px 0px;
            height: 20px;
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

        .footer-details {
          height:80px;
          position: relative;
        }

        .total-values {
            height: 30px;
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

        .horizontal-divider-2 {
          border-bottom: 1px solid #eaeaea;
        }
        
        .invoice-info {
            border-spacing: 0px !important;
            border-collapsed: collapsed !important;
        }

        .invoice-info td {
            height: 30px;
        }

        .invoice-info-title {
            text-align: right;
            padding-right: 10px;
        }

        .total-invoice-title {
            text-align: right;
            padding-right: 40px;
            height: 30px;
        }

        .invoice-result {
            padding-left: 10px;
        }
    </style>
</head>
<body>
    <table>
        <tbody>
            <tr>
                <td class="card">
                    <span class="title">
                        <h3>COMMERCIAL INVOICE</h3>
                    </span>
                    <table width='100%'>
                        <tbody>
                            <tr>
                                <td width='100%' style="padding-bottom: 10px">
                                    <table width='100%' >
                                        <tbody>
                                            <tr>
                                                <td style="min-width: 65%; padding-right:20px">
                                                    <table class="shipper">
                                                        <tbody >
                                                            <tr>
                                                                <td>
                                                                    <span style="font-weight: bold">Shipper</span>
                                                                </td>
                                                            </tr>
                                                            ${getCompanyName(
                                                              fullBooking
                                                                .shipper
                                                                .company_name,
                                                            )}
                                                            <tr>
                                                                <td>
                                                                    <span>${
                                                                      fullBooking
                                                                        .shipper
                                                                        .complete_name
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <span>${
                                                                      fullBooking
                                                                        .shipper
                                                                        .tax_id
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <span>${
                                                                      fullBooking
                                                                        .shipper
                                                                        .formatted_address
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <span>
                                                                        ${
                                                                          fullBooking
                                                                            .shipper
                                                                            .phone
                                                                        } |
                                                                        ${
                                                                          fullBooking
                                                                            .shipper
                                                                            .email
                                                                        }
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table class="consignee">
                                                        <tbody>
                                                            <tr>
                                                                <td>
                                                                    <span style="font-weight: bold">Consignee</span>
                                                                </td>
                                                            </tr>
                                                            ${getCompanyName(
                                                              fullBooking
                                                                .consignee
                                                                .company_name,
                                                            )}
                                                            <tr>
                                                                <td>
                                                                    <span>${
                                                                      fullBooking
                                                                        .consignee
                                                                        .complete_name
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <span>${
                                                                      fullBooking
                                                                        .consignee
                                                                        .tax_id
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <span>${
                                                                      fullBooking
                                                                        .consignee
                                                                        .formatted_address
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td>
                                                                    <span>
                                                                        ${
                                                                          fullBooking
                                                                            .consignee
                                                                            .phone
                                                                        } |
                                                                        ${
                                                                          fullBooking
                                                                            .consignee
                                                                            .email
                                                                        }
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                                <td style="vertical-align: top;">
                                                    <table class="invoice-info">
                                                        <tbody>
                                                            <tr>
                                                                <td class="invoice-info-title">
                                                                    <strong class="right no-wrap">
                                                                        Invoice No.
                                                                    </strong>
                                                                </td>
                                                                <td class="divider">
                                                                </td>
                                                                <td class="invoice-result">
                                                                    <span class="left">${
                                                                      fullBooking
                                                                        .invoice
                                                                        .invoice_number
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="invoice-info-title">
                                                                    <strong class="right no-wrap">
                                                                        Invoice date
                                                                    </strong>
                                                                </td>
                                                                <td class="divider">
                                                            
                                                                </td>
                                                                <td class="invoice-result">
                                                                    <span class="left">${
                                                                      fullBooking
                                                                        .invoice
                                                                        .invoice_date
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="invoice-info-title">
                                                                    <strong class="right">
                                                                        Currency
                                                                    </strong>
                                                                </td>
                                                                <td class="divider">
                                                                
                                                                </td>
                                                                <td class="invoice-result">
                                                                    <span class="left">${
                                                                      fullBooking
                                                                        .quote
                                                                        .currency
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="invoice-info-title">
                                                                    <strong class="right">
                                                                        Incoterm
                                                                    </strong>
                                                                </td>
                                                                <td class="divider">
                                                                </td>
                                                                <td class="invoice-result">
                                                                    <span class="left">${
                                                                      fullBooking
                                                                        .invoice
                                                                        .incoterm
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td class="invoice-info-title">
                                                                    <strong class="right no-wrap">
                                                                        Export reason
                                                                    </strong>
                                                                </td>
                                                                <td class="divider">
                                                                  
                                                                </td>
                                                                <td class="invoice-result">
                                                                    <span class="left">${
                                                                      fullBooking
                                                                        .quote
                                                                        .reason
                                                                    }</span>
                                                                </td>
                                                            </tr>
                                                        <tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td width='100%'>
                                    <table width='100%' style="border-spacing: 0px">
                                        <tbody width='100%'>
                                            <tr class="header-line" width='100%'>
                                                <th width='50%'>Description - HS Code - Country of Origin</th>
                                                <th>Qty</th>
                                                <th>Unit price</th>
                                                <th>Amount</th>
                                            </tr>
                                            <tr>
                                                <td class="horizontal-divider">
                                                </td>
                                                <td class="horizontal-divider">
                                                </td>
                                                <td class="horizontal-divider">
                                                </td>
                                                <td class="horizontal-divider">
                                                </td>
                                            </tr>
                                            ${getItems()}
                                            <tr>
                                                <td class="horizontal-divider-2">
                                                </td>
                                                <td class="horizontal-divider-2">
                                                </td>
                                                <td class="horizontal-divider-2">
                                                </td>
                                                <td class="horizontal-divider-2">
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <table width='100%'>
                                        <tbody>
                                            <tr>
                                                <td style="align-self: center; width: 50%;">
                                                    <div class="total-values">
                                                        <span class="bold">Total packages: </span>
                                                        <span>${
                                                          fullBooking.quote
                                                            .packages
                                                        } packages </span>
                                                    </div>
                                                    <div class="total-values">
                                                        <span class="bold">Total weight: </span>
                                                        <span>
                                                            ${
                                                              fullBooking.quote
                                                                .total_weight
                                                            }
                                                            ${
                                                              fullBooking.quote
                                                                .unit_weight
                                                            }s
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style="width: fit-content">
                                                    <table width='100%' style="border-spacing: 0px">
                                                        <tbody>
                                                        <tr class="details-divide">
                                                            <td class="total-invoice-title">
                                                            <span class="bold right">Cargo value </span>
                                                            </td>
                                                            <td>
                                                            <span class="bold center">$ ${roundAmount(
                                                              fullBooking.quote
                                                                .cargo_value,
                                                            )} </span>
                                                            </td>
                                                        </tr>
                                                        <tr class="details-divide">
                                                            <td class="total-invoice-title">
                                                                <span class="right">International freight </span>
                                                            </td>
                                                            <td>
                                                            <span class="center">$ ${roundAmount(
                                                              fullBooking
                                                                .services
                                                                .freight,
                                                            )} </span>
                                                            </td>
                                                        </tr>
                                                        <tr class="details-divide">
                                                            <td class="total-invoice-title">
                                                                <span class="right">Insurance </span>
                                                            </td>
                                                            <td>
                                                            <span class="center">$ ${roundAmount(
                                                              fullBooking
                                                                .services
                                                                .insurance,
                                                            )} </span>
                                                            </td>
                                                        </tr>
                                                        <tr class="details-divide">
                                                            <td class="total-invoice-title">
                                                                <span class="right">Duties</span>
                                                            </td>
                                                            <td>
                                                                <span class="center">$ ${roundAmount(
                                                                  fullBooking
                                                                    .services
                                                                    .duties,
                                                                )}</span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td class="horizontal-divider-2">
                                                            </td>
                                                            <td class="horizontal-divider-2">
                                                            </td>
                                                        </tr>
                                                        <tr class="details-divide">
                                                            <td class="total-invoice-title">
                                                            <strong class="right">Total </strong>
                                                            </td>
                                                            <td>
                                                            <strong class="center">USD ${roundAmount(
                                                              getTotalServices(),
                                                            )} </strong>
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
                    <table>
                        <tbody>
                        <tr>
                            <td class="bold">
                                TRACKING#: ${fullBooking.tracking_code}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
    <div style="display: none;">
      <img src="https://static.alirok.io/collections/logos/logo-com.svg" />
    </div>
</body>
</html>`;

    const data: any = await create64(html);

    return data;
  } catch (error) {
    return error;
  }
};
