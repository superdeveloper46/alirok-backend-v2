import { Test, TestingModule } from '@nestjs/testing';
import { LengthMeasuresService } from './length-measures.service';

describe('LengthMeasuresService', () => {
  let service: LengthMeasuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LengthMeasuresService],
    }).compile();

    service = module.get<LengthMeasuresService>(LengthMeasuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
