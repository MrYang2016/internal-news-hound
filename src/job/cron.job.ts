import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private schedulerRegistry: SchedulerRegistry,
  ) { }

  @Cron(CronExpression.EVERY_10_HOURS, {
    name: 'fetchLatestNews'
  })
  async fetchLatestNews() {
    console.log('fetchLatestNews....');
    const job = this.schedulerRegistry.getCronJob('fetchLatestNews');
    job.stop();
    try {
      const vergeResult = await this.crawlerService.fetchLatestNewsFromTheVerge();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromTheVerge', result: vergeResult });
    } catch (error) {
      console.error({ type: 'cron', msg: 'fetchLatestNews', error });
    } finally {
      job.start();
    }
  }
}
