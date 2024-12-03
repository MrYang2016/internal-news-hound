import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CrawlerService } from './crawler.service';
import { ApiOperation, ApiExtraModels } from '@nestjs/swagger';
import { ApiPortResult } from '../common/apiPortResult';
import { GetNewsDto, GetNewsResponseDto, AddSourceDto } from './crawler.dto';
import { EmbeddingService } from '../embedding/embedding.service';

@Controller('crawler')
@ApiExtraModels(GetNewsDto, GetNewsResponseDto)
export class CrawlerController {
  constructor(
    private readonly crawlerService: CrawlerService,
    private readonly embeddingService: EmbeddingService,
  ) { }

  @ApiOperation({ summary: '从数据库中获取新闻' })
  @Get('news')
  @ApiPortResult(GetNewsResponseDto)
  async getNews(@Query() query: GetNewsDto) {
    return this.crawlerService.getNews(query.size, query.page, query.sourceName);
  }

  // add source
  @ApiOperation({ summary: '添加新闻来源' })
  @Post('add-source')
  @ApiPortResult()
  async addSource(@Body() body: AddSourceDto) {
    return this.crawlerService.addSource(body);
  }

  // curl -X POST http://localhost:3000/crawler/add-source -H "Content-Type: application/json" -d '{"name": "globalnews", "website": "https://globalnews.ca/bc/latest/"}'

  @ApiOperation({ summary: '从本地新闻获取新闻' })
  @Get('local-news')
  @ApiPortResult()
  async getLocalNews() {
    return this.crawlerService.fetchLatestNewsFromACMTechNews();
  }

  // @ApiOperation({ summary: '将所有新闻设置为embedding' })
  // @Get('set-all-news-to-embedding')
  // @ApiPortResult()
  // async setAllNewsToEmbedding() {
  //   this.crawlerService.setAllNewsToEmbedding();
  //   return 'ok';
  // }

  // @Get('get-redis-json')
  // @ApiOperation({ summary: '从Redis中获取JSON数据' })
  // async getRedisJson(@Query('id') id: number) {
  //   return this.embeddingService.getRedisJson(id);
  // }

  // @Get('set-redis-json')
  // @ApiOperation({ summary: '从Redis中获取JSON数据' })
  // async setRedisJson(@Query('id') id: number, @Query('input') input: string) {
  //   return this.embeddingService.saveEmbeddingFromStr(input, parseInt(String(id)));
  // }

  // @Get('find-similar')
  // @ApiOperation({ summary: '查找相似新闻' })
  // async findSimilar(@Query('input') input: string) {
  //   return this.embeddingService.findClosestVector({ input, topK: 1 });
  // }
}
