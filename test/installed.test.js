import { describe, expect, it, vi } from 'vitest';
import { getInstalledSkillIds } from '../lib/installed.js';

describe('installed skill inventory', () => {
  it('runs project inventory in target directory', async () => {
    const runCommand = vi.fn().mockResolvedValue({ stdout: JSON.stringify([{ id: 'owner/repo@skill' }]) });

    await expect(getInstalledSkillIds({ scope: 'project', projectPath: '/app', runCommand }))
      .resolves.toEqual(new Set(['owner/repo@skill']));
    expect(runCommand).toHaveBeenCalledWith('npx', ['skills', 'list', '--json'], { cwd: '/app' });
  });

  it('adds global flag and reads skillId entries', async () => {
    const runCommand = vi.fn().mockResolvedValue({ stdout: JSON.stringify([{ skillId: 'owner/repo@global-skill' }]) });

    await expect(getInstalledSkillIds({ scope: 'global', projectPath: '/app', runCommand }))
      .resolves.toEqual(new Set(['owner/repo@global-skill']));
    expect(runCommand).toHaveBeenCalledWith('npx', ['skills', 'list', '--json', '--global'], { cwd: '/app' });
  });

  it('returns null when inventory command fails', async () => {
    await expect(getInstalledSkillIds({
      scope: 'global',
      projectPath: '/app',
      runCommand: vi.fn().mockRejectedValue(new Error()),
    })).resolves.toBeNull();
  });

  it('returns null for malformed inventory output', async () => {
    await expect(getInstalledSkillIds({
      scope: 'project',
      projectPath: '/app',
      runCommand: vi.fn().mockResolvedValue({ stdout: 'not json' }),
    })).resolves.toBeNull();
  });

  it('discards non-string skill IDs', async () => {
    const runCommand = vi.fn().mockResolvedValue({
      stdout: JSON.stringify([{ id: 1 }, { skillId: null }, { id: 'owner/repo@skill' }]),
    });

    await expect(getInstalledSkillIds({ scope: 'project', projectPath: '/app', runCommand }))
      .resolves.toEqual(new Set(['owner/repo@skill']));
  });
});
