import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

export const SOURCE_EXTENSION = path.extname(__filename);
const DECLARATION_SUFFIX = '.d.ts';
const requireModule = createRequire(__filename);

export function isSourceFile(fileName: string): boolean {
  return fileName.endsWith(SOURCE_EXTENSION) && !fileName.endsWith(DECLARATION_SUFFIX);
}

export function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return listSourceFiles(full);
      return isSourceFile(entry.name) ? [full] : [];
    });
}

export function loadModule(file: string): unknown {
  const loaded: unknown = requireModule(file);
  return loaded;
}

export function clearModule(file: string): void {
  const resolved = requireModule.resolve(file);
  delete requireModule.cache[resolved];
}

export function defaultExport(loaded: unknown): unknown {
  if (typeof loaded === 'object' && loaded !== null && 'default' in loaded) return loaded.default;
  return loaded;
}
