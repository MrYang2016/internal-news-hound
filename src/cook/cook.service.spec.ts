import { Test, TestingModule } from '@nestjs/testing';
import { CookService } from './cook.service';

describe('CookService', () => {
  let service: CookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookService],
    }).compile();

    service = module.get<CookService>(CookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
