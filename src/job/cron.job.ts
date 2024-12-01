import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private schedulerRegistry: SchedulerRegistry,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS, {
    name: 'fetchLatestNews'
  })
  async fetchLatestNews() {
    console.log('fetchLatestNews....');
    const job = this.schedulerRegistry.getCronJob('fetchLatestNews');
    job.stop();
    try {
      const vergeResult = await this.crawlerService.fetchLatestNewsFromTheVerge();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromTheVerge', result: vergeResult });

      const cnetResult = await this.crawlerService.fetchLatestNewsFromCNET();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromCNET', result: cnetResult });

      const arsTechnicaResult = await this.crawlerService.fetchLatestNewsFromArsTechnica();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromArsTechnica', result: arsTechnicaResult });

      const githubTrendingResult = await this.crawlerService.fetchLatestNewsFromGitHubTrending();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromGitHubTrending', result: githubTrendingResult });
    } catch (error) {
      console.error({ type: 'cron', msg: 'fetchLatestNews', error });
    } finally {
      job.start();
    }
  }
}
