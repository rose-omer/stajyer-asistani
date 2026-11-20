import { describe, expect, it } from 'vitest';
import { splitByLimit } from './QueuePage';

describe('splitByLimit', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('kalan hak kadarını gönderir, kalanı atlananlara koyar', () => {
    expect(splitByLimit(items, 2)).toEqual({ toSend: ['a', 'b'], skipped: ['c', 'd'] });
  });

  it('hak yeterliyse hiçbirini atlamaz', () => {
    expect(splitByLimit(items, 10)).toEqual({ toSend: items, skipped: [] });
  });

  it('hak yoksa hepsini atlar (negatif değer dahil)', () => {
    expect(splitByLimit(items, 0).toSend).toEqual([]);
    expect(splitByLimit(items, -3)).toEqual({ toSend: [], skipped: items });
  });
});
