import { Test, TestingModule } from '@nestjs/testing';
import { LocationReferenceTypesService } from './location-reference-types.service';

describe('LocationReferenceTypesService', () => {
  let service: LocationReferenceTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationReferenceTypesService],
    }).compile();

    service = module.get<LocationReferenceTypesService>(LocationReferenceTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
