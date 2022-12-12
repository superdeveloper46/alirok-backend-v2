import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesCarriersController } from './companies-carriers.controller';

describe('CompaniesCarriersController', () => {
  let controller: CompaniesCarriersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesCarriersController],
    }).compile();

    controller = module.get<CompaniesCarriersController>(CompaniesCarriersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
