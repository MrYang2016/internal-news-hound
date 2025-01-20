import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { EmbeddingService } from 'src/embedding/embedding.service';
import { Visit } from './crawler.entity';
import { NewsSource } from './crawler.entity';
import { News } from './crawler.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([News, NewsSource, Visit]),
  ],
  controllers: [CrawlerController],
  providers: [
    CrawlerService,
    EmbeddingService,
    {
      provide: 'PREFIX',
      useValue: 'embedding:'  // 你想要的前缀
    },
    {
      provide: 'INDEX_NAME',
      useValue: 'embedding_index_384_2'  // 你想要的索引名
    },
  ],
  exports: [
    CrawlerService,
  ],
})
export class CrawlerModule {}
