import { Test, TestingModule } from '@nestjs/testing';
import { CompanyRelationshipsService } from './company-relationships.service';

describe('CompanyRelationshipsService', () => {
  let service: CompanyRelationshipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyRelationshipsService],
    }).compile();

    service = module.get<CompanyRelationshipsService>(
      CompanyRelationshipsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
