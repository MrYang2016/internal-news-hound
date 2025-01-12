import { METHOD_CACHE_RECORD } from './redisStaticVal';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { parseJson } from './utils';
import { promisify } from 'util';
import { Transform, pipeline } from 'stream';
import stringify from 'json-stable-stringify';

const cacheMap = new Map<string, string>();

/**
 * 方法返回结果缓存修饰器
 * @param ttl 缓存时间
 * @returns 
 */
export const Cacheable = (ttl: number) => {
  const redisInjection = InjectRedis();
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    redisInjection(target, 'redis');

    const originalMethod = descriptor.value;
    const cacheKey = cacheMap.get(propertyKey);
    const preKey = cacheKey || propertyKey;

    descriptor.value = async function (...args: any[]) {
      const key = `${METHOD_CACHE_RECORD}_${preKey}`;
      const cacheKey = `${preKey}:${stringify(args)}`;
      // @ts-ignore
      // const keyInCache = await this.redis.sismember(key, cacheKey);
      // if (keyInCache === 1) {
      // @ts-ignore
      const cachedData = parseJson(await this.redis.get(cacheKey));
      if (cachedData) {
        return cachedData.result;
      }
      // }
      const result = await originalMethod.apply(this, args);
      // @ts-ignore
      await this.redis.pipeline()
        .set(cacheKey, JSON.stringify({ result }), 'EX', ttl)
        .sadd(key, cacheKey)
        .expire(key, ttl)
        .exec();
      return result;
    };

    return descriptor;
  };
};

/**
 * 方法缓存删除
 * @param optinos 
 * @returns 
 */
export async function delCache(optinos: { cacheKey: string, keyword?: string[], redis: Redis }) {
  const { redis, keyword } = optinos;
  const cacheKey = cacheMap.get(optinos.cacheKey) || optinos.cacheKey;
  const key = `${METHOD_CACHE_RECORD}_${cacheKey}`;
  return promisify(pipeline)(
    redis.sscanStream(key, { count: 200, match: keyword ? `*${keyword.join('*')}*` : '*' }),
    new Transform({
      objectMode: true,
      async transform(delKeys, enc, cb) {
        try {
          await redis.pipeline().del(...delKeys).srem(key, ...delKeys).exec();
        } catch (error) {
          console.error({ type: 'delCache', error, cacheKey, keyword });
        } finally {
          cb();
        }
      }
    })
  );
}

