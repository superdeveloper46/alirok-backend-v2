import { Test, TestingModule } from '@nestjs/testing';
import { ParcelMassMeasuresController } from './parcel-mass-measures.controller';

describe('ParcelMassMeasuresController', () => {
  let controller: ParcelMassMeasuresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParcelMassMeasuresController],
    }).compile();

    controller = module.get<ParcelMassMeasuresController>(
      ParcelMassMeasuresController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
