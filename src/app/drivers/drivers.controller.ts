import {
  Controller,
  Body,
  Post,
  Get,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentCompany } from 'src/common/decorator/current-company.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { DriversService } from './drivers.service';
import {
  DeleteDriverDTO,
  DriversDto,
  GetDriverInfoDto,
  GetDriversDto,
} from './dto/drivers.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Roles('user')
  @Post('')
  createDrivers(
    @CurrentCompany() currentCompany: string,
    @Body() drivers: DriversDto[],
  ) {
    return this.driversService.createDrivers(currentCompany, drivers);
  }

  @Roles('user')
  @Delete('/:driver_uuid')
  deleteDriver(@Param() deleteDTO: DeleteDriverDTO) {
    return this.driversService.deleteDriver(deleteDTO);
  }

  @Roles('user')
  @Get('')
  getDrivers(
    @CurrentCompany() currentCompany: string,
    @Query()
    query: GetDriversDto,
  ) {
    return this.driversService.getDrivers(currentCompany, query);
  }

  @Post('auth-driver')
  getDriverByInfo(@Body() driverInfo: GetDriverInfoDto) {
    return this.driversService.getDriverByInfo(driverInfo);
  }

  @Get('/:driver_uuid')
  getDriverById(@Param('driver_uuid') driver_uuid: string) {
    return this.driversService.getDriverById(driver_uuid);
  }
}
