import { IsEnum, IsInt, IsNumber, IsUUID } from 'class-validator';

export enum Type {
  MINIMUM = 'MINIMUM',
  MAXIMUM = 'MAXIMUM',
}

export enum LengthMeasure {
  IN = 'IN',
  CM = 'CM',
}

export enum WeightMeasure {
  KG = 'KG',
  LB = 'LB',
}

export enum Coin {
  USD = 'USD',
}

export class CreateRulesDto {
  @IsEnum(Type)
  type: Type;

  @IsUUID()
  parcel_rate_uuid: string;

  @IsUUID()
  parcel_route_uuid: string;

  @IsInt()
  pieces: number;

  @IsNumber()
  length: number;

  @IsNumber()
  width: number;

  @IsNumber()
  height: number;

  @IsEnum(LengthMeasure)
  length_measure: LengthMeasure;

  @IsNumber()
  weight: number;

  @IsEnum(WeightMeasure)
  weight_measure: WeightMeasure;

  @IsNumber()
  value: number;

  coin: string;
}
