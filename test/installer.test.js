import { describe, expect, it, vi } from 'vitest';
import { installSkills } from '../lib/installer.js';

const skill = { skillId: 'owner/repo@skill', name: 'Skill' };

describe('installSkills', () => {
  it('installs project skills without -g in target directory', async () => {
    const runCommand = vi.fn().mockResolvedValue({});

    await installSkills([skill], {
      auto: true, scope: 'project', projectPath: '/app', runCommand,
    });

    expect(runCommand).toHaveBeenCalledWith(
      'npx', ['skills', 'add', skill.skillId, '-y'], { cwd: '/app', timeout: 60000 },
    );
  });

  it('installs global skills with -g', async () => {
    const runCommand = vi.fn().mockResolvedValue({});

    await installSkills([skill], { auto: true, scope: 'global', projectPath: '/app', runCommand });

    expect(runCommand).toHaveBeenCalledWith(
      'npx', ['skills', 'add', skill.skillId, '-g', '-y'], { cwd: '/app', timeout: 60000 },
    );
  });

  it('continues after one install fails', async () => {
    const first = { skillId: 'owner/repo@first', name: 'First' };
    const second = { skillId: 'owner/repo@second', name: 'Second' };
    const runCommand = vi.fn()
      .mockRejectedValueOnce(new Error('failed'))
      .mockResolvedValueOnce({});

    const result = await installSkills([first, second], { auto: true, scope: 'global', runCommand });

    expect(result.failed).toEqual([first]);
    expect(result.installed).toEqual([second]);
  });
});
