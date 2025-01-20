import { Module } from '@nestjs/common';
import { CookController } from './cook.controller';
import { CookService } from './cook.service';
import { EmbeddingService } from 'src/embedding/embedding.service';

@Module({
  controllers: [CookController],
  providers: [
    CookService,
    EmbeddingService,
    {
      provide: 'PREFIX',
      useValue: 'cook_embedding:'  // 你想要的前缀
    },
    {
      provide: 'INDEX_NAME',
      useValue: 'cook_embedding_index_384'  // 你想要的索引名
    },
  ],
})
export class CookModule {}
