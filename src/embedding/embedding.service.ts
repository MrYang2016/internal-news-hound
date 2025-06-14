import { Inject, Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { embedOne } from '../common/ai';
import { ONE_DAY, parseJson } from '../common/utils';
import { v1 as uuid } from 'uuid';

@Injectable()
export class EmbeddingService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    @Inject('PREFIX') private readonly prefix: string = 'embedding:',
    @Inject('INDEX_NAME')
    private readonly indexName: string = 'embedding_index_384_2',
  ) {
    this.ensureEmbeddingIndex(); // 在构造函数中调用确保索引存在的方法
  }

  private async setRedisJson(options: { vector: number[]; text: string }) {
    const { vector, text } = options;
    const id = uuid();
    await this.redis.sendCommand(
      new Redis.Command('JSON.SET', [
        `${this.prefix}${id}`,
        '$',
        JSON.stringify({ id, vector, text }),
      ]),
    );
    await this.redis.pexpire(`${this.prefix}${id}`, 3 * ONE_DAY); // Set expiration time to 3600 seconds (1 hour)
    return id;
  }

  async getRedisJson(id: string) {
    try {
      const result = (await this.redis.sendCommand(
        new Redis.Command('JSON.GET', [`${this.prefix}${id}`, '$']),
      )) as Buffer;
      const jsonString = result.toString(); // Convert Buffer to string
      const parsedResult = parseJson(jsonString)?.[0]; // Parse JSON string to object
      return parsedResult.vector; // Return the vector
    } catch (error) {
      return null;
    }
  }

  async saveEmbeddingFromStr(input: string) {
    const vector = await embedOne(input);
    const id = await this.setRedisJson({ vector, text: input });
    return this.getRedisJson(id);
  }

  private async createEmbeddingIndex() {
    const createIndexCommand = new Redis.Command('FT.CREATE', [
      this.indexName, // 索引名称
      'ON',
      'JSON', // 数据类型
      'PREFIX',
      '1',
      this.prefix, // 数据前缀
      'SCHEMA',
      '$.vector',
      'AS',
      'vector',
      'VECTOR',
      'FLAT',
      '6',
      'TYPE',
      'FLOAT32',
      'DIM',
      '384',
      'DISTANCE_METRIC',
      'COSINE',
    ]);

    await this.redis.sendCommand(createIndexCommand);
  }

  private async ensureEmbeddingIndex() {
    try {
      await this.redis.sendCommand(
        new Redis.Command('FT.INFO', [this.indexName]),
      );
    } catch (error) {
      if (error.message.includes('Unknown index name')) {
        await this.createEmbeddingIndex();
      } else {
        throw error;
      }
    }
  }

  // New method to find the closest vector
  async findClosestVector(options: { input: string; topK: number }) {
    const { input, topK } = options;
    const vector = await embedOne(input);

    // Convert the vector to a string format that Redis can understand
    const vectorBuffer = Buffer.from(new Float32Array(vector).buffer);

    // FT.SEARCH books-idx "*=>[KNN 10 @title_embedding $query_vec AS title_score]" PARAMS 2 query_vec <"Planet Earth" embedding BLOB> SORTBY title_score DIALECT 2

    // Perform the KNN search using the FT.SEARCH command
    const searchCommand = new Redis.Command('FT.SEARCH', [
      this.indexName, // The name of the index
      `*=>[KNN ${topK} @vector $query_vector]`, // KNN search query
      'PARAMS',
      '2',
      'query_vector',
      vectorBuffer, // Parameters for the query
      'DIALECT',
      '2', // Use dialect 2 for the query
    ]);

    try {
      const [totalResults, ...list] = (await this.redis.sendCommand(
        searchCommand,
      )) as any[];
      const results = list.reduce((results, v, i) => {
        if (i % 2 === 0) {
          const key = v.toString(); // Convert buffer to string
          const fields = list[i + 1].map((field: any) => field.toString());
          let score = 0;
          let text = '';
          fields.forEach((field: any, i: number) => {
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
    return (
      result &&
      result.results &&
      result.results.length > 0 &&
      result.results[0].score < 0.2
    );
  }
}
