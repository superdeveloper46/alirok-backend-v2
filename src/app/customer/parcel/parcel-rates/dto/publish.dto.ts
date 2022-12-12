import { IsUUID } from 'class-validator';
import { ToBoolean } from '../../../../../common/pipe/toBoolean.pipe';

export class PublishDto {
  @ToBoolean()
  isPublished: boolean;

  @IsUUID()
  parcel_route_uuid: string;
}
