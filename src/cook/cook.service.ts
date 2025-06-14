import { Injectable } from '@nestjs/common';
import { deepseekCreateCompletionByJson } from '../common/deepseek';
import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';
import { Cacheable, getCache } from '../common/methodCache';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { EmbeddingService } from '../embedding/embedding.service';

@Injectable()
export class CookService {
  constructor(
    @InjectRedis()
    private readonly redis: Redis,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async cook(name: string) {
    const aiResult = await deepseekCreateCompletionByJson({
      messages: [
        {
          role: 'user',
          content: `输入一个菜名，你帮忙输入这道菜的制作步骤和食材配料等：
- 菜名：${name}
- 输出json格式：
        {
            name: '...',
            ingredients: [
      { name: '...', amount: '...' },
      { name: '...', amount: '...' },
    ],
    steps: [
      {
        title: '...',
        description: '...',
        reason: '...'
      },
      {
        title: '...',
        description: '...',
        reason: '...'
      },
    ],
    tips: [
      '...',
      '...'
    ]
  }`,
        },
      ],
    });
    return aiResult;
  }

  async recommend(prompt: string) {
    const aiResult = await deepseekCreateCompletionByJson({
      messages: [
        {
          role: 'user',
          content: `根据下面的提示词，推荐一些适合吃的菜名
- 提示词：${prompt}
- 输出json格式：['...', '...', '...']`,
        },
      ],
    });
    return aiResult;
  }

  @Cacheable(365 * 60 * 60 * 24)
  async checkByInput(prompt: string) {
    console.log('prompt', prompt);
    const aiResult = await deepseekCreateCompletionByJson({
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `你是一个厨师，你负责根据用户的输入，判断出输入的是菜名还是菜谱，并根据判断结果输出相应的json格式`,
        },
        {
          role: 'user',
          content: `
- 提示词input：${prompt}
if (input是菜名) {
  - 根据input，输出菜谱
  - 输出json格式：
  {
      name: '...',
      description: '...',
      ingredients: [
        { name: '...', amount: '...' },
        { name: '...', amount: '...' },
      ],
      steps: [
        {
          title: '...',
          description: '...',
          reason: '...'
        },
        {
          title: '...',
          description: '...',
          reason: '...'
        },
      ],
      tips: [
        '...',
        '...'
      ]
  }
} else {
  - 根据input，推荐一些适合吃的菜名
  - 输出json格式：{
    recommend: [
      '...',
      '...',
      '...'
    ],
    reason: '...'
  }
}`,
        },
      ],
    });
    if (aiResult && aiResult.steps) {
      await this.embeddingService.saveEmbeddingFromStr(aiResult.name);
    }
    return aiResult;
  }

  async getCategory(prompt: string) {
    const aiResult = await this.checkByInput(prompt);
    if (aiResult && aiResult.steps) {
      const suggestions = await this.findByEmbedding(aiResult.name);
      aiResult.suggestions = suggestions;
    }
    return aiResult;
  }

  async getSitemap() {
    const cookCache = await getCache('checkByInput', this.redis);
    const links = cookCache
      .map(({ args, result, time }) => {
        const [prompt] = args;
        const { steps } = result;
        if (steps) {
          return {
            url: `/${prompt
              .replace(/[/\s]/g, '-')
              .replace(/[^\p{L}\p{N}-]/gu, '')
              .toLocaleLowerCase()}`,
            lastmod: new Date(time).toISOString(),
          };
        }
      })
      .filter((v) => !!v);
    // An array with your links
    links.push({
      url: '/',
      lastmod: new Date('2025-01-12 14:00:00').toISOString(),
    });

    // Create a stream to write to
    const stream = new SitemapStream({
      hostname: 'https://cook.aries-happy.com/',
    });

    // Return a promise that resolves with your XML string
    return streamToPromise(Readable.from(links).pipe(stream)).then((data) =>
      data.toString(),
    );
  }

  async findByEmbedding(input: string) {
    const list = await this.embeddingService.findClosestVector({
      input,
      topK: 10,
    });
    if (!list) {
      return [];
    }
    const result = (list.results as { text: string }[]).map(({ text }) => text);
    return Array.from(new Set(result)).filter((v) => v !== input);
  }
}
