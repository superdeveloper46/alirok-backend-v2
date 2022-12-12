import { Test, TestingModule } from '@nestjs/testing';
import { DropOffLocationsController } from './drop-off-locations.controller';

describe('DropOffLocationsController', () => {
  let controller: DropOffLocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DropOffLocationsController],
    }).compile();

    controller = module.get<DropOffLocationsController>(DropOffLocationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
