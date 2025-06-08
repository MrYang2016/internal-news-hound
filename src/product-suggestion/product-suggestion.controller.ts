import { Controller, Get, Query } from '@nestjs/common';
import { ProductSuggestionService } from './product-suggestion.service';

@Controller('product-suggestion')
export class ProductSuggestionController {
  constructor(
    private readonly productSuggestionService: ProductSuggestionService,
  ) {}

  @Get('suggest')
  async suggestProducts(@Query('idea') idea: string) {
    return this.productSuggestionService.suggestProducts(idea);
  }
}
