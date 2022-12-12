import { Test, TestingModule } from '@nestjs/testing';
import { MassMeasuresController } from './mass-measures.controller';

describe('MassMeasuresController', () => {
  let controller: MassMeasuresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MassMeasuresController],
    }).compile();

    controller = module.get<MassMeasuresController>(MassMeasuresController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
