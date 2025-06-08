import * as dotenv from 'dotenv';
dotenv.config();
import OpenAI from 'openai';
import { Messages } from './aiChat.d';
import { parseJson } from './utils';

const parseJsonError = require('json-parse-better-errors');

let openai: OpenAI;

if (process.env.DEEPSEEK_API_KEY) {
  openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

export async function deepseekCreateCompletion(options: {
  messages: Messages[];
  temperature?: number;
}) {
  const { messages, temperature } = options;
  const completion = await openai.chat.completions.create({
    messages: messages.map((v) => ({
      role: v.role,
      content: v.content,
      name: '',
    })),
    model: 'deepseek-chat',
    temperature,
  });

  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content;
}

export async function deepseekCreateCompletionByJson(options: {
  messages: Messages[];
  temperature?: number;
}) {
  const { messages, temperature } = options;
  let aiResult = await deepseekCreateCompletion({
    messages,
    temperature,
  });
  let json = parseJson(aiResult);
  if (!json && aiResult) {
    // ```json
    // {
    //   "text": "这许可证交给你了吗？",
    //   "target_language": "Chinese"
    // }
    // ```

    const jsonStr = aiResult.match(/```json(?<jsonStr>[^`]+)```/);
    try {
      if (jsonStr && jsonStr.groups) {
        json = parseJsonError(jsonStr.groups.jsonStr);
      }
    } catch (error) {
      // 提取上面错误信息的位置
      const errorPosition = (error as any).message.match(
        /at position (?<position>\d+)/,
      );
      if (errorPosition && errorPosition.groups) {
        const position = parseInt(errorPosition.groups.position);
        if (!isNaN(position)) {
          // 在str的50的位置加"
          aiResult =
            aiResult.slice(0, position) + '"' + aiResult.slice(position);
        }
      }
    }
  }
  if (!json && aiResult) {
    // 获取{}内容
    const jsonStr = aiResult.match(/[^{}]*(?<jsonStr>\{[^{}]+\})[^{}]*/);
    if (jsonStr && jsonStr.groups) {
      json = parseJson(jsonStr.groups.jsonStr);
      if (!json) {
        const str = jsonStr.groups.jsonStr.replace(/,\s*}$/, '}');
        json = parseJson(str);
      }
    }
  }
  return json;
}
