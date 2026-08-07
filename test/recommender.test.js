import { describe, expect, it } from 'vitest';
import { formatInstalls } from '../lib/recommender.js';

describe('formatInstalls', () => {
  it('formats raw, thousand, and million install counts', () => {
    expect(formatInstalls(42)).toBe('42');
    expect(formatInstalls(612100)).toBe('612.1K');
    expect(formatInstalls(1200000)).toBe('1.2M');
  });
});
