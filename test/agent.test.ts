import 'dotenv/config';

import { createLlamaIndexTools } from '@agentic/llamaindex';
import { WeatherClient } from '@agentic/stdlib';
import { OpenAI, OpenAIAgent, FunctionTool } from 'llamaindex';

// Custom travel decision tool
const travelDecisionTool = new FunctionTool(
  async (args: { temperature: number }): Promise<boolean> => {
    console.log('temperature', args.temperature);
    return args.temperature < 24;
  },
  {
    name: 'shouldTravel',
    description: 'Decides whether to travel based on temperature',
    parameters: {
      type: 'object',
      properties: {
        temperature: {
          type: 'number',
          description: 'Current temperature in Celsius',
        },
      },
      required: ['temperature'],
    },
  },
);

async function main() {
  const weather = new WeatherClient();

  const tools = [...createLlamaIndexTools(weather), travelDecisionTool];

  const agent = new OpenAIAgent({
    llm: new OpenAI({
      baseURL: 'https://api.deepseek.com',
      model: 'deepseek-chat',
      temperature: 0,
    }),
    systemPrompt: 'You are a helpful assistant. Be as concise as possible.',
    tools,
  });

  const response = await agent.chat({
    message: 'Can I travel to Beijing?',
  });

  console.log(response.message.content);
}

main();
