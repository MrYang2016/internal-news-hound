import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News, NewsSource, Visit } from './crawler/crawler.entity';
import { TasksService } from './job/cron.job';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ProductSuggestionController } from './product-suggestion/product-suggestion.controller';
import { ProductSuggestionService } from './product-suggestion/product-suggestion.service';
import { CookModule } from './cook/cook.module';
import { CrawlerModule } from './crawler/crawler.module';
import { StockController } from './stock/stock.controller';
import { StockService } from './stock/stock.service';
import { JiJinEntity } from './stock/stock.entity';

const env = process.env.NODE_ENV;

console.log('env', env);

const dbConfig = {
  type: 'postgres' as const,
  host: process.env.SUPABASE_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.SUPABASE_DB_PORT || '54322'),
  username: process.env.SUPABASE_DB_USER || 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'postgres',
  database: process.env.SUPABASE_DB_NAME || 'postgres',
};

console.log('Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  username: dbConfig.username,
});

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      ...dbConfig,
      logging: false,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      synchronize: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在整个应用程序中可用
    }),
    CookModule,
    CrawlerModule,
    TypeOrmModule.forFeature([News, NewsSource, Visit, JiJinEntity]),
  ],
  controllers: [AppController, ProductSuggestionController, StockController],
  providers: [AppService, TasksService, ProductSuggestionService, StockService],
})
export class AppModule {}
