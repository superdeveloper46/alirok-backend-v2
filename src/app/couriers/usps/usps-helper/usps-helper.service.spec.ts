import { Test, TestingModule } from '@nestjs/testing';
import { UspsHelperService } from './usps-helper.service';

describe('UspsHelperService', () => {
  let service: UspsHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UspsHelperService],
    }).compile();

    service = module.get<UspsHelperService>(UspsHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
