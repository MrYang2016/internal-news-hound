import { Injectable } from '@nestjs/common';
import { deepseekCreateCompletionByJson } from '../common/deepseek';

@Injectable()
export class ProductSuggestionService {
  //   XYZ 假设
  // 广泛假设: 预计目标市场中有10%的用户会使用这个产品或服务

  // 具体假设: 在核心用户群中有3%的早期采用者会立即使用这个产品或服务

  // 预型方案
  // 创建最小可行产品(MVP)来验证想法

  // 制作产品/服务的简单原型
  // 找到10-20个目标用户进行测试
  // 收集使用数据和反馈
  // 根据反馈快速迭代改进
  async suggestProducts(idea: string) {
    const aiResult = await deepseekCreateCompletionByJson({
      messages: [
        {
          role: 'user',
          content: `当我有一个产品想法时，为了验证这个想法市场会不会买单，我会做一些预型，收集YODA来证明这个想法是否可行。预型可能没有完全实现产品。
假门预型例子：
{
  "idea": "我想开一家书店",
  "hypothesis": {
    "broad": "整个城市会有10%的人经过书店时会停下来",
    "narrow": "在书店附近居住的人中会有3%的人会立即使用这个产品"
  },
  "prototype": {
    "description": "制作一个假门，让别人以为是书店",
    "steps": [
      "制作一个假门，让别人以为是书店",
      "在假门上贴上书店的logo",
      "在假门上贴上书店的广告",
      "在假门上贴上书店的地址",
      "在假门上贴上书店的电话"
    ]
  }
}
上面只是一种预型方案，还有很多预型方案，比如把假书放到一些商店卖，看看有多少人买。请给出你的预型方案。
输出json格式：
{
  "idea": "${idea}",
  "hypothesis": {
    "broad": "...",
    "narrow": "..."
  },
  "prototype": {
    "description": "...",
    "steps": [
      "...",
      "...",
      "...",
      "..."
    ]
  }
}`,
        },
      ],
    });
    return aiResult;
  }
}
