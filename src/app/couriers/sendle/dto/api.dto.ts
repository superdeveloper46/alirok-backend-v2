import {
    IsOptional,
    IsString,
    IsDate
  } from 'class-validator';
import { Type } from 'class-transformer';
import { timestamp } from 'aws-sdk/clients/cloudfront';

  export class basicDTO {
    @IsOptional()
    @IsString()
    ping?: string

    @IsOptional()
    @IsDate()
    timestampe?: timestamp
  }