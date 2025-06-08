import { Controller, Get, Query } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('fund-performance')
  async getFundPerformance(@Query('fundCode') fundCode: string) {
    return this.stockService.fetchFundPerformance(fundCode);
  }

  @Get('fund-list')
  async getFundList(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.stockService.getFundList(page, pageSize);
  }
}
