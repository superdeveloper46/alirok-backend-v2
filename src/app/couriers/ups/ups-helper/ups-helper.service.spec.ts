import { Test, TestingModule } from '@nestjs/testing';
import { UpsHelperService } from './ups-helper.service';

describe('UpsHelperService', () => {
  let service: UpsHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpsHelperService],
    }).compile();

    service = module.get<UpsHelperService>(UpsHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
