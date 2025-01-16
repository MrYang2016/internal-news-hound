import { Controller, Get, Query, Res } from '@nestjs/common';
import { CookService } from './cook.service';
import { ApiPortResult } from 'src/common/apiPortResult';
import { ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

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

  @ApiOperation({ summary: '从sitemap中获取新闻' })
  @Get('sitemap.xml')
  @ApiPortResult()
  async getSitemapNews(@Res() res: Response) {
    const xmlData = await this.cookService.getSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xmlData);
  }
}
