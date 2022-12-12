import { Module } from '@nestjs/common';
import { ShippingLineController } from './shipping-line.controller';
import { ShippingLineService } from './shipping-line.service';

@Module({
  providers: [ShippingLineService],
  controllers: [ShippingLineController],
  imports: [],
})
export class ShippingLineModule {}
