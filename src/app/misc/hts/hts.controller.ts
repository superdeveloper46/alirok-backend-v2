import { Controller, Get, Query } from '@nestjs/common';
import { FindAllHtsDto } from './dto/find-all-hts.dto';
import { HtsService } from './hts.service';

@Controller('misc/hts')
export class HtsController {
  constructor(private readonly htsService: HtsService) {}

  @Get()
  findAll(
    @Query()
    query: FindAllHtsDto,
  ) {
    return this.htsService.findAll(query);
  }

  @Get('default')
  findAllDefault(
    @Query()
    query: FindAllHtsDto,
  ) {
    return this.htsService.findAllDefault(query);
  }
}
