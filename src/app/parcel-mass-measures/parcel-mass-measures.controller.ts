import { Controller, Get } from '@nestjs/common';
import { Roles } from '../../common/decorator/roles.decorator';
import { ParcelMassMeasuresService } from './parcel-mass-measures.service';

@Controller('parcel-mass-measures')
export class ParcelMassMeasuresController {
  constructor(
    private readonly parcelMassMeasuresService: ParcelMassMeasuresService,
  ) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.parcelMassMeasuresService.findAll();
  }
}
