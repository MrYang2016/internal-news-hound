import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { embedOne } from '../common/ai';
import { ONE_DAY, parseJson } from '../common/utils';

const indexName = 'embedding_index_384_2';

@Injectable()
export class EmbeddingService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
  ) {
    this.ensureEmbeddingIndex(); // 在构造函数中调用确保索引存在的方法
  }

  private async setRedisJson(options: { vector: number[], id: number, text: string }) {
    const { vector, id, text } = options;
    await this.redis.sendCommand(new Redis.Command('JSON.SET', [`embedding:${id}`, '$', JSON.stringify({ id, vector, text })]));
    await this.redis.pexpire(`embedding:${id}`, 3 * ONE_DAY); // Set expiration time to 3600 seconds (1 hour)
    return 'success';
  }

  async getRedisJson(id: number) {
    try {
      const result = await this.redis.sendCommand(new Redis.Command('JSON.GET', [`embedding:${id}`, '$'])) as Buffer;
      const jsonString = result.toString(); // Convert Buffer to string
      const parsedResult = parseJson(jsonString)?.[0]; // Parse JSON string to object
      return parsedResult.vector; // Return the vector
    } catch (error) {
      return null;
    }
  }

  async saveEmbeddingFromStr(input: string, id: number) {
    const existing = await this.getRedisJson(id);
    if (existing) {
      return existing;
    }
    const vector = await embedOne(input);
    await this.setRedisJson({ vector, id, text: input });
    return this.getRedisJson(id);
  }

  private async createEmbeddingIndex() {
    const createIndexCommand = new Redis.Command('FT.CREATE', [
      indexName, // 索引名称
      'ON', 'JSON', // 数据类型
      'PREFIX', '1', 'embedding:', // 数据前缀
      'SCHEMA',
      '$.vector', 'AS', 'vector', 'VECTOR', 'FLAT', '6', 'TYPE', 'FLOAT32', 'DIM', '384', 'DISTANCE_METRIC', 'COSINE'
    ]);

    await this.redis.sendCommand(createIndexCommand);
  }

  private async ensureEmbeddingIndex() {
    try {
      await this.redis.sendCommand(new Redis.Command('FT.INFO', [indexName]));
    } catch (error) {
      if (error.message.includes('Unknown index name')) {
        await this.createEmbeddingIndex();
      } else {
        throw error;
      }
    }
  }

  // New method to find the closest vector
  async findClosestVector(options: { input: string, topK: number }) {
    const { input, topK } = options;
    const vector = await embedOne(input);

    // Convert the vector to a string format that Redis can understand
    const vectorBuffer = Buffer.from(new Float32Array(vector).buffer);

    // FT.SEARCH books-idx "*=>[KNN 10 @title_embedding $query_vec AS title_score]" PARAMS 2 query_vec <"Planet Earth" embedding BLOB> SORTBY title_score DIALECT 2

    // Perform the KNN search using the FT.SEARCH command
    const searchCommand = new Redis.Command('FT.SEARCH', [
      indexName, // The name of the index
      `*=>[KNN ${topK} @vector $query_vector]`, // KNN search query
      'PARAMS', '2', 'query_vector', vectorBuffer, // Parameters for the query
      'DIALECT', '2' // Use dialect 2 for the query
    ]);

    try {
      const [totalResults, ...list] = await this.redis.sendCommand(searchCommand) as any[];
      const results = list.reduce((results, v, i) => {
        if (i % 2 === 0) {
          const key = v.toString(); // Convert buffer to string
          const fields = list[i + 1].map((field) => field.toString());
          let score = 0;
          let text = '';
          fields.forEach((field, i) => {
            if (field.startsWith('__vector_score')) {
              score = parseFloat(fields[i + 1]);
            } else if (field.startsWith('$')) {
              text = parseJson(fields[i + 1])?.text;
            }
          });
          results.push({ key, score, text });
        }
        return results;
      }, []);
      return { totalResults, results };
    } catch (error) {
      console.error('Error searching for closest vector:', error);
      return null;
    }
  }

  async hasSimilar(input: string) {
    const result = await this.findClosestVector({ input, topK: 1 });
    return result.results && result.results.length > 0 && result.results[0].score < 0.2;
  }
}
