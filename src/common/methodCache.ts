import { METHOD_CACHE_RECORD } from './redisStaticVal';
import { ICache, memoryCache } from './memoryCache';
import { parseJson } from './utils';
import stringify from 'json-stable-stringify';

const cacheMap = new Map<string, string>();

cacheMap.set('getFundList', 'getFundList_1');

export async function getCache(propertyKey: string, cache: ICache = memoryCache) {
  const preKey = cacheMap.get(propertyKey) || propertyKey;
  const key = `${METHOD_CACHE_RECORD}_${preKey}`;
  const cacheData = await cache.hgetall(key);
  return Object.entries(cacheData).map(([key, value]) => {
    const args = parseJson(key) as any[];
    const { result, time } = parseJson(value) as { result: any; time: number };
    return { args, result, time };
  });
}

/**
 * 方法返回结果缓存修饰器
 * @param ttl 缓存时间
 * @returns
 */
export const Cacheable = (ttl: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const cacheKey = cacheMap.get(propertyKey);
    const preKey = cacheKey || propertyKey;

    descriptor.value = async function (...args: any[]) {
      const key = `${METHOD_CACHE_RECORD}_${preKey}`;
      const cacheKeyStr = `${stringify(args)}`;
      
      const cachedData = parseJson(await memoryCache.hget(key, cacheKeyStr));
      if (cachedData) {
        return cachedData.result;
      }
      
      const result = await originalMethod.apply(this, args);
      
      const pipeline = await memoryCache.pipeline();
      await pipeline
        .hset(key, cacheKeyStr, JSON.stringify({ result, time: Date.now() }))
        .expire(key, ttl)
        .exec();
      
      return result;
    };

    return descriptor;
  };
};

/**
 * 方法缓存删除
 * @param options
 * @returns
 */
export async function delCache(options: {
  cacheKey: string;
  keyword?: string[];
  cache?: ICache;
}) {
  const { cache = memoryCache, keyword } = options;
  const cacheKey = cacheMap.get(options.cacheKey) || options.cacheKey;
  const key = `${METHOD_CACHE_RECORD}_${cacheKey}`;
  
  // Get all cache entries
  const cacheData = await cache.hgetall(key);
  const entries = Object.keys(cacheData);
  
  // Filter by keyword if provided
  const keysToDelete = keyword 
    ? entries.filter(k => keyword.some(kw => k.includes(kw)))
    : entries;
  
  if (keysToDelete.length > 0) {
    await cache.hdel(key, ...keysToDelete);
  }
}
