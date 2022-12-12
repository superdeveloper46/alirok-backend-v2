import {
  Controller,
  Query,
  Param,
  Body,
  Get,
  Post,
  Put,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { CurrentCompany } from '../../common/decorator/current-company.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import {
  FindAllDimensionsDTO,
  FindAllCommonDimensionsDTO,
  CreateDimensionsDTO,
  UpdateDimensionsDTO,
} from './dto/dimensions.dto';
import { DimensionsService } from './dimensions.service';

@Controller('dimensions')
export class DimensionsController {
  constructor(private readonly dimensionsService: DimensionsService) {}

  @Roles('admin')
  @Get('/')
  findAll(@Query() payload: FindAllDimensionsDTO) {
    return this.dimensionsService.findAll(payload);
  }

  @Roles('user')
  @Get('/company')
  findAllDimensionsByCompany(
    @CurrentCompany() currentCompany: string,
    @Query() payload: FindAllCommonDimensionsDTO,
  ) {
    if (!currentCompany) {
      throw new BadRequestException('Company not found in header');
    }

    return this.dimensionsService.findAll({
      ...payload,
      user_company_uuid: currentCompany,
    });
  }

  @Roles('user')
  @Post('/company')
  createForCompany(
    @CurrentCompany() currentCompany: string,
    @Body() payload: CreateDimensionsDTO,
  ) {
    if (!currentCompany) {
      throw new BadRequestException('Company not found in header');
    }

    return this.dimensionsService.createForCompany({
      ...payload,
      user_company_uuid: currentCompany,
    });
  }

  @Roles('user')
  @Put('/company/:id')
  updateForCompany(
    @CurrentCompany() currentCompany: string,
    @Param('id') id: string,
    @Body() payload: UpdateDimensionsDTO,
  ) {
    if (!currentCompany) {
      throw new BadRequestException('Company not found in header');
    }

    return this.dimensionsService.updateForCompany({
      ...payload,
      dimensional_factor_uuid: id,
      user_company_uuid: currentCompany,
    });
  }

  @Roles('user')
  @Delete('/company/:id')
  deleteForCompany(
    @CurrentCompany() currentCompany: string,
    @Param('id') id: string,
  ) {
    if (!currentCompany) {
      throw new BadRequestException('Company not found in header');
    }

    return this.dimensionsService.deleteForCompany({
      dimensional_factor_uuid: id,
      user_company_uuid: currentCompany,
    });
  }

  @Roles('user')
  @Get('/company/gross-factor')
  upsertDimGrossWeightFactor(@CurrentCompany() currentCompany: string) {
    return this.dimensionsService.upsertDimGrossWeightFactor(currentCompany);
  }
}
