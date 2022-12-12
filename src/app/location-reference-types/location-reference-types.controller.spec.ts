import { Test, TestingModule } from '@nestjs/testing';
import { LocationReferenceTypesController } from './location-reference-types.controller';

describe('LocationReferenceTypesController', () => {
  let controller: LocationReferenceTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationReferenceTypesController],
    }).compile();

    controller = module.get<LocationReferenceTypesController>(LocationReferenceTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
