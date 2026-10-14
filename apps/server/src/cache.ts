import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { config } from './config.js';

class InMemoryCache extends EventEmitter {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    } else if (mode === 'PX' && duration) {
      expiresAt = Date.now() + duration;
    }
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const now = Date.now();
    const result: string[] = [];
    for (const [key, item] of this.store.entries()) {
      if (!item.expiresAt || item.expiresAt > now) {
        if (pattern === '*' || key.startsWith(pattern.replace('*', ''))) {
          result.push(key);
        }
      }
    }
    return result;
  }
}

export type CacheClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<string>;
  del(key: string): Promise<number>;
  keys(pattern: string): Promise<string[]>;
};

let cacheClient: CacheClient;
let isRedisAvailable = false;

try {
  const redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null, // Do not spam retries if redis is not running locally
    lazyConnect: true,
  });

  redis.connect().then(() => {
    isRedisAvailable = true;
    console.log('✓ Connected to Redis for matchmaking & state cache');
  }).catch(() => {
    console.log('ℹ Redis not active locally. Using high-speed In-Memory Cache & Event Bus.');
  });

  cacheClient = {
    async get(key: string) {
      if (!isRedisAvailable) return inMemory.get(key);
      try {
        return await redis.get(key);
      } catch {
        return inMemory.get(key);
      }
    },
    async set(key: string, value: string, mode?: string, duration?: number) {
      if (!isRedisAvailable) return inMemory.set(key, value, mode, duration);
      try {
        if (mode && duration) {
          // @ts-ignore
          return await redis.set(key, value, mode, duration);
        }
        return await redis.set(key, value);
      } catch {
        return inMemory.set(key, value, mode, duration);
      }
    },
    async del(key: string) {
      if (!isRedisAvailable) return inMemory.del(key);
      try {
        return await redis.del(key);
      } catch {
        return inMemory.del(key);
      }
    },
    async keys(pattern: string) {
      if (!isRedisAvailable) return inMemory.keys(pattern);
      try {
        return await redis.keys(pattern);
      } catch {
        return inMemory.keys(pattern);
      }
    },
  };
} catch {
  console.log('ℹ Using In-Memory Cache & Event Bus');
}

const inMemory = new InMemoryCache();
export const cache = cacheClient! || inMemory;
