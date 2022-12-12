import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePhotoDto {
  @IsNotEmpty()
  @IsString()
  user_uuid: string;

  @IsNotEmpty()
  file: {
    type: string;
    field: string;
  };
}
