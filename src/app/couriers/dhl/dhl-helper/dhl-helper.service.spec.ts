import { Test, TestingModule } from '@nestjs/testing';
import { DhlHelperService } from './dhl-helper.service';

describe('DhlHelperService', () => {
  let service: DhlHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DhlHelperService],
    }).compile();

    service = module.get<DhlHelperService>(DhlHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
