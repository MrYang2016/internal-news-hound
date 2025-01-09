import { Test, TestingModule } from '@nestjs/testing';
import { CookController } from './cook.controller';

describe('CookController', () => {
  let controller: CookController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CookController],
    }).compile();

    controller = module.get<CookController>(CookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
