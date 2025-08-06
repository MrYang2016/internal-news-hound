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
  ) {}

  /**
   * 检查当前是否在北京时间 00:30-08:30 期间
   * @returns {boolean} 是否在允许的时间范围内
   */
  private isWithinAllowedTimeRange(): boolean {
    // 获取北京时间
    const beijingTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }),
    );
    const hours = beijingTime.getHours();
    const minutes = beijingTime.getMinutes();

    // 转换为分钟数便于比较
    const currentTimeInMinutes = hours * 60 + minutes;
    const startTimeInMinutes = 0 * 60 + 30; // 00:30
    const endTimeInMinutes = 8 * 60 + 30; // 08:30

    return (
      currentTimeInMinutes >= startTimeInMinutes &&
      currentTimeInMinutes <= endTimeInMinutes
    );
  }

  @Cron(CronExpression.EVERY_2_HOURS, {
    name: 'fetchLatestNews',
  })
  async fetchLatestNews() {
    console.log('fetchLatestNews....');

    // 检查是否在允许的时间范围内
    if (!this.isWithinAllowedTimeRange()) {
      console.log(
        'fetchLatestNews: 当前时间不在允许范围内 (北京时间 00:30-08:30)，跳过执行',
      );
      return;
    }

    const job = this.schedulerRegistry.getCronJob('fetchLatestNews');
    job.stop();
    try {
      const vergeResult =
        await this.crawlerService.fetchLatestNewsFromTheVerge();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromTheVerge',
        result: vergeResult,
      });

      // const cnetResult = await this.crawlerService.fetchLatestNewsFromCNET();
      // console.log({ type: 'cron', msg: 'fetchLatestNewsFromCNET', result: cnetResult });

      const arsTechnicaResult =
        await this.crawlerService.fetchLatestNewsFromArsTechnica();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromArsTechnica',
        result: arsTechnicaResult,
      });

      const githubTrendingResult =
        await this.crawlerService.fetchLatestNewsFromGitHubTrending();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromGitHubTrending',
        result: githubTrendingResult,
      });

      const techRadarResult =
        await this.crawlerService.fetchLatestNewsFromTechRadar();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromTechRadar',
        result: techRadarResult,
      });

      // const xdaDevelopersResult = await this.crawlerService.fetchLatestNewsFromXdaDevelopers();
      // console.log({ type: 'cron', msg: 'fetchLatestNewsFromXdaDevelopers', result: xdaDevelopersResult });

      const acmTechNewsResult =
        await this.crawlerService.fetchLatestNewsFromACMTechNews();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromACMTechNews',
        result: acmTechNewsResult,
      });

      const javaScriptWeeklyResult =
        await this.crawlerService.fetchLatestNewsFromJavaScriptWeekly();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromJavaScriptWeekly',
        result: javaScriptWeeklyResult,
      });

      const productHuntResult =
        await this.crawlerService.fetchLatestNewsFromProductHunt();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromProductHunt',
        result: productHuntResult,
      });

      const globalNewsResult =
        await this.crawlerService.fetchLatestNewsFromHackerNews();
      console.log({
        type: 'cron',
        msg: 'fetchLatestNewsFromGlobalNews',
        result: globalNewsResult,
      });

      // 删除一个月前的数据
      await this.newsRepository.delete({
        time: LessThan(new Date(Date.now() - ONE_MONTH)),
      });
    } catch (error) {
      console.error({ type: 'cron', msg: 'fetchLatestNews', error });
    } finally {
      job.start();
    }
  }
}
