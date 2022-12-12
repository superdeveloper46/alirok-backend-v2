import { IsEnum, IsNumber, IsUUID } from 'class-validator';

export enum WeightMeasure {
  KG = 'KG',
  LB = 'LB',
}

export enum Coin {
  USD = 'USD',
}

export class CreateAutoWeightBreakDto {
  @IsUUID()
  parcel_rate_uuid: string;

  @IsNumber()
  weight: number;

  @IsEnum(WeightMeasure)
  weight_measure: WeightMeasure;

  @IsNumber()
  value: number;

  coin: string;

  @IsNumber()
  max_weight: number;

  @IsEnum(WeightMeasure)
  max_weight_measure: WeightMeasure;
}
