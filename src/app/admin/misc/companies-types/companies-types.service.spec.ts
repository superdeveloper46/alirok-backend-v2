import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CompaniesTypesService } from './companies-types.service';

describe('CompaniesTypesService', () => {
  let service: CompaniesTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, CompaniesTypesService],
    }).compile();

    service = module.get<CompaniesTypesService>(CompaniesTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
