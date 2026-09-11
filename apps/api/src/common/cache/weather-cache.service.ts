import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Tiny TTL cache with single-flight de-duplication.
 *
 * Swap this for a Redis-backed implementation when you scale past one node —
 * the public surface is just `wrap()`, so nothing else has to change.
 */
@Injectable()
export class WeatherCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(WeatherCacheService.name);
  private readonly store = new Map<string, Entry<unknown>>();
  /** In-flight promises, so 50 concurrent misses cause 1 upstream call, not 50. */
  private readonly inflight = new Map<string, Promise<unknown>>();
  private readonly sweeper: NodeJS.Timeout;

  constructor() {
    this.sweeper = setInterval(() => this.sweep(), 60_000);
    this.sweeper.unref?.();
  }

  async wrap<T>(key: string, ttlSeconds: number, produce: () => Promise<T>): Promise<T> {
    const hit = this.store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }

    const pending = this.inflight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = produce()
      .then((value) => {
        this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
        return value;
      })
      .catch((error) => {
        // Serve stale data rather than an error page if we have any.
        if (hit) {
          this.logger.warn(`Upstream failed for ${key}; serving stale entry.`);
          return hit.value as T;
        }
        throw error;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) this.store.delete(key);
    }
  }

  onModuleDestroy(): void {
    clearInterval(this.sweeper);
  }
}
