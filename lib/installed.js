import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const runCommand = promisify(execFile);

export async function getInstalledSkillIds({ scope, projectPath, runCommand: command = runCommand }) {
  try {
    const args = ['skills', 'list', '--json'];
    if (scope === 'global') args.push('--global');

    const { stdout } = await command('npx', args, { cwd: projectPath });
    const skills = JSON.parse(stdout);
    if (!Array.isArray(skills)) return null;

    return new Set(skills.map(({ id, skillId }) => id ?? skillId).filter((id) => typeof id === 'string'));
  } catch {
    return null;
  }
}
