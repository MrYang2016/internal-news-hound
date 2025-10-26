import { parseJson } from './utils';
import stringify from 'json-stable-stringify';

interface CacheEntry {
  result: any;
  time: number;
}

class MemoryCache {
  private cache: Map<string, Map<string, CacheEntry>> = new Map();
  private expirations: Map<string, number> = new Map();

  private cleanup(key: string) {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.cache.delete(key);
      this.expirations.delete(key);
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    this.cleanup(key);
    const hash = this.cache.get(key);
    if (!hash) {
      return {};
    }
    
    const result: Record<string, string> = {};
    for (const [field, value] of hash.entries()) {
      result[field] = JSON.stringify(value);
    }
    return result;
  }

  async hget(key: string, field: string): Promise<string | null> {
    this.cleanup(key);
    const hash = this.cache.get(key);
    if (!hash) {
      return null;
    }
    
    const entry = hash.get(field);
    return entry ? JSON.stringify(entry) : null;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    let hash = this.cache.get(key);
    if (!hash) {
      hash = new Map();
      this.cache.set(key, hash);
    }
    
    const parsed = parseJson(value) as CacheEntry;
    hash.set(field, parsed);
  }

  async expire(key: string, seconds: number): Promise<void> {
    this.expirations.set(key, Date.now() + seconds * 1000);
  }

  async hdel(key: string, ...fields: string[]): Promise<void> {
    const hash = this.cache.get(key);
    if (hash) {
      for (const field of fields) {
        hash.delete(field);
      }
    }
  }

  async pipeline(): Promise<{
    hset: (key: string, field: string, value: string) => any;
    expire: (key: string, seconds: number) => any;
    exec: () => Promise<void>;
  }> {
    const commands: Array<{ method: string; args: any[] }> = [];
    
    return {
      hset: (key: string, field: string, value: string) => {
        commands.push({ method: 'hset', args: [key, field, value] });
        return this;
      },
      expire: (key: string, seconds: number) => {
        commands.push({ method: 'expire', args: [key, seconds] });
        return this;
      },
      exec: async () => {
        for (const cmd of commands) {
          if (cmd.method === 'hset') {
            await this.hset(cmd.args[0], cmd.args[1], cmd.args[2]);
          } else if (cmd.method === 'expire') {
            await this.expire(cmd.args[0], cmd.args[1]);
          }
        }
      },
    };
  }
}

// Export a singleton instance
export const memoryCache = new MemoryCache();

// Export type-compatible interface for Redis replacement
export interface ICache {
  hgetall(key: string): Promise<Record<string, string>>;
  hget(key: string, field: string): Promise<string | null>;
  hset(key: string, field: string, value: string): Promise<void>;
  expire(key: string, seconds: number): Promise<void>;
  hdel(key: string, ...fields: string[]): Promise<void>;
  pipeline(): Promise<{
    hset: (key: string, field: string, value: string) => any;
    expire: (key: string, seconds: number) => any;
    exec: () => Promise<void>;
  }>;
}

