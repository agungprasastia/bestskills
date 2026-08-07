import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CACHE_TTL_MS, cacheQuery, getCachedQuery } from '../lib/cache.js';

const cachePaths = [];

async function createCachePath() {
  const directory = await mkdtemp(join(tmpdir(), 'bestskills-cache-'));
  cachePaths.push(directory);
  return join(directory, 'cache.json');
}

afterEach(async () => {
  await Promise.all(cachePaths.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('registry cache', () => {
  it('returns fresh cached results for a query', async () => {
    const cachePath = await createCachePath();
    const results = [{ skillId: 'owner/repo@react' }];

    await cacheQuery('react', results, { cachePath, now: 100 });

    await expect(getCachedQuery('react', { cachePath, now: 101 })).resolves.toEqual(results);
  });

  it('returns null when cache data reaches its TTL', async () => {
    const cachePath = await createCachePath();

    await cacheQuery('react', [], { cachePath, now: 0 });

    await expect(getCachedQuery('react', { cachePath, now: CACHE_TTL_MS })).resolves.toBeNull();
  });

  it('returns null for malformed cache data', async () => {
    const cachePath = await createCachePath();
    await writeFile(cachePath, '{invalid json');

    await expect(getCachedQuery('react', { cachePath, now: 100 })).resolves.toBeNull();
  });

  it('swallows filesystem failures', async () => {
    const parentPath = join(tmpdir(), 'bestskills-cache-file');
    await writeFile(parentPath, 'not a directory');
    const cachePath = join(parentPath, 'cache.json');

    await expect(cacheQuery('react', [], { cachePath, now: 100 })).resolves.toBeUndefined();
    await expect(getCachedQuery('react', { cachePath, now: 100 })).resolves.toBeNull();

    await rm(parentPath);
  });
});
