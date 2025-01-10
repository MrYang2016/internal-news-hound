import { Injectable } from '@nestjs/common';
import { deepseekCreateCompletionByJson } from '../common/deepseek';

@Injectable()
export class CookService {
  async cook(name: string) {
    const aiResult = await deepseekCreateCompletionByJson({
      messages: [{
        role: 'user', content: `输入一个菜名，你帮忙输入这道菜的制作步骤和食材配料等：
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
  }` }],
    });
    return aiResult;
  }

  async recommend(prompt: string) {
    const aiResult = await deepseekCreateCompletionByJson({
      messages: [{
        role: 'user', content: `根据下面的提示词，推荐一些适合吃的菜名
- 提示词：${prompt}
- 输出json格式：['...', '...', '...']` }],
    });
    return aiResult;
  }

  async checkByInput(prompt: string) {
    console.log('prompt', prompt);
    const aiResult = await deepseekCreateCompletionByJson({
      messages: [{
        role: 'system', content: `你是一个厨师，你负责根据用户的输入，判断出输入的是菜名还是菜谱，并根据判断结果输出相应的json格式`
      }, {
        role: 'user', content: `
- 提示词input：${prompt}
if (input是菜名) {
  - 根据input，输出菜谱
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
}` }],
    });
    return aiResult;
  }
}
