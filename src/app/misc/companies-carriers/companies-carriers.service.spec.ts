import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesCarriersService } from './companies-carriers.service';

describe('CompaniesCarriersService', () => {
  let service: CompaniesCarriersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompaniesCarriersService],
    }).compile();

    service = module.get<CompaniesCarriersService>(CompaniesCarriersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
