import { Body, Controller, Post } from '@nestjs/common';
import { UniversalTrackingService } from './universal-tracking.service';

@Controller('tracking')
export class UniversalTrackingController {
  constructor(private readonly universalTracking: UniversalTrackingService) {}

  @Post()
  async tracking(@Body('trackingNumber') trackingNumber: string) {
    return this.universalTracking.universalTracking(trackingNumber);
  }
}
