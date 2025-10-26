import { Module } from '@nestjs/common';
import { CookController } from './cook.controller';
import { CookService } from './cook.service';

@Module({
  controllers: [CookController],
  providers: [
    CookService,
  ],
})
export class CookModule {}
