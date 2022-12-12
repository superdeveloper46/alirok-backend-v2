import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CheckoutParcelMember } from 'src/app/checkout/interface/checkout.interface';
import { FormattersService } from 'src/app/misc/formatters/formatters.service';
import {
  NewRateShipmentDTO,
  NewRateShipmentReturnDTO,
} from '../../dto/newCouriers.dto';
import { IClearLaneTracking } from '../interface/clear-lane.interface';

@Injectable()
export class ClearLaneHelperService {
  private CLEAR_LANE_USERNAME;
  private CLEAR_LANE_PASSWORD;
  constructor(
    private readonly configService: ConfigService,
    private readonly formatter: FormattersService,
  ) {
    this.CLEAR_LANE_USERNAME = configService.get('CLEAR_LANE_USERNAME');
    this.CLEAR_LANE_PASSWORD = configService.get('CLEAR_LANE_PASSWORD');
  }

  public buildRatePayload(quote: NewRateShipmentDTO) {
    const origin = quote?.whereFrom?.data;
    const destiny = quote?.whereTo?.data;
    const pickUpDate = quote?.shipDate?.data?.date;
    const description = quote?.description;

    const formData = {
      requestId: this.formatter.betweenRandomNumber(100000, 999999),
      originCountry: origin.country,
      originCity: origin.city,
      originState: origin.state,
      originZip: origin.zipCode,
      destinationCountry: destiny.country,
      destinationCity: destiny.city,
      destinationState: destiny.state,
      destinationZip: destiny.zipCode,
      pickupDate: pickUpDate,
      pickupTime: pickUpDate,
      pickupLocationCloseTime: pickUpDate,
      declaredValue: description.price.value,
    };

    const packages = this.formatter.convertPackagesToImperial(quote);

    const payload = `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GetRating xmlns="http://tempuri.org/">
          <RatingParam>
            <RatingInput>
              <RequestID>${formData.requestId}</RequestID>
              <OriginCountry>${formData.originCountry}</OriginCountry>
              <OriginCity>${formData.originCity}</OriginCity>
              <OriginState>${formData.originState}</OriginState>
              <OriginZip>${formData.originZip}</OriginZip>
              <DestinationCountry>${
                formData.destinationCountry
              }</DestinationCountry>
              <DestinationCity>${formData.destinationCity}</DestinationCity>
              <DestinationState>${formData.destinationState}</DestinationState>
              <DestinationZip>${formData.destinationZip}</DestinationZip>
              <PickupDate>${formData.pickupDate}</PickupDate>
              <PickupTime>${formData.pickupTime}</PickupTime>
              <PickupLocationCloseTime>${
                formData.pickupLocationCloseTime
              }</PickupLocationCloseTime>
              <DeclaredValue>${formData.declaredValue}</DeclaredValue>
              <WebTrakUserID>${this.CLEAR_LANE_USERNAME}</WebTrakUserID>
            </RatingInput>
            <CommodityInput>
              <CommodityInput>
                <CommodityClass>50</CommodityClass>
                <CommodityPieces>${packages[0].pieces}</CommodityPieces>
                <CommodityWeightPerPiece>${this.formatter.roundUpperInteger(
                  packages[0].weight.value,
                )}</CommodityWeightPerPiece>
                <CommodityWeight>${this.formatter.roundUpperInteger(
                  packages[0].weight.value * packages[0].pieces,
                )}</CommodityWeight>
                <CommodityLength>${this.formatter.roundUpperInteger(
                  packages[0].dimensions.length,
                )}</CommodityLength>
                <CommodityWidth>${this.formatter.roundUpperInteger(
                  packages[0].dimensions.width,
                )}</CommodityWidth>
                <CommodityHeight>${this.formatter.roundUpperInteger(
                  packages[0].dimensions.height,
                )}</CommodityHeight>
              </CommodityInput>
            </CommodityInput>
          </RatingParam>
        </GetRating>
      </soap:Body>
    </soap:Envelope>`;

    return payload;
  }
  public buildShippingPayload(
    quote: NewRateShipmentDTO,
    metadata: NewRateShipmentReturnDTO,
    sender: CheckoutParcelMember,
    recipient: CheckoutParcelMember,
  ) {
    const origin = quote?.whereFrom?.data;
    const destiny = quote?.whereTo?.data;
    const pickUpDate = quote?.shipDate?.data?.date;
    const description = quote?.description;
    const delivery = metadata.delivery.date;

    const formData = {
      username: this.CLEAR_LANE_USERNAME,
      password: this.CLEAR_LANE_PASSWORD,
      codAmount: 1,
      declaredValue: description.price.value,
      readyDate: pickUpDate,
      readyTime: pickUpDate,
      closeTime: pickUpDate,
      deliveryDate: delivery,
      deliveryTime: delivery,
      billToAcct: metadata?.price.value,
      shipperName: sender.full_name,
      shipperAddress1: `${origin.streetNumber} ${origin.street}`,
      shipperAddress2: '',
      shipperCity: `${origin.city}`,
      shipperState: origin.state,
      shipperZip: origin.zipCode,
      shipperCountry: origin.country,
      ShipperPhone: sender.phone.number,
      shipperEmail: sender.email,
      consigneeName: recipient.full_name,
      consigneeAddress1: `${destiny.streetNumber} ${destiny.street}`,
      consigneeAddress2: '',
      consigneeCity: destiny.city,
      consigneeState: destiny.state,
      consigneeZip: destiny.zipCode,
      consigneeCountry: destiny.country,
      consigneePhone: recipient.phone.number,
      consigneeEmail: recipient.email,
      incoTermsCode: 'DDU',
      commercialInvoiceValue: description.price.value,
      shipmentType: 'Shipment',
      mode: 'Domestic',
      podDate: new Date(),
      podTime: new Date(),
      deliveryTime2: new Date(),
      delBy: 'Only',
    };

    const packages = this.formatter.convertPackagesToImperial(quote);

    const formDataItems = packages?.map((i) => {
      `<NewShipmentDimLineV4>
        <Weigth>${i.weight.value}</Weigth>
        <Height>${i.dimensions.height}</Height>
        <Length>${i.dimensions.length}</Length>
        <Width>${i.dimensions.width}</Width>
        <Pieces>${i.pieces}</Pieces>
        <WeightUOMV3>lb</WeightUOMV3>
        <DimUOMV3>in</DimUOMV3>
        <Hazmat>false</Hazmat>
        <Skids>int</Skids>
    </NewShipmentDimLineV4>`;
    });

    const payload = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Header>
        <AuthHeader xmlns="http://tempuri.org/">
          <UserName>${formData.username}</UserName>
          <Password>${formData.password}</Password>
        </AuthHeader>
      </soap12:Header>
      <soap12:Body>
        <AddNewShipmentV4 xmlns="http://tempuri.org/">
          <oShipData>
            <CODAmount>${formData.codAmount}</CODAmount>
            <DeclaredValue>${formData.declaredValue}</DeclaredValue>
            <ReadyDate>${formData.readyDate}</ReadyDate>
            <ReadyTime>${formData.readyTime}</ReadyTime>
            <DeliveryDate>${formData.deliveryDate}</DeliveryDate>
            <DeliveryTime>${formData.deliveryTime}</DeliveryTime>
            <CloseTime>${formData.closeTime}</CloseTime>
            <BillToAcct>${formData.billToAcct}</BillToAcct>
            <ShipperName>${formData.shipperName}</ShipperName>
            <ShipperAddress1>${formData.shipperAddress1}</ShipperAddress1>
            <ShipperAddress2>${formData.shipperAddress2}</ShipperAddress2>
            <ShipperCity>${formData.shipperCity}</ShipperCity>
            <ShipperState>${formData.shipperState}</ShipperState>
            <ShipperZip>${formData.shipperZip}</ShipperZip>
            <ShipperCountry>${formData.shipperCountry}</ShipperCountry>
            <ShipperPhone>${formData.ShipperPhone}</ShipperPhone>
            <ShipperEmail>${formData.shipperEmail}</ShipperEmail>
            <ConsigneeName>${formData.consigneeName}</ConsigneeName>
            <ConsigneeAddress1>${formData.consigneeAddress1}</ConsigneeAddress1>
            <ConsigneeAddress2>${formData.consigneeAddress2}</ConsigneeAddress2>
            <ConsigneeCity>${formData.consigneeCity}</ConsigneeCity>
            <ConsigneeState>${formData.consigneeState}</ConsigneeState>
            <ConsigneeZip>${formData.consigneeZip}</ConsigneeZip>
            <ConsigneeCountry>${formData.consigneeCountry}</ConsigneeCountry>
            <ConsigneePhone>${formData.consigneePhone}</ConsigneePhone>
            <ConsigneeEmail>${formData.consigneeEmail}</ConsigneeEmail>
            <IncoTermsCode>${formData.incoTermsCode}</IncoTermsCode>
            <CommericalInvoiceValue>${formData.commercialInvoiceValue}</CommericalInvoiceValue>
            <ShipmentType>${formData.shipmentType}</ShipmentType>
            <Mode>${formData.mode}</Mode>
            <PODDate>${formData.podDate}</PODDate>
            <PODTime>${formData.podTime}</PODTime>
            <DeliveryTime2>${formData.deliveryTime2}</DeliveryTime2>
            <ShipmentLineList>
              <NewShipmentDimLineV4>
                ${formDataItems}
              </NewShipmentDimLineV4>
            </ShipmentLineList>
            <DelBy>${formData.delBy}</DelBy>
          </oShipData>
        </AddNewShipmentV4>
      </soap12:Body>
    </soap12:Envelope>`;

    return payload;
  }
  public buildTrackingPayload(trackData: IClearLaneTracking) {
    const payload = `<?xml version="1.0" encoding="utf-8"?>
    <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
      <soap12:Header>
        <AuthHeader xmlns="http://tempuri.org/">
            <UserName>${this.CLEAR_LANE_USERNAME}</UserName>
            <Password>${this.CLEAR_LANE_PASSWORD}</Password>
        </AuthHeader>
      </soap12:Header>
      <soap12:Body>
        <GetShipmentsByTrackingNo xmlns="http://tempuri.org/">
            <Housebill>${trackData.housebill}</Housebill>
        </GetShipmentsByTrackingNo>
      </soap12:Body>
    </soap12:Envelope>`;

    return payload;
  }
}
