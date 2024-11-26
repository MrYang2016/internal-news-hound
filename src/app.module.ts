import * as dotenv from 'dotenv';
dotenv.config();
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrawlerService } from './crawler/crawler.service';
import { CrawlerController } from './crawler/crawler.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News, NewsSource } from './crawler/crawler.entity';
import { TasksService } from './job/cron.job';
import { ScheduleModule } from '@nestjs/schedule';
import { EmbeddingService } from './embedding/embedding.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';

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
      logging: true,
      entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
      migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([News, NewsSource]), // Added News entity to imports
    RedisModule.forRoot({
      type: 'single',
      url: `redis://127.0.0.1:6379`,
    }),
    ConfigModule.forRoot({
      isGlobal: true, // 使配置在整个应用程序中可用
    }),
  ],
  controllers: [AppController, CrawlerController],
  providers: [AppService, CrawlerService, TasksService, EmbeddingService],
})
export class AppModule { }
