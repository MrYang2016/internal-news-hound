import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry, CronExpression } from '@nestjs/schedule';
import { CrawlerService } from '../crawler/crawler.service';
import { InjectRepository } from '@nestjs/typeorm';
import { News } from '../crawler/crawler.entity';
import { Repository, LessThan } from 'typeorm';
import { ONE_MONTH } from '../common/utils';

@Injectable()
export class TasksService {
  constructor(
    private readonly crawlerService: CrawlerService,
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
  ) { }

  @Cron(CronExpression.EVERY_2_HOURS, {
    name: 'fetchLatestNews'
  })
  async fetchLatestNews() {
    console.log('fetchLatestNews....');
    const job = this.schedulerRegistry.getCronJob('fetchLatestNews');
    job.stop();
    try {
      const vergeResult = await this.crawlerService.fetchLatestNewsFromTheVerge();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromTheVerge', result: vergeResult });

      // const cnetResult = await this.crawlerService.fetchLatestNewsFromCNET();
      // console.log({ type: 'cron', msg: 'fetchLatestNewsFromCNET', result: cnetResult });

      const arsTechnicaResult = await this.crawlerService.fetchLatestNewsFromArsTechnica();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromArsTechnica', result: arsTechnicaResult });

      const githubTrendingResult = await this.crawlerService.fetchLatestNewsFromGitHubTrending();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromGitHubTrending', result: githubTrendingResult });

      const techRadarResult = await this.crawlerService.fetchLatestNewsFromTechRadar();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromTechRadar', result: techRadarResult });

      // const xdaDevelopersResult = await this.crawlerService.fetchLatestNewsFromXdaDevelopers();
      // console.log({ type: 'cron', msg: 'fetchLatestNewsFromXdaDevelopers', result: xdaDevelopersResult });

      const acmTechNewsResult = await this.crawlerService.fetchLatestNewsFromACMTechNews();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromACMTechNews', result: acmTechNewsResult });

      const javaScriptWeeklyResult = await this.crawlerService.fetchLatestNewsFromJavaScriptWeekly();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromJavaScriptWeekly', result: javaScriptWeeklyResult });

      const productHuntResult = await this.crawlerService.fetchLatestNewsFromProductHunt();
      console.log({ type: 'cron', msg: 'fetchLatestNewsFromProductHunt', result: productHuntResult });

      // 删除一个月前的数据
      await this.newsRepository.delete({
        time: LessThan(new Date(Date.now() - ONE_MONTH))
      });

    } catch (error) {
      console.error({ type: 'cron', msg: 'fetchLatestNews', error });
    } finally {
      job.start();
    }
  }
}
