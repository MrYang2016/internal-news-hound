import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { Visit } from './crawler.entity';
import { NewsSource } from './crawler.entity';
import { News } from './crawler.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([News, NewsSource, Visit])],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
  ],
  exports: [CrawlerService],
})
export class CrawlerModule {}
