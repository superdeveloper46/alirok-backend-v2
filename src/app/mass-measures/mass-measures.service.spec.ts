import { Test, TestingModule } from '@nestjs/testing';
import { MassMeasuresService } from './mass-measures.service';

describe('MassMeasuresService', () => {
  let service: MassMeasuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MassMeasuresService],
    }).compile();

    service = module.get<MassMeasuresService>(MassMeasuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
