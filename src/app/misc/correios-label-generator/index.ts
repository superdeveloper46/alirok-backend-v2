import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface ICorreiosLabelData {
  screeningCenter: string;
  order: string;
  service: string;
  trackingCode: string;
  serviceType: string;
  contractNumber: string;
  recipientName: string;
  recipientStreet: string;
  recipientStreetNumber: string;
  recipientAdditionalAddress: string;
  recipientCity: string;
  recipientState: string;
  recipientPostalCode: string;
  senderName: string;
  senderCountry: string;
  senderStreet: string;
  senderStreetNumber: string;
  senderAdditionalAddress: string;
  senderCity: string;
  senderState: string;
  senderPostalCode: string;
  insuranceCost: number;
  freightCost: number;
  items: {
    hsCode: string;
    quantity: string;
    description: string;
    weight: string;
    price: number;
  }[];
}

export const createCorreiosLabel = async (
  http: HttpService,
  data: ICorreiosLabelData,
) => {
  const html = `<!DOCTYPE html>
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
          table {
              width: 100%;
              border-spacing: 0px;
              font-size: 10px;
          }
  
          .barcode {
              padding-left: 10px;
              display: flex;
              justify-content: center;
              flex-direction: column;
              max-width: 300px;
  
          }
  
          .barcode img {
              max-width: 50px;
              max-height: 50px;
              width: auto;
              height: auto;
          }
  
          .logo {
              align-self: center;
          }
  
  
          .logo img {
              max-width: 75px;
              max-height: 75px;
              width: auto;
              height: auto;
          }
  
          body {
  
              font-size: 10px;
              width: fit-content;
              min-height: 80%;
              height: 570px;
              width: 380px;
              padding: 30px;
              align-items: center;
              justify-content: center;
              position: relative;
              border: 1px solid #000;
              padding: 10px;
              font-family: Arial, Helvetica, sans-serif;
              font-weight: normal;
          }
  
          .first-line {
              display: grid;
              grid-template-columns: 75px 75px auto 75px;
              gap: 35px;
              margin-bottom: 10px;
          }
  
          .logo-correios {
              max-width: 75px;
          }
  
          .logo-correios img {
              max-width: 75px;
          }
  
          .screening-code {
              font-size: 15px;
              font-family: Arial, Helvetica, sans-serif;
              justify-self: center;
              align-self: center;
              font-weight: bold;
          }
  
          .symbol {
              align-self: center;
          }
  
          .symbol img {
              max-width: 75px;
              max-height: 75px;
          }
  
          .codes-area {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
          }
  
          .contract-number {
              font-weight: bold;
          }
  
          .barcode-code {
              align-self: center;
              font-weight: bold;
          }
  
          .line {
              border-bottom: 1px solid #000;
              width: 100%;
          }
  
          .field {
              display: flex;
              flex-direction: row;
              padding-bottom: 10px;
          }
  
          .field-2 {
              display: grid;
              gap: 10px;
              grid-template-columns: 1fr 1fr;
          }
  
          .signature {
              font-size: 8px;
              font-family: Arial, Helvetica, sans-serif;
              padding-bottom: 10px;
          }
  
          .destiny-label {
              background-color: #000;
              position: absolute;
              color: #fff;
          }
  
          .recipient {
              border: 1px solid #000;
              position: relative;
          }
  
          .recipient-barcode img{
              max-width: 150px;
              height: 70px;
              padding: 0px 20px;
          }
  
          .recipient-cep {
              text-align: center;
              font-weight: bold;
              font-size: 10px;
          }
  
          .recipient-barcode-wrapper {
              padding: 10px;
          }
  
          .devolution {
              padding: 10px 0px;
          }
  
          .question {
              margin: 5px 0px;
          }
  
          .service-name {
              font-weight: bold;
          }
  
          .product-table td {
              border-right: 1px solid #000;
              border-top: 1px solid #000;
          }
          
          .product-table th {
              border-right: 1px solid #000;
              border-top: 1px solid #000;
              text-align: left;
          }
  
          .product-table th:first-child {
              border-left: 1px solid #000;  
          }
  
          .product-table td:first-child {
              border-left: 1px solid #000;  
          }
  
          .product-table tr:last-child td {
              border-bottom: 1px solid #000;  
          }
      </style>
  </head>
  
  <body>
      <div class="first-line">
          <div class="logo">
              <img src="https://static.alirok.io/collections/logos/alirok.png" />
          </div>
          <div class="logo-correios">
              <img src="https://static.alirok.io/collections/logos/correios.png" />
          </div>
          <div class="screening-code">${data.screeningCenter}</div>
          <div class="symbol">
              <img src="https://static.alirok.io/collections/logos/alirok.png" />
          </div>
      </div>
      <div class="codes-area">
          <div class="order-number">
              <div>
                  Order #: ${data.order}
              </div>
              <div>
                  Service 2
              </div>
          </div>
          <div class="service-info">
              <div class="service-name">
                ${data.service}
              </div>
              <div>
                  Contrato: <span class="contract-number">123456789</span>
              </div>
          </div>
      </div>
  
      <div class="barcode">
          <div class="barcode-code">${data.trackingCode}</div>
          <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5MrsGOgw2pGNLfR5_Z8Z-QTgU6jR6MMLQIg&usqp=CAU" />
      </div>
      <div class="signature">
          <div class="field">
              <span>Recebedor:</span>
              <div class="line"></div>
          </div>
          <div class="field-2">
              <div class="field">
                  <span>Assinatura:</span>
                  <div class="line"></div>
              </div>
              <div class="field">
                  <span>Documento:</span>
                  <div class="line"></div>
              </div>
          </div>
      </div>
      <div class="recipient">
          <label class="destiny-label">DESTINATÁRIO</label>
          <table>
              <tbody>
                  <tr>
                      <td style="width: 50%; padding-left: 10px;">
                          <table>
                              <tbody>
                                  <tr>
                                      <td>
                                          ${data.recipientName}
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                         ${data.recipientStreet}, ${
    data.recipientStreetNumber
  }
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          ${
                                            data.recipientAdditionalAddress ??
                                            'Complemento'
                                          }
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          ${data.recipientCity} / ${
    data.recipientState
  }
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
  
                      </td>
                      <td class="recipient-barcode-wrapper">
                          <div class="recipient-barcode">
                              <img
                                  src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5MrsGOgw2pGNLfR5_Z8Z-QTgU6jR6MMLQIg&usqp=CAU" />
                          </div>
                          <div class="recipient-cep">
                              ${data.recipientPostalCode}
                          </div>
                      </td>
  
                  </tr>
              </tbody>
          </table>
      </div>
      <div class="question">Dúvidas e reclamações: e-mail / site</div>
      <div class="devolution">
          <table>
              <tbody>
                  <tr>
                     <td>
                      <label style="font-weight: bold;" >
                          DEVOLUÇÃO:
                      </label>
                      <div>
                          (Em caso de não entrega ao remetente, entregar para):
                      </div>
                      <table>
                          <tbody>
                              <tr>
                                  <td>
                                      Nome da empresa no brasil
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      Logradouro
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                      Bairro
                                  </td>
                              </tr>
                              <tr>
                                  <td>
                                     CEP - Cidade/UF
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                     </td>
                     <td style="width: 30%;">
                          <table>
                              <tbody>
                                  <tr>
                                      <td>
                                          Remetente:
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          ${data.senderName}
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          ${data.senderStreet}, ${
    data.senderStreetNumber
  }
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          ${data.senderCity}
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                        ${data.senderCountry} 
                                      </td>
                                  </tr>
                                  <tr>
                                      <td>
                                          Site de vendas
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                     </td>
                  </tr>
              </tbody>
          </table>
      </div>
      <table class="product-table">
          <tbody>
              <tr>
                  <th colspan="3">
                      Declaração para alfandega
                  </th>
                  <th colspan="3">
                     Pode ser aberto ex Officio 1/1
                  </th>
              </tr>
              ${data.items.map((i) => {
                return `<tr>
                <td>
                    Cod Sh
                </td>
                <td>
                   Qtde
                </td>
                <td>
                   Descrição do conteúdo
                </td>
                <td>
                    Peso KG
                 </td>
                 <td>
                    Unit USD
                 </td>
                 <td>
                    Valor USD
                 </td>
            </tr>`;
              })}
              <tr>
                  <td colspan="5">
                      Frete USD
                  </td>
                  <td>
                      ${data.freightCost}
                  </td>
              </tr>
              <tr>
                  <td colspan="5">
                      Seguro USD
                  </td>
                  <td>
                      ${data.insuranceCost}
                  </td>
              </tr>
              <tr>
                  <td colspan="5">
                      Total USD - (Mercadorias + Frete + Seguro)
                  </td>
                  <td>
                    ${data.freightCost + data.insuranceCost}
                  </td>
              </tr>
          </tbody>
      </table>
  
  </body>
  
  </html>`;

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
