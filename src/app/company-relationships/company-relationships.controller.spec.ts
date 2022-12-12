import { Test, TestingModule } from '@nestjs/testing';
import { CompanyRelationshipsController } from './company-relationships.controller';

describe('CompanyRelationshipsController', () => {
  let controller: CompanyRelationshipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyRelationshipsController],
    }).compile();

    controller = module.get<CompanyRelationshipsController>(CompanyRelationshipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
