import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Delete,
  Param,
  HttpStatus,
} from '@nestjs/common';
import { ParcelRatesService } from './parcel-rates.service';
import { Roles } from '../../../../common/decorator/roles.decorator';
import { CreateRateTypeDto } from './dto/create-rate-type.dto';
import { FindAllRateTypesDto } from './dto/find-all-rate-types.dto';
import { CreateRulesDto } from './dto/create-rules.dto';
import { CreateAutoWeightBreakDto } from './dto/create-auto-weight-break.dto';
import { CreateCustomerTypeDto } from './dto/create-customer-type.dto';
import { CreateParcelRouteLocationReferenceDto } from './dto/create-parcel-route-location-reference.dto';
import {
  CreateParcelRatesDto,
  FindDropOffLocationDTO,
} from './dto/create-parcel-rates.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { FindAllCustomFieldsDto } from './dto/find-all-custom-fields.dto';
import { PublishDto } from './dto/publish.dto';
import { CreateAirportLocationDto } from './dto/create-airport-location.dto';
import { CreatePortLocationDto } from './dto/create-port-location.dto';
import { UpsertParcelRouteDto } from './dto/upsert-parcel-route.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AirportLocationEntity } from './entities/airport-location.entity';
import { PortLocationEntity } from './entities/port-location.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { FetchParcelRouteDTO } from './dto/fetch-parcel-route.dto';
import { CurrentCompany } from '../../../../common/decorator/current-company.decorator';
import { ParcelRouteModalDto } from './dto/parcel-route-modals.dto';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { users } from '@generated/client';

@ApiTags('parcel-rates')
@Controller('customer/parcel/parcel-rates')
export class ParcelRatesController {
  constructor(private readonly parcelRatesService: ParcelRatesService) {}

  @Roles('user')
  @Post('location-reference')
  createLocationReference(
    @Body()
    createParcelRouteLocationReferenceDto: CreateParcelRouteLocationReferenceDto,
  ) {
    return this.parcelRatesService.createLocationReference(
      createParcelRouteLocationReferenceDto,
    );
  }

  @Roles('user')
  @Post('create-airport-location')
  @ApiOperation({ summary: 'Create Airport Location' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The Airport Location was Created',
    type: AirportLocationEntity,
  })
  createAirport(
    @Body()
    createAirportLocationDto: CreateAirportLocationDto,
  ) {
    return this.parcelRatesService.createAirportLocation(
      createAirportLocationDto,
    );
  }

  @Roles('user')
  @Post('create-port-location')
  @ApiOperation({ summary: 'Create Port Location' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The Port Location was Created',
    type: PortLocationEntity,
  })
  createPort(
    @Body()
    createPortLocationDto: CreatePortLocationDto,
  ) {
    return this.parcelRatesService.createPortLocation(createPortLocationDto);
  }

  @Roles('user')
  @Delete('parcel-route/:id')
  deleteParcelRoute(
    @Param('id') id: string,
    @CurrentCompany() currentCompany: string,
  ) {
    return this.parcelRatesService.deleteParcelRoute(id, currentCompany);
  }

  @Roles('user')
  @Delete('parcel-rate/:id')
  deleteParcelRate(@Param('id') id: string) {
    return this.parcelRatesService.deleteParcelRate(id);
  }

  @Roles('user')
  @Post('publish')
  publish(
    @Body()
    { isPublished, parcel_route_uuid }: PublishDto,
  ) {
    return this.parcelRatesService.publish(isPublished, parcel_route_uuid);
  }

  @Roles('user')
  @Post()
  createParcelRate(
    @Body()
    createParcelRatesDto: CreateParcelRatesDto,
  ) {
    return this.parcelRatesService.createParcelRate(createParcelRatesDto);
  }

  @Roles('user')
  @Get('parcel-route/:parcel_route_uuid')
  fetchParcelRoute(@Param() { parcel_route_uuid }: FetchParcelRouteDTO) {
    return this.parcelRatesService.fetchParcelRoute(parcel_route_uuid);
  }

  @Roles('user')
  @Get('parcel-route')
  fetchAllParcelRoute(@CurrentCompany() currentCompany: string) {
    return this.parcelRatesService.fetchAllParcelRoute(currentCompany);
  }

  @Roles('user')
  @Post('parcel-route')
  upsertParcelRoute(
    @CurrentUser() currentUser: users,
    @Body()
    upsertParcelRouteDto: UpsertParcelRouteDto,
  ) {
    return this.parcelRatesService.upsertParcelRoute(
      upsertParcelRouteDto,
      currentUser,
    );
  }

  @Roles('user')
  @Post('modals')
  createParcelRateModals(
    @Body()
    parcelRouteModalDto: ParcelRouteModalDto,
  ) {
    return this.parcelRatesService.createParcelRateModals(parcelRouteModalDto);
  }

  @Roles('user')
  @Post('customer-type')
  createCustomerType(
    @Body()
    createCustomerTypeDto: CreateCustomerTypeDto,
  ) {
    return this.parcelRatesService.createCustomerTypes(createCustomerTypeDto);
  }

  @Roles('user')
  @Delete('customer-type/:parcel_route_uuid')
  deleteCustomerTypes(@Param('parcel_route_uuid') parcel_route_uuid: string) {
    return this.parcelRatesService.deleteCustomerTypes(parcel_route_uuid);
  }

  @Roles('user')
  @Post('customer')
  createCustomer(
    @Body()
    createCustomerDto: CreateCustomerDto,
  ) {
    return this.parcelRatesService.createCustomers(createCustomerDto);
  }

  @Roles('user')
  @Delete('customer/:parcel_route_uuid')
  deleteCustomers(@Param('parcel_route_uuid') parcel_route_uuid: string) {
    return this.parcelRatesService.deleteCustomers(parcel_route_uuid);
  }

  @Roles('user')
  @Post('rules')
  createRules(
    @Body()
    createRulesDto: CreateRulesDto,
  ) {
    return this.parcelRatesService.createRules(createRulesDto);
  }

  @Roles('user')
  @Get('rules/:id')
  getRules(@Param('id') id: string) {
    return this.parcelRatesService.getRules(id);
  }

  @Roles('user')
  @Post('autoWeightBreak')
  createAutoWeightBreak(
    @Body()
    createAutoWeightBreakDto: CreateAutoWeightBreakDto,
  ) {
    return this.parcelRatesService.createAutoWeightBreak(
      createAutoWeightBreakDto,
    );
  }

  @Roles('user')
  @Get('autoWeightBreak/:id')
  getAutoWeightBreak(@Param('id') id: string) {
    return this.parcelRatesService.getAutoWeightBreak(id);
  }

  @Roles('user')
  @Post('rate-type')
  createRateType(
    @Body()
    createRateTypeDto: CreateRateTypeDto,
  ) {
    return this.parcelRatesService.createRateType(createRateTypeDto);
  }

  @Roles('user')
  @Delete('rate-type/:id')
  deleteRateType(@Param('id') id: string) {
    return this.parcelRatesService.deleteRateType(id);
  }

  @Roles('user')
  @Get('rate-types')
  findAllRateTypes(
    @Query()
    query: FindAllRateTypesDto,
  ) {
    return this.parcelRatesService.findAllRateTypes(query);
  }

  @Roles('user')
  @Post('custom-fields')
  createCustomField(
    @Body()
    createCustomFieldDto: CreateCustomFieldDto,
  ) {
    return this.parcelRatesService.createCustomField(createCustomFieldDto);
  }

  @Roles('user')
  @Get('custom-fields')
  findAllCustomFields(
    @Query()
    query: FindAllCustomFieldsDto,
  ) {
    return this.parcelRatesService.findAllCustomFields(query);
  }

  @Roles('user')
  @Get('sources')
  fetchParcelRateSources() {
    return this.parcelRatesService.fetchParcelRateSources();
  }

  @Roles('user')
  @Get('drop-off-locations')
  fetchDropOffLocations(
    @CurrentCompany() currentCompany: string,
    @Query()
    query: FindDropOffLocationDTO,
  ) {
    return this.parcelRatesService.fetchDropOffLocations(currentCompany, query);
  }

  @Roles('user')
  @Get('find/:action/route/:parcelRouteUUID?')
  fetchNextPreviousParcelRate(
    @CurrentCompany() currentCompany: string,
    @Param('parcelRouteUUID') parcelRouteUUID?: string,
    @Param('action') action?: string,
  ) {
    return this.parcelRatesService.fetchNextPreviousParcelRate(
      currentCompany,
      parcelRouteUUID,
      action,
    );
  }
}
