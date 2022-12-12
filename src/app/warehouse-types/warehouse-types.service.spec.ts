import { Test, TestingModule } from '@nestjs/testing';
import { WarehouseTypesService } from './warehouse-types.service';

describe('WarehouseTypesService', () => {
  let service: WarehouseTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WarehouseTypesService],
    }).compile();

    service = module.get<WarehouseTypesService>(WarehouseTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
