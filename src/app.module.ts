import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News, NewsSource, Visit } from './crawler/crawler.entity';
import { TasksService } from './job/cron.job';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { ProductSuggestionController } from './product-suggestion/product-suggestion.controller';
import { ProductSuggestionService } from './product-suggestion/product-suggestion.service';
import { CookModule } from './cook/cook.module';
import { CrawlerModule } from './crawler/crawler.module';

const env = process.env.NODE_ENV;

console.log('env', env);

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: env === 'local' ? '' : (process.env.MYSQL_PASSWORD || ''),
      database: 'news_hound',
      charset: 'utf8mb4',
      dateStrings: true,
      logging: false,
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
      synchronize: true,
      extra: {
        connectionLimit: 10,  // 连接池的最大连接数
        waitForConnections: true,
        queueLimit: 0,
      }
    }),
    // Added News entity to imports
    RedisModule.forRoot({
      type: 'single',
      url: `redis://127.0.0.1:6379`,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在整个应用程序中可用
    }),
    CookModule,
    CrawlerModule,
    TypeOrmModule.forFeature([News, NewsSource, Visit]),
  ],
  controllers: [AppController, ProductSuggestionController],
  providers: [
    AppService,
    TasksService,
    ProductSuggestionService,
  ],
})
export class AppModule { }
