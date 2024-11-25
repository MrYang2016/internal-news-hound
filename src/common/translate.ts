import { parseJson } from './utils';
const parseJsonError = require('json-parse-better-errors');
import { deepseekCreateCompletion } from './deepseek';

export async function getTranslateByText(options: {
  title: string, summary: string, language: string,
}) {
  const { language, title, summary } = options;

  let aiResult = await deepseekCreateCompletion({
    messages: [
      {
        role: 'user',
        content: `Please translate the following news into ${language} and return the result as a JSON string. Ensure the translation is smooth, natural, and contextually appropriate. Avoid literal translations and ensure the text reads as if written by a native speaker:
            {
              "target_language": "${language}",
              "title": "${title}",
              "summary": "${summary}",
            }`
      }
    ],
  });
  console.log({ aiResult });
  let json = parseJson(aiResult);
  if (!json) {
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
      const errorPosition = (error as any).message.match(/at position (?<position>\d+)/);
      if (errorPosition && errorPosition.groups) {
        const position = parseInt(errorPosition.groups.position);
        if (!isNaN(position)) {
          // 在str的50的位置加"
          aiResult = aiResult.slice(0, position) + '"' + aiResult.slice(position);
        }
      }
    }
  }
  if (!json) {
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
  if (json) {
    return { language, title: json.title, summary: json.summary };
  }
  return null;
}
