import { Controller, Body, Post, Get, Delete, Param } from '@nestjs/common';
import { Roles } from 'src/common/decorator/roles.decorator';
import { CurrentCompany } from 'src/common/decorator/current-company.decorator';
import {
  UpsertDropOffLocationDTO,
  DeleteDropOffLocationDTO,
  FetchDropOffLocationDTO,
} from './dto/drop-off-locations.dto';
import { DropOffLocationsService } from './drop-off-locations.service';

@Controller('drop-off-locations')
export class DropOffLocationsController {
  constructor(
    private readonly dropOffLocationsService: DropOffLocationsService,
  ) {}

  @Roles('user')
  @Get('/')
  listDropOffLocation(@CurrentCompany() currentCompany: string) {
    return this.dropOffLocationsService.listDropOffLocation(currentCompany);
  }

  @Roles('user')
  @Get('/carrier-vendors')
  listCarrierVendors(@CurrentCompany() currentCompany: string) {
    return this.dropOffLocationsService.listCarrierVendors(currentCompany);
  }

  @Roles('user')
  @Get('/:drop_off_location_uuid')
  fetchDropOffLocation(
    @CurrentCompany() currentCompany: string,
    @Param() fetchDTO: FetchDropOffLocationDTO,
  ) {
    return this.dropOffLocationsService.fetchDropOffLocation(
      currentCompany,
      fetchDTO,
    );
  }

  @Roles('user')
  @Post('/')
  upsertDropOffLocation(
    @CurrentCompany() currentCompany: string,
    @Body() upsertDTO: UpsertDropOffLocationDTO,
  ) {
    return this.dropOffLocationsService.upsertDropOffLocation(
      currentCompany,
      upsertDTO,
    );
  }

  @Roles('user')
  @Delete('/:drop_off_location_uuid')
  deleteDropOffLocation(
    @CurrentCompany() currentCompany: string,
    @Param() deleteDTO: DeleteDropOffLocationDTO,
  ) {
    return this.dropOffLocationsService.deleteDropOffLocation(
      currentCompany,
      deleteDTO,
    );
  }
}
