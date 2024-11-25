import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private schedulerRegistry: SchedulerRegistry,
  ) { }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'fetchLatestNews'
  })
  async fetchLatestNews() {
    console.log('fetchLatestNews....');
    const job = this.schedulerRegistry.getCronJob('fetchLatestNews');
    job.stop();
    try {
      const result = await this.crawlerService.fetchLatestNews();
      console.log({ type: 'cron', msg: 'fetchLatestNews', result });

      let cbcResult = await this.crawlerService.fetchLatestNewsFromCbc();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromCbc', result: cbcResult });

      const langleyResult = await this.crawlerService.fetchLatestNewsFromLangleyAdvanceTimes();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromLangleyAdvanceTimes', result: langleyResult });

      const tolResult = await this.crawlerService.fetchLatestNewsFromTol();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromTol', result: tolResult });

      const langleyCityEventsResult = await this.crawlerService.fetchLatestNewsFromLangleyCity('events');
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromLangleyCityEvents', result: langleyCityEventsResult });

      const langleyCityNewsResult = await this.crawlerService.fetchLatestNewsFromLangleyCity('news');
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromLangleyCityNews', result: langleyCityNewsResult });
    } catch (error) {
      console.error({ type: 'cron', msg: 'fetchLatestNews', error });
    } finally {
      job.start();
    }
  }
}
