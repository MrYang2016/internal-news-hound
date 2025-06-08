import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-73db5eb97fee4138ba21c6c582f56c0d',
});

// 定义可被调用的工具
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function' as const,
    function: {
      name: 'check_inventory',
      description: 'Check the inventory status of products',
      parameters: {
        type: 'object',
        properties: {
          product_id: {
            type: 'string',
            description: 'The ID of the product to check',
          },
          warehouse_id: {
            type: 'string',
            description: 'The ID of the warehouse to check',
            enum: ['WH001', 'WH002', 'WH003'],
          },
        },
        required: ['product_id'],
      },
    },
  },
];

async function main() {
  const completion = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content:
          '你是一个库存查询助手，可以通过调用check_inventory函数来查询产品库存。当用户询问库存时，你应该使用这个函数来获取数据。',
      },
      { role: 'user', content: '帮我查一下产品A123在WH001仓库的库存情况' },
    ],
    tools,
    tool_choice: 'auto',
  });

  const message = completion.choices[0].message;
  console.log('LLM Response:', JSON.stringify(message, null, 2));

  if (message.tool_calls && message.tool_calls.length > 0) {
    const toolCall = message.tool_calls[0];
    const { name, arguments: args } = toolCall.function;
    console.log(`模型请求调用函数: ${name}, 参数: ${args}`);

    // 模拟从数据库查询库存信息
    const { product_id, warehouse_id } = JSON.parse(args);
    const functionResponse = {
      product_id,
      warehouse_id,
      product_name: 'iPhone 15',
      quantity: 100,
      status: 'in_stock',
      last_updated: '2024-03-20T10:00:00Z',
    };

    // 再次与模型对话，传递函数调用结果
    const secondCompletion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            '你是一个库存查询助手，可以通过调用check_inventory函数来查询产品库存。当用户询问库存时，你应该使用这个函数来获取数据。',
        },
        { role: 'user', content: '帮我查一下产品A123在WH001仓库的库存情况' },
        message,
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResponse),
        },
      ],
      tools,
    });
    console.log(secondCompletion.choices[0].message.content);
  } else {
    console.log(message.content);
  }
}

main();
