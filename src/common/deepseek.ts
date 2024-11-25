
import OpenAI from "openai";
import { Messages } from "./aiChat.d";

let openai: OpenAI;

if (process.env.DEEPSEEK_API_KEY) {
  openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY,
  });
}

setInterval(() => {
  console.log('DEEPSEEK_API_KEY', process.env.DEEPSEEK_API_KEY);
}, 1000);

export async function deepseekCreateCompletion(options: {
  messages: Messages[],
}) {
  const { messages } = options;
  const completion = await openai.chat.completions.create({
    messages: messages.map(v => ({ role: v.role, content: v.content, name: '' })),
    model: "deepseek-chat",
  });

  console.log(completion.choices[0].message.content);
  return completion.choices[0].message.content;
}
