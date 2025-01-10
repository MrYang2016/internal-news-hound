import { Controller, Get, Query } from '@nestjs/common';
import { CookService } from './cook.service';

@Controller('cook')
export class CookController {
  constructor(private readonly cookService: CookService) {}

  @Get('check')
  async checkCook(@Query('name') name: string) {
    return this.cookService.cook(name);
  }

  // 根据提示词推荐菜
  @Get('recommend')
  async recommendCook(@Query('prompt') prompt: string) {
    return this.cookService.recommend(prompt);
  }

  @Get('check-by-input')
  async checkByInput(@Query('input') input: string) {
    return this.cookService.checkByInput(input);
  }
}
