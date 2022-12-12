import { IsUUID, IsEnum, IsNotEmpty, IsString } from 'class-validator';

enum ParcelBookingPaymentTypeStatus {
  PAYABLE = 'payable',
  RECEIVABLE = 'receivable',
}

export enum ParcelBookingPaymentStatus {
  OPEN = 'OPEN',
  OVERDUE = 'OVERDUE',
  IN_PROGRESS = 'IN_PROGRESS',
  PAID = 'PAID',
  DISCREPANCIES = 'DISCREPANCIES',
  REFUNDED = 'REFUNDED',
}

export class UpdateParcelBookingStatusTypesDTO {
  @IsNotEmpty()
  @IsEnum(ParcelBookingPaymentTypeStatus)
  statusType: ParcelBookingPaymentTypeStatus;
}

export class UpdateParcelBookingStatusPayloadDTO {
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @IsNotEmpty()
  @IsEnum(ParcelBookingPaymentStatus)
  status: ParcelBookingPaymentStatus;
}
