import { describe, expect, it, vi } from 'vitest';
import { runScan } from '../lib/cli.js';

const profile = {
  techStack: ['react'],
  missingPatterns: [],
  languages: ['node'],
  frameworks: [],
  hasTypeScript: false,
  cssFramework: null,
  hasDocker: false,
  hasCI: false,
  packageManager: 'npm',
  testFrameworks: [],
};

function createDependencies(overrides = {}) {
  const output = [];
  const errors = [];
  return {
    scanProject: vi.fn().mockResolvedValue(profile),
    getRecommendations: vi.fn().mockResolvedValue({
      recommendations: [{ skillId: 'owner/repo@new', name: 'New skill' }],
    }),
    getInstalledSkillIds: vi.fn().mockResolvedValue(new Set(['owner/repo@installed'])),
    installSkills: vi.fn(),
    stdout: { write: (value) => output.push(value) },
    stderr: { write: (value) => errors.push(value) },
    output,
    errors,
    ...overrides,
  };
}

describe('runScan', () => {
  it('does not install during dry run', async () => {
    const dependencies = createDependencies();

    await runScan('/app', { dryRun: true, cache: true }, dependencies);

    expect(dependencies.installSkills).not.toHaveBeenCalled();
  });

  it('emits only JSON and does not install in JSON mode', async () => {
    const dependencies = createDependencies({
      getRecommendations: vi.fn().mockResolvedValue({ recommendations: [] }),
    });

    await runScan('/app', { json: true, auto: true, cache: true }, dependencies);

    expect(JSON.parse(dependencies.output.join(''))).toEqual({
      scope: 'project', recommendations: [], skippedInstalled: [],
    });
    expect(dependencies.installSkills).not.toHaveBeenCalled();
    expect(dependencies.errors).toEqual([]);
  });

  it('excludes installed IDs and forwards recommendation options', async () => {
    const dependencies = createDependencies({
      getRecommendations: vi.fn().mockResolvedValue({
        recommendations: [
          { skillId: 'owner/repo@installed', name: 'Installed skill' },
          { skillId: 'owner/repo@new', name: 'New skill' },
        ],
      }),
    });

    await runScan('/app', { json: true, max: 2, category: 'testing', cache: false }, dependencies);

    expect(JSON.parse(dependencies.output.join(''))).toEqual({
      scope: 'project',
      recommendations: [{ skillId: 'owner/repo@new', name: 'New skill' }],
      skippedInstalled: ['owner/repo@installed'],
    });
    expect(dependencies.getRecommendations).toHaveBeenCalledWith(profile, expect.objectContaining({
      max: 2, category: 'testing', useCache: false,
    }));
  });

  it('rejects non-positive max values before scanning', async () => {
    const dependencies = createDependencies();

    await expect(runScan('/app', { max: 0, cache: true }, dependencies))
      .rejects.toThrow('--max must be a positive integer');
    expect(dependencies.scanProject).not.toHaveBeenCalled();
  });
});
