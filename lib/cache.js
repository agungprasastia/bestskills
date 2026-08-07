import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const defaultCachePath = join(homedir(), '.bestskills', 'cache.json');

function isCache(data) {
  return data && typeof data === 'object' && data.queries && typeof data.queries === 'object';
}

async function readCache(cachePath) {
  try {
    const data = JSON.parse(await readFile(cachePath, 'utf8'));
    return isCache(data) ? data : { queries: {} };
  } catch {
    return { queries: {} };
  }
}

export async function getCachedQuery(query, { cachePath = defaultCachePath, now = Date.now() } = {}) {
  try {
    const { queries } = await readCache(cachePath);
    const entry = queries[query];
    if (!entry || typeof entry.createdAt !== 'number' || !Array.isArray(entry.results)) return null;
    return now - entry.createdAt > CACHE_TTL_MS ? null : entry.results;
  } catch {
    return null;
  }
}

export async function cacheQuery(query, results, { cachePath = defaultCachePath, now = Date.now() } = {}) {
  try {
    const cache = await readCache(cachePath);
    cache.queries[query] = { createdAt: now, results };
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(cache));
  } catch {}
}
