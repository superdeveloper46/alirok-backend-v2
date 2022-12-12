import { Module } from '@nestjs/common';
// import { AddressModule } from '../../../misc/address/address.module';
import { UspsHelperService } from './usps-helper.service';

@Module({
  providers: [UspsHelperService],
  exports: [UspsHelperService],
  // imports: [AddressModule],
})
export class UspsHelperModule {}
