import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConvertCurrencyRateDTO {
  @IsNotEmpty()
  @IsString()
  toCurrencyCode: string;

  @IsOptional()
  @IsString()
  fromCurrencyCode?: string;
}
