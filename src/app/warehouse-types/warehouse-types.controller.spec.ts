import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseTypesController } from './warehouse-types.controller';

describe('WarehouseTypesController', () => {
  let controller: WarehouseTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WarehouseTypesController],
    }).compile();

    controller = module.get<WarehouseTypesController>(WarehouseTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
