import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// Çift kodlanmış UTF-8 (mojibake) izi: "ı" iki karaktere döner, ilki \u00c4 olur.
// Türkçe metinde bu harfler geçmez; görünürlerse dosya bozuk kaydedilmiştir.
const MOJIBAKE = /[\u00c3\u00c4\u00c5][\u0080-\u017f]/;
// Vitest depo kökünden koşar.
const ROOT = process.cwd();
const SKIP = new Set(['node_modules', 'dist', '.git', 'coverage']);
const EXT = /\.(tsx?|css|html|sql|md|json|toml|ya?ml)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXT.test(name)) out.push(path);
  }
  return out;
}

describe('kaynak dosyaların kodlaması', () => {
  it('hiçbir dosyada mojibake yok', () => {
    const bad = walk(ROOT)
      .filter((f) => !f.endsWith('package-lock.json'))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .flatMap((line, i) => (MOJIBAKE.test(line) ? [`${relative(ROOT, f)}:${i + 1}`] : [])),
      );
    expect(bad).toEqual([]);
  });
});
