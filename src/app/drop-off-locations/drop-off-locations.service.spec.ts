import { Test, TestingModule } from '@nestjs/testing';
import { DropOffLocationsService } from './drop-off-locations.service';

describe('DropOffLocationsService', () => {
  let service: DropOffLocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DropOffLocationsService],
    }).compile();

    service = module.get<DropOffLocationsService>(DropOffLocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
