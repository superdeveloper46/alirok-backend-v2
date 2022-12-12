import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateFeedbackDTO {
  @IsString()
  @IsOptional()
  message?: string;

  @IsNumber()
  @IsIn([1, 2, 3, 4, 5])
  rating: number;

  @IsUUID()
  @IsNotEmpty()
  feedback_uuid: string;

  @IsString()
  @IsNotEmpty()
  tracking_code: string;

  user_uuid: string;
}
