import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJson, writeJson } from './storage';

describe('storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('kota dolunca atmaz, false döner', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('dolu', 'QuotaExceededError');
    });
    expect(writeJson('x', { a: 1 })).toBe(false);
  });

  it('bozuk JSON okununca varsayılanı döner', () => {
    localStorage.setItem('bozuk', '{');
    expect(readJson('bozuk', [])).toEqual([]);
  });
});
