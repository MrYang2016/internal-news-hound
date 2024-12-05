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
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';

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

    await this.translateNews(result);
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
      if (v.time) {
        const match = v.time.match(/^(?<timeNum>\d+)\s+(?<timeType>(minutes)|(hours)|(days))\s+ago$/);
        if (match) {
          v.time = new Date(Date.now() - parseInt(match.groups.timeNum) * (match.groups.timeType === 'minutes' ? 1 : match.groups.timeType === 'hours' ? 60 : (24 * 60)) * 60 * 1000);
        }
      }
      if (!(v.time instanceof Date)) {
        v.time = new Date();
      }
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);

    await this.translateNews(result);
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

    let titleMap = new Map<string, boolean>();

    $('article').each((index, element) => {
      const title = $(element).find('h2 a').text().trim();
      const link = $(element).find('h2 a').attr('href');
      const summary = $(element).find('p').text().trim();
      const time = $(element).find('time').attr('datetime');
      const highlight = '';

      if (titleMap.has(title)) {
        return;
      }
      titleMap.set(title, true);
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

    await this.translateNews(result);
    await this.newsRepository.save(result);
    return result;
  }

  // https://github.com/trending
  async fetchLatestNewsFromGitHubTrending() {
    const url = 'https://github.com/trending';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const trendingRepos = [];

    $('.Box-row').each((index, element) => {
      const title = $(element).find('h2 a').text().trim();
      const link = $(element).find('h2 a').attr('href');
      const description = $(element).find('p').text().trim();

      trendingRepos.push({
        title,
        link: `https://github.com${link}`,
        summary: description,
        time: new Date(),
        source: { name: 'GitHub Trending' }
      });
    });

    // Process and save the trending repositories
    const result = (await Promise.all(trendingRepos.map(async repo => {
      const exist = await this.checkNewsExists({
        link: repo.link, title: repo.title, summary: repo.summary, updateTime: false
      });
      if (!exist) {
        return null;
      }
      await this.embeddingService.saveEmbeddingFromStr(repo.title + repo.summary, repo.id);
      return repo;
    }))).filter(repo => !!repo);

    await this.translateNews(result);
    await this.newsRepository.save(result);
    return result;
  }

  // https://www.techradar.com/
  async fetchLatestNewsFromTechRadar() {
    const url = 'https://www.techradar.com';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('.wcl-item').each((index, element) => {
      const title = $(element).find('.wcl-item-title').text().trim();
      const link = $(element).find('a').attr('href');
      const summary = ''; // Assuming no summary is available in the provided structure
      const time = new Date(); // Assuming current time as no time is available
      const highlight = '';

      newsItems.push({ title, link, summary, time, highlight, source: { name: 'techradar' } });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.link)).map(async v => {
      const link = v.link.startsWith('http') ? v.link : `${url}${v.link}`;
      v.link = link;
      const exist = await this.checkNewsExists({ link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);

    await this.translateNews(result);
    await this.newsRepository.save(result);
    return result;
  }

  // https://www.xda-developers.com/news/
  async fetchLatestNewsFromXdaDevelopers() {
    const url = 'https://www.xda-developers.com/news/';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    $('.display-card').each((index, element) => {
      const title = $(element).find('.display-card-title a').text().trim();
      const link = $(element).find('.display-card-title a').attr('href');
      const summary = $(element).find('.display-card-excerpt').text().trim();
      const time = new Date($(element).find('.article-date time').attr('datetime'));

      newsItems.push({
        title,
        link: link.startsWith('http') ? link : `https://www.xda-developers.com${link}`,
        summary,
        time,
        source: { name: 'XDA' }
      });
    });

    const result = (await Promise.all(newsItems.map(async item => {
      const exist = await this.checkNewsExists({
        link: item.link, title: item.title, summary: item.summary
      });
      if (!exist) {
        return null;
      }
      await this.embeddingService.saveEmbeddingFromStr(item.title + item.summary, item.id);
      return item;
    }))).filter(item => !!item);

    await this.translateNews(result);
    await this.newsRepository.save(result);
    return result;
  }

  // https://technews.acm.org/
  async fetchLatestNewsFromACMTechNews() {
    const url = 'https://technews.acm.org';
    const proxy = 'http://127.0.0.1:1087'; // Shadowsocks 代理地址
    const agent = new HttpsProxyAgent(proxy);

    const response = await axios.get(url, env === 'local' ? { httpsAgent: agent } : {});
    const data = response.data;
    const $ = cheerio.load(data);

    const newsItems = [];

    // Assuming the structure of the ACM TechNews page based on the provided HTML snippet
    $('tr .mobilePadding').each((index, element) => {
      const $title = $(element).find('b');
      const title = $title.text().trim();
      const link = $title.parent().attr('href');
      const $summary = $(element).find('span').eq(1);
      const summary = $summary.text().trim();
      // 最后一个元素
      const $time = $(element).find('span').last();
      if (!$time.text().trim()) {
        return;
      }
      // ; Justina Lee; David Ramli (November 25, 2024)
      const time = new Date($time.text().trim().match(/\((.+)\)/)[1]);
      const highlight = '';

      if (!link || !title) {
        return;
      }

      newsItems.push({
        title,
        link: link.startsWith('http') ? link : `${url}${link}`,
        summary,
        time,
        highlight,
        source: { name: 'ACM TechNews' }
      });
    });

    const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.link)).map(async v => {
      const exist = await this.checkNewsExists({ link: v.link, title: v.title, summary: v.summary });
      if (!exist) {
        return null;
      }
      await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
      return v;
    }))).filter(v => !!v);

    await this.translateNews(result);
    await this.newsRepository.save(result);
    return result;
  }

  // https://cprss.s3.amazonaws.com/javascriptweekly.com.xml
  async fetchLatestNewsFromJavaScriptWeekly() {
    const url = 'https://cprss.s3.amazonaws.com/javascriptweekly.com.xml';

    try {
      const response = await axios.get(url);
      const xmlData = response.data;

      // Parse the XML data
      const xmlParser = new XMLParser();
      const xmlResult = xmlParser.parse(xmlData);

      // return xmlResult.rss.channel.item[0].description;

      const $ = cheerio.load(`<div>${xmlResult.rss.channel.item[0].description}</div>`);

      // Initialize an array to hold the news items
      const newsItems = [];

      const time = new Date(xmlResult.rss.channel.item[0].pubDate) || new Date();
      $('table').each((index, element) => {
        const title = $(element).find('a').first().text().trim();
        const link = $(element).find('a').first().attr('href')?.replace('/rss', '/web');
        const summary = $(element).find('p').first().text().trim();

        if (title && link && title !== 'Read on the Web') {
          newsItems.push({
            title,
            link,
            summary,
            time,
            source: { name: 'JavaScript Weekly' }
          });
        }
      });

      const result = (await Promise.all(newsItems.filter(v => !!(v.title && v.link)).map(async v => {
        const exist = await this.checkNewsExists({ link: v.link, title: v.title, summary: v.summary });
        if (!exist) {
          return null;
        }
        await this.embeddingService.saveEmbeddingFromStr(v.title + v.summary, v.id);
        return v;
      }))).filter(v => !!v);
  
      await this.translateNews(result);
      await this.newsRepository.save(result);

      return result;
    } catch (error) {
      console.error('Error fetching or parsing XML:', error);
      throw error;
    }
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

  private async checkNewsExists(options: { link: string, title: string, summary: string, updateTime?: boolean }) {
    const { link, title, summary, updateTime = false } = options;
    const news = await this.newsRepository.exists({ where: { link } });
    if (news) {
      if (updateTime) {
        this.newsRepository.update({ link }, { time: new Date() });
      }
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
    }
  }

  private async translateNews(news: News[]) {
    for (let i = 0; i < news.length; i++) {
      const item = news[i];
      const translate = await getTranslateByText({ title: item.title, summary: item.summary || '', language: 'Chinese' });
      if (translate) {
        item.title = translate.title;
        item.summary = translate.summary;
      }
    }
  }
}
