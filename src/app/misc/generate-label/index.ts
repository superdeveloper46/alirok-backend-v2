import { HttpService } from '@nestjs/axios';
import { format } from 'date-fns';
import { lastValueFrom } from 'rxjs';
import * as QRCode from 'qrcode';

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

export const createAlirokLabel = async (
  booking: any,
  tracking: string,
  http: HttpService,
) => {
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

  const { sender, recipient } = await getParcelMembers(
    booking.parcel_member_parcel_bookings,
  );

  const shipmentDate = format(
    new Date(booking.quote.shipDate.data.date),
    'MMM dd, yyyy',
  );

  const allItems = booking.quote.whatsInside.data.map((item) => {
    return {
      type: item.type,
      dimensions: item.dimensions,
      pieces: item.pieces,
      weight: item.weight,
    };
  });

  const unitWeight = booking.quote.whatsInside.data[0].weight.unit;

  const labelData = {
    carrier: {
      logo: booking.metadata?.company?.logo_url || '',
    },
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
    quote: {
      items: allItems,
      shipment_date: shipmentDate,
      unit_weight: unitWeight,
    },
    tracking_code: tracking,
  };

  const qrCodeSource = '';

  /*   try {
    const qrCodeURL = `https://dev.alirok.com/driver-scan-flow/${booking.parcel_booking_uuid}`;

    qrCodeSource = await QRCode.toDataURL(qrCodeURL, {
      errorCorrectionLevel: 'high',
      type: 'image/png',
      rendererOpts: {
        quality: 1,
      },
    });
  } catch (error) {
    console.log('error', error.message);
  } */

  const htmlArray = labelData.quote.items.map((item, index) => {
    return `<!DOCTYPE html>
    <html
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      width="100%"
      height="100%"
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
          .footer {
            display: none;
          }
    
          .footer-label {
            position: relative;
            height: 30px;
            width: 100%;
          }
    
          .page-label {
            position: absolute;
            font-size: 14px;
            left: 0px;
            top: 20px;
          }
    
          .img-footer-label {
            position: absolute;
            right: 0px;
            font-weight: bold;
            font-size: 12px;
          }
    
          body {
            font-family: 'montserrat';
            font-size: 12px;
          }
    
          .no-wrap {
            white-space: nowrap;
          }
    
          img {
            max-width: 120px;
          }
    
          tr {
            page-break-inside: avoid !important;
          }
    
          span {
            font-size: 12px;
          }
    
          .card {
            border: 1px solid #d2d2d2;
            border-radius: 50px;
            width: 400px;
            height: 570px;
            font-size: 12px;
            padding: 30px;
          }
    
          .label-info {
            border-spacing: 0px !important;
            border-collapse: collapse !important;
          }
    
          .label-info td {
            height: 30px;
            font-size: 12px;
          }
    
          .label-info-title {
            text-align: right;
            padding-right: 10px;
          }
    
          .total-label-title {
            text-align: right;
            padding-right: 40px;
            height: 30px;
          }
    
          .label-result {
            padding-left: 10px;
          }
    
          .divider {
            border-left: 1px solid #d2d2d2;
          }
    
          .left {
            text-align: left;
          }
    
          .right {
            text-align: right;
          }
    
          .shipper {
            height: fit-content;
          }
    
          .shipper span {
            height: 25px;
          }
    
          .consignee {
            height: fit-content;
            margin-top: 10px;
          }
    
          .consignee span {
            height: 25px;
          }
    
          .label-details {
            display: grid;
            justify-content: right;
          }
    
          .bottom-info {
            display: grid;
            grid-template-columns: 65% 1fr;
            gap: 20px;
          }
    
          .tracking-code {
            font-weight: bold;
          }
        </style>
      </head>
    
      <body width="100%" height="100%">
        <table>
          <tbody>
            <tr>
              <td class="card" style="vertical-align: top">
                <table>
                  <tr>
                    <td height="540px" style="vertical-align: top">
                      <div style="padding-bottom: 15px">
                        <table>
                          <tbody>
                            <tr>
                              <td width="40%" style="padding-right: 30px">
                                <img
                                  src="${labelData.carrier.logo}"
                                  alt="carrier logo"
                                />
                              </td>
                              <td class="label-details">
                                <table class="label-info">
                                  <tbody>
                                    <tr>
                                      <td class="label-info-title">
                                        <strong class="right no-wrap">
                                          Shipment date
                                        </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="label-result">
                                        <span class="left">
                                          ${labelData.quote.shipment_date}
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="label-info-title">
                                        <strong class="right no-wrap">
                                          Gross weight
                                        </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="label-result">
                                        <span class="left">
                                          ${item.weight.value} ${
      labelData.quote.unit_weight
    }
                                        </span>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td class="label-info-title">
                                        <strong class="right"> Dimensions </strong>
                                      </td>
                                      <td class="divider"></td>
                                      <td class="label-result">
                                        <span class="left">
                                          ${item.dimensions.length} x ${
      item.dimensions.width
    } x
                                          ${item.dimensions.height}
                                          ${item.dimensions.unit}
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <table class="shipper">
                          <tbody>
                            <tr>
                              <td>
                                <span style="font-weight: bold">Pick up address</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span>${labelData.shipper.complete_name}</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span>${labelData.shipper.tax_id}</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span style="font-weight: bold">
                                  ${labelData.shipper.formatted_address}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span>
                                  ${labelData.shipper.phone}| ${
      labelData.shipper.email
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
                                <span style="font-weight: bold">Delivery address</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span>${
                                  labelData.consignee.complete_name
                                }</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span>${labelData.consignee.tax_id}</span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span style="font-weight: bold">
                                  ${labelData.consignee.formatted_address}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td>
                                <span>
                                  ${labelData.consignee.phone} | ${
      labelData.consignee.email
    }
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <table style="margin-top: 30px">
                        <tbody>
                          <tr>
                            <td class="bottom-info">
                              <div class="tracking-code">
                                TRACKING # ${labelData.tracking_code}
                              </div>
                              <div class="barcode"></div>
                            </td>
                            <td>
                              <div width="35%" class="qr-code"><img src="${qrCodeSource}" alt="qr-code></div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td height="30px">
                      <table class="footer-label">
                        <tbody>
                          <tr>
                            <td class="page-label">
                              Piece ${index + 1} of ${
      labelData.quote.items.length
    }
                            </td>
                            <td>
                              <table class="img-footer-label">
                                <tbody>
                                  <tr>
                                    <td>
                                      <div>Powered by</div>
                                    </td>
                                    <td>
                                      <img
                                        width="100px"
                                        height="auto"
                                        src="https://static.alirok.io/collections/logos/logo-com.svg"
                                      />
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
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
    `;
  });

  let html = '';
  html = html.concat(...htmlArray);

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
