import { Test, TestingModule } from '@nestjs/testing';
import { DocumentHelperService } from './document-helper.service';

describe('DocumentHelperService', () => {
  let service: DocumentHelperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentHelperService],
    }).compile();

    service = module.get<DocumentHelperService>(DocumentHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
