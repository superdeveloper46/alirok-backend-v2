import { Test, TestingModule } from '@nestjs/testing';
import { FormattersService } from './formatters.service';

describe('FormattersService', () => {
  let service: FormattersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FormattersService],
    }).compile();

    service = module.get<FormattersService>(FormattersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
