import { Controller, Get, Query } from '@nestjs/common';
import { AirportsService } from './airports.service';
import { FindAllDto } from './dto/airports.dto';

@Controller('airports')
export class AirportsController {
  constructor(private readonly airportsService: AirportsService) {}

  @Get('searchList')
  findAll(
    @Query()
    query: FindAllDto
  ) {
    return this.airportsService.findAll(query)
  }
}
