import { Controller, Get } from '@nestjs/common';
import { LocationReferenceTypesService } from './location-reference-types.service';
import { Roles } from '../../common/decorator/roles.decorator';

@Controller('location-reference-types')
export class LocationReferenceTypesController {
  constructor(
    private readonly locationReferenceTypesService: LocationReferenceTypesService,
  ) {}

  @Roles('user')
  @Get('/')
  findAll() {
    return this.locationReferenceTypesService.findAll();
  }
}
