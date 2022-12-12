import { IsOptional, IsString } from 'class-validator';

export class UpdateMemberDto {
  @IsOptional()
  @IsString()
  user_uuid?: string;

  @IsOptional()
  @IsString()
  company_uuid?: string;
}
