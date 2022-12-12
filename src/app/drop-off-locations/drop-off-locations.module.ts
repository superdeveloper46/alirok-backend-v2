import { Module } from '@nestjs/common';
import { AddressModule } from '../misc/address/address.module';
import { DropOffLocationsController } from './drop-off-locations.controller';
import { DropOffLocationsService } from './drop-off-locations.service';

@Module({
  controllers: [DropOffLocationsController],
  providers: [DropOffLocationsService],
  imports: [AddressModule],
})
export class DropOffLocationsModule {}
