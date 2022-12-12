import { Test, TestingModule } from '@nestjs/testing';
import { ParcelMassMeasuresService } from './parcel-mass-measures.service';

describe('ParcelMassMeasuresService', () => {
  let service: ParcelMassMeasuresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParcelMassMeasuresService],
    }).compile();

    service = module.get<ParcelMassMeasuresService>(ParcelMassMeasuresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
