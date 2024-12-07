import { Test, TestingModule } from '@nestjs/testing';
import { ProductSuggestionService } from './product-suggestion.service';

describe('ProductSuggestionService', () => {
  let service: ProductSuggestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductSuggestionService],
    }).compile();

    service = module.get<ProductSuggestionService>(ProductSuggestionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
