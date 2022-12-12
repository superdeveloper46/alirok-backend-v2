import { Body, Controller, Post } from '@nestjs/common';
import { Roles } from '../../../common/decorator/roles.decorator';
import { UpsertValueServicesDto } from './dto/upsert-value-services.dto';
import { ValueServicesService } from './value-services.service';

@Controller('customer/value-services')
export class ValueServicesController {
  constructor(private readonly valueServicesService: ValueServicesService) {}

  @Roles('user')
  @Post()
  upsertValueServices(
    @Body()
    upsertValueServicesDto: UpsertValueServicesDto,
  ) {
    return this.valueServicesService.upsertValueServices(
      upsertValueServicesDto,
    );
  }
}
