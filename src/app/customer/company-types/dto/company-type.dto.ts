import { IsNotEmpty, IsString } from 'class-validator';

export class CompanyTypeDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsString()
  @IsNotEmpty()
  display?: boolean;
}
