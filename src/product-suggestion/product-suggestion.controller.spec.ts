import { Test, TestingModule } from '@nestjs/testing';
import { ProductSuggestionController } from './product-suggestion.controller';

describe('ProductSuggestionController', () => {
  let controller: ProductSuggestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductSuggestionController],
    }).compile();

    controller = module.get<ProductSuggestionController>(ProductSuggestionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
