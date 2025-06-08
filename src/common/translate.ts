import { deepseekCreateCompletionByJson } from './deepseek';

export async function getTranslateByText(options: {
  title: string;
  summary: string;
  language: string;
}) {
  const { language, title, summary } = options;

  const json = await deepseekCreateCompletionByJson({
    temperature: 1.3,
    messages: [
      {
        role: 'user',
        content: `Please translate the following news into ${language} and return the result as a JSON string. Ensure the translation is smooth, natural, and contextually appropriate. Avoid literal translations and ensure the text reads as if written by a native speaker:
            {
              "target_language": "${language}",
              "title": "${title}",
              "summary": "${summary}",
            }`,
      },
    ],
  });
  if (json) {
    return { language, title: json.title, summary: json.summary };
  }
  return null;
}
