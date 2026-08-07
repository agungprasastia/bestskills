import { beforeEach, describe, expect, it, vi } from 'vitest';

const cache = vi.hoisted(() => ({
  getCachedQuery: vi.fn(),
  cacheQuery: vi.fn(),
}));

vi.mock('../lib/cache.js', () => cache);

import { formatInstalls, getRecommendations } from '../lib/recommender.js';

const profile = (techStack, missingPatterns = []) => ({ techStack, missingPatterns });

beforeEach(() => {
  vi.clearAllMocks();
  cache.getCachedQuery.mockResolvedValue(null);
  cache.cacheQuery.mockResolvedValue(undefined);
});

describe('formatInstalls', () => {
  it('formats raw, thousand, and million install counts', () => {
    expect(formatInstalls(42)).toBe('42');
    expect(formatInstalls(612100)).toBe('612.1K');
    expect(formatInstalls(1200000)).toBe('1.2M');
  });
});

describe('getRecommendations', () => {
  it('removes React Native and Clerk results from a web React profile', async () => {
    const searchRegistry = vi.fn().mockResolvedValue([
      { skillId: 'a/react-web', name: 'react-web', installs: 5 },
      { skillId: 'a/react-native', name: 'react-native', installs: 999 },
      { skillId: 'a/clerk-react', name: 'clerk-react', installs: 900 },
    ]);

    const results = await getRecommendations(profile(['react']), { searchRegistry });

    expect(results.recommendations.map((item) => item.skillId)).toEqual(['a/react-web']);
  });

  it('filters category and applies requested maximum', async () => {
    const searchRegistry = vi.fn().mockResolvedValue([
      { skillId: 'a/eslint', name: 'eslint', installs: 5 },
      { skillId: 'a/prettier', name: 'prettier', installs: 10 },
    ]);

    const results = await getRecommendations(profile(['eslint']), {
      category: 'quality', max: 1, searchRegistry,
    });

    expect(results.recommendations).toHaveLength(1);
    expect(results.recommendations[0]).toMatchObject({ skillId: 'a/prettier', category: 'quality' });
  });

  it('uses cached results instead of the injected registry search', async () => {
    cache.getCachedQuery.mockResolvedValue([{ skillId: 'a/react', name: 'react', installs: 5 }]);
    const searchRegistry = vi.fn();

    const results = await getRecommendations(profile(['react']), { searchRegistry });

    expect(results.recommendations.map((item) => item.skillId)).toEqual(['a/react']);
    expect(searchRegistry).not.toHaveBeenCalled();
    expect(cache.cacheQuery).not.toHaveBeenCalled();
    expect(results.cachedQueries).toEqual(['react']);
  });

  it('searches and caches non-empty results after a cache miss', async () => {
    const searchRegistry = vi.fn().mockResolvedValue([{ skillId: 'a/react', name: 'react', installs: 5 }]);

    await getRecommendations(profile(['react']), { searchRegistry });

    expect(searchRegistry).toHaveBeenCalledWith('react');
    expect(cache.cacheQuery).toHaveBeenCalledWith('react', [{ skillId: 'a/react', name: 'react', installs: 5 }]);
  });

  it('bypasses cached results when useCache is false', async () => {
    cache.getCachedQuery.mockResolvedValue([{ skillId: 'a/cached', name: 'cached', installs: 5 }]);
    const searchRegistry = vi.fn().mockResolvedValue([{ skillId: 'a/live', name: 'live', installs: 10 }]);

    const results = await getRecommendations(profile(['react']), { searchRegistry, useCache: false });

    expect(results.recommendations.map((item) => item.skillId)).toEqual(['a/live']);
    expect(cache.getCachedQuery).not.toHaveBeenCalled();
    expect(cache.cacheQuery).not.toHaveBeenCalled();
  });
});
