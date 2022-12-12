import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class File {
  type: string;
}

export class CreateBookingCommentDTO {
  @IsOptional()
  @IsString()
  text: string;

  @IsNotEmpty()
  @IsString()
  parcel_booking_uuid: string;

  @IsOptional()
  @IsString()
  author_user_uuid: string;

  @IsOptional()
  @IsString()
  parent_comment_uuid: string | null;

  @IsOptional()
  file: File;
}
