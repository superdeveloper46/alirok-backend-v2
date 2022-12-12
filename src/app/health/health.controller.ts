import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Health } from './entities/health.entity';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get(['/', '/health', '/healthz'])
  @ApiOperation({ summary: 'Check API Health' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The API is healthy',
    type: Health,
  })
  health() {
    return this.healthService.health();
  }
}
