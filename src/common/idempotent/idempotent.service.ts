import { Injectable } from '@nestjs/common';

export const IDEMPOTENT_SERVICE_MAX_SIZE = 50;

@Injectable()
export class IdempotentService {
  private dataMap: Map<string, unknown>;
  private orderMap: Map<number, string>;
  private start: number;
  private finish: number;

  constructor() {
    this.dataMap = new Map();
    this.orderMap = new Map();
    this.start = 0;
    this.finish = 0;
  }

  has(key: string): boolean {
    return this.dataMap.has(key);
  }

  get(key: string): unknown {
    return this.dataMap.get(key);
  }

  set(key: string, value: unknown): void {
    if (this.dataMap.has(key)) {
      return;
    }
    this.dataMap.set(key, value);
    const gap = this.finish - this.start;
    if (gap < IDEMPOTENT_SERVICE_MAX_SIZE) {
      this.orderMap.set(this.finish, key);
      this.finish++;
    } else {
      for (let i = 0; i < gap; i++) {
        const count = this.start + i;
        this.dataMap.delete(this.orderMap.get(count)!);
        this.orderMap.delete(count);
      }
      this.start += gap;
    }
  }
}
