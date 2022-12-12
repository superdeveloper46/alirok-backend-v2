import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateImage {
  @IsNotEmpty()
  @IsString()
  company_uuid: string;

  @IsNotEmpty()
  file: {
    type: string;
    field: string;
  };
}
