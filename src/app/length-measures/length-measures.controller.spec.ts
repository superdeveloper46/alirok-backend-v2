import { Test, TestingModule } from '@nestjs/testing';
import { LengthMeasuresController } from './length-measures.controller';

describe('LengthMeasuresController', () => {
  let controller: LengthMeasuresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LengthMeasuresController],
    }).compile();

    controller = module.get<LengthMeasuresController>(LengthMeasuresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
