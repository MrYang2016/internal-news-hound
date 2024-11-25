import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsSource } from './crawler.entity';
import { getTranslateByText } from '../common/translate';
import { HOURS, ONE_DAY } from '../common/utils';
import { AddSourceDto } from './crawler.dto';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { EmbeddingService } from '../embedding/embedding.service';
import { MoreThan } from 'typeorm';

const env = process.env.NODE_ENV;

@Injectable()
export class CrawlerService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepository: Repository<News>,
    @InjectRepository(NewsSource)
    private readonly newsSourceRepository: Repository<NewsSource>,
    private readonly embeddingService: EmbeddingService,
  ) { }

  async fetchLatestNews() {
    const url = 'https://globalnews.ca/bc/latest/';
    const response = await fetch(url);
    const data = await response.text();
    const $ = cheerio.load(data);

    const newsItems = [];

    $('.c-posts__item').each((index, element) => {
      const title = $(element).find('.c-posts__headlineText').text().trim();
      const link = $(element).find('a').attr('href');
      const summary = $(element).find('.c-posts__excerpt').text().trim();
      const time = $(element).find('.c-posts__info').text().trim();
      const highlight = $(element).find('.c-posts__info--highlight').text().trim();

      newsItems.push({ title, link, summary, time: time.replace(highlight, ''), highlight, source: { name: 'globalnews' } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!v.title && v.time.includes('hours')).map(async v => {
      const link = v.link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      const time = v.time.match(/(?<hours>\d+)\s+hours/);
      if (time && time.groups) {
        v.time = new Date(Date.now() - parseInt(time.groups.hours) * HOURS);
      }
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const translate = await getTranslateByText({ title: item.title, summary: item.summary, language: 'Chinese' });
      if (translate) {
        item.title = translate.title;
        item.summary = translate.summary;
      }
    }
    await this.newsRepository.save(result);
    return result;
  }

  async fetchLatestNewsFromCbc() {
    const url = 'https://www.cbc.ca/news/canada/british-columbia';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('.card').each((index, element) => {
      const title = $(element).find('.headline').text().trim();
      let link = $(element).find('a').attr('href');
      if (!link) {
        link = $(element).attr('href');
      }
      const summary = $(element).find('.description').text().trim() || '';
      const time = $(element).find('time').attr('datetime');
      const highlight = $(element).find('.highlight').text().trim() || '';

      newsItems.push({ title, link, summary, time, highlight, source: { name: 'cbc' } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link && v.link.indexOf('play/video') === -1)).map(async v => {
      const link = `${url}${v.link}`;
      v.link = link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      v.time = new Date(v.time);
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const translate = await getTranslateByText({ title: item.title, summary: item.summary || '', language: 'Chinese' });
      if (translate) {
        item.title = translate.title;
        item.summary = translate.summary;
      }
    }
    await this.newsRepository.save(result);
    return result;
  }

  async fetchLatestNewsFromLangleyAdvanceTimes() {
    const localNews = await this.fetchLatestNewsFromLangleyAdvanceTimesByType('local');
    const publicNews = await this.fetchLatestNewsFromLangleyAdvanceTimesByType('public');
    return [...localNews, ...publicNews];
  }

  // https://www.langleyadvancetimes.com/local-news
  async fetchLatestNewsFromLangleyAdvanceTimesByType(type: 'local' | 'public') {
    const url = type === 'local' ? 'https://www.langleyadvancetimes.com/local-news' : 'https://www.langleyadvancetimes.com/notices/municipal';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('#category-items a.media').each((index, element) => {
      const title = $(element).find('.media-heading').text().trim();
      const link = $(element).attr('href');
      const summary = $(element).find('.media-intro').text().trim();
      const time = $(element).find('time').attr('datetime');
      const highlight = '';

      newsItems.push({ title, link, summary, time, highlight, source: { name: `langleyadvancetimes ${type}` } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link)).map(async v => {
      const link = `https://www.langleyadvancetimes.com${v.link}`;
      v.link = link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      v.time = new Date(v.time);
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const translate = await getTranslateByText({ title: item.title, summary: item.summary || '', language: 'Chinese' });
      if (translate) {
        item.title = translate.title;
        item.summary = translate.summary;
      }
    }
    await this.newsRepository.save(result);
    return result;
  }

  async fetchLatestNewsFromTol() {
    const url = 'https://www.tol.ca/Modules/news/en';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('.blogItem').each((index, element) => {
      const title = $(element).find('.newsTitle').text().trim();
      const link = $(element).find('.newsTitle').attr('href');
      const summary1 = $(element).find('.blogItem-contentContainer p').eq(1).text().trim();
      const summary2 = $(element).find('.blogItem-contentContainer p').eq(2).text().trim();
      const summary = [summary1, summary2].join('\n');
      const time = $(element).find('.blogPostDate p').text().trim();
      const highlight = '';

      newsItems.push({ title, link, summary, time, highlight, source: { name: 'tol' } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link)).map(async v => {
      const link = v.link.startsWith('http') ? v.link : `https://www.tol.ca${v.link}`;
      v.link = link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      v.time = new Date(v.time);
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const translate = await getTranslateByText({ title: item.title, summary: item.summary || '', language: 'Chinese' });
      if (translate) {
        item.title = translate.title;
        item.summary = translate.summary;
      }
    }
    await this.newsRepository.save(result);
    return result;
  }

  async fetchLatestNewsFromLangleyCity(type: 'events' | 'news') {
    const url = `https://langleycity.ca/${type}`;
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('.views-row').each((index, element) => {
      const title = $(element).find('.views-field-title a').text().trim();
      const link = $(element).find('.views-field-title a').attr('href');
      const summary = $(element).find('.views-field-field-article-summary .field-content').text().trim();
      const time = $(element).find('.views-field-field-event-date time').attr('datetime');
      const highlight = '';

      newsItems.push({ title, link: `https://langleycity.ca${link}`, summary, time, highlight, source: { name: `langleycity ${type}` } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link)).map(async v => {
      const link = v.link.startsWith('http') ? v.link : `https://langleycity.ca${v.link}`;
      v.link = link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      v.time = new Date();
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);
    for (let i = 0; i < result.length; i++) {
      const item = result[i];
      const translate = await getTranslateByText({ title: item.title, summary: item.summary || '', language: 'Chinese' });
      if (translate) {
        item.title = translate.title;
        item.summary = translate.summary;
      }
    }
    await this.newsRepository.save(result);
    return result;
  }

  // 从数据库中获取新闻，分页
  async getNews(size: number, page: number, sourceName?: string) {
    const [news, total] = await this.newsRepository.findAndCount({
      select: {
        id: true,
        title: true,
        link: true,
        summary: true,
        time: true,
        highlight: true,
        source: { name: true, website: true },
      },
      take: size,
      skip: (page - 1) * size,
      relations: ['source'],
      order: {
        time: 'DESC',
      },
      where: sourceName && sourceName !== 'all' ? {
        source: { name: sourceName },
      } : undefined,
    });
    return { news, total };
  }

  private async checkNewsExists(options: { link: string, title: string, summary: string }) {
    const { link, title, summary } = options;
    const news = await this.newsRepository.exists({ where: { link } });
    if (news) {
      return false;
    }
    const similar = await this.embeddingService.hasSimilar(title + summary);
    if (similar) {
      return false;
    }
    return true;
  }

  // 添加新闻来源
  async addSource(source: AddSourceDto) {
    return this.newsSourceRepository.upsert(source, ['name']);
  }

  async setAllNewsToEmbedding() {
    const news = await this.newsRepository.find({
      // 前三天
      where: {
        time: MoreThan(new Date(Date.now() - 3 * ONE_DAY)),
      },
    });
    for (let i = 0; i < news.length; i++) {
      const item = news[i];
      await this.embeddingService.saveEmbeddingFromStr(item.title + item.summary, item.id);
      console.log(item.title + item.summary);
    }
  }
}
