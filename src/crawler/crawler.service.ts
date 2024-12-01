import * as dotenv from 'dotenv';
dotenv.config();
import { Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News, NewsSource } from './crawler.entity';
import { getTranslateByText } from '../common/translate';
import { ONE_DAY } from '../common/utils';
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

  async fetchLatestNewsFromTheVerge() {
    const url = 'https://www.theverge.com';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('ol.relative > li').each((index, element) => {
      const title = $(element).find('h2 a').text().trim();
      const link = $(element).find('h2 a').attr('href');
      const summary = ''; // Assuming no summary is available in the provided structure
      const time = $(element).find('time').attr('datetime');
      const highlight = '';

      newsItems.push({ title, link, summary, time, highlight, source: { name: 'theverge' } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link)).map(async v => {
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

  // https://www.cnet.com/
  async fetchLatestNewsFromCNET() {
    const url = 'https://www.cnet.com';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);
  
    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);
  
    const newsItems = [];
  
    $('.c-storiesNeonLatest_content > a').each((index, element) => {
      const title = $(element).find('h3').text().trim();
      const link = $(element).attr('href');
      const summary = ''; // Assuming no summary is available in the provided structure
      const time = $(element).find('.c-storiesNeonLatest_meta').text().trim();
      const highlight = '';
  
      newsItems.push({ title, link, summary, time, highlight, source: { name: 'cnet' } });
    });
  
    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link)).map(async v => {
      const link = `${url}${v.link}`;
      v.link = link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      console.log(v.time);
      if (v.time) {
        const match = v.time.match(/^(?<timeNum>\d+)\s+(?<timeType>(minutes)|(hours)|(days))\s+ago$/);
        if (match) {
          v.time = new Date(Date.now() - parseInt(match.groups.timeNum) * (match.groups.timeType === 'minutes' ? 1 : match.groups.timeType === 'hours' ? 60 : (24 * 60)) * 60 * 1000);
          console.log(v.time);
        }
      }
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

  // https://arstechnica.com/
  async fetchLatestNewsFromArsTechnica() {
    const url = 'https://arstechnica.com';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('article').each((index, element) => {
      const title = $(element).find('h2 a').text().trim();
      const link = $(element).find('h2 a').attr('href');
      const summary = $(element).find('p').text().trim();
      const time = $(element).find('time').attr('datetime');
      const highlight = '';

      newsItems.push({ title, link, summary, time, highlight, source: { name: 'arstechnica' } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.time && v.link)).map(async v => {
      const link = v.link.startsWith('http') ? v.link : `${url}${v.link}`;
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
