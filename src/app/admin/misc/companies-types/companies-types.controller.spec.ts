import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CompaniesTypesController } from './companies-types.controller';
import { CompaniesTypesService } from './companies-types.service';

describe('CompaniesTypesController', () => {
  let controller: CompaniesTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesTypesController],
      providers: [PrismaService, CompaniesTypesService],
    }).compile();

    controller = module.get<CompaniesTypesController>(CompaniesTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
