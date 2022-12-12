import { Body, Controller, Get, Query, Post, Param } from '@nestjs/common';
import { users } from '@generated/client';
import { CurrentCompany } from 'src/common/decorator/current-company.decorator';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import { Roles } from 'src/common/decorator/roles.decorator';
import { ShipmentsService } from './shipments.service';
import { UpdateDataDto } from './dto/update-shipment.dto';

@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Roles('user')
  @Get()
  async findShipments(
    @CurrentUser() currentUser: users,
    @CurrentCompany() currentCompany: string,
    @Query() owner: { owner: string },
  ) {
    return this.shipmentsService.handle(currentUser, currentCompany, owner);
  }

  @Post('update-status')
  async updateShipmentStatus(@Body() updateData: UpdateDataDto) {
    return this.shipmentsService.updateShipmentStatus(updateData);
  }

  @Get('/:booking_uuid')
  getDriverById(@Param('booking_uuid') booking_uuid: string) {
    return this.shipmentsService.getShipmentQuoteById(booking_uuid);
  }
}
