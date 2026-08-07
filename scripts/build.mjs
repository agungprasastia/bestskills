import { chmod, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';

const output = join('dist', process.platform === 'win32' ? 'bestskills.exe' : 'bestskills');

await rm(dirname(output), { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const { error, status } = spawnSync(
  'bun',
  ['build', './bin/bestskills.js', '--compile', `--outfile=${output}`],
  { stdio: 'inherit' },
);

if (error) {
  throw new Error(`Build failed: unable to run bun (${error.message}). Install bun from https://bun.sh.`);
}

if (status !== 0) {
  throw new Error(`Build failed with status ${status}`);
}

if (process.platform !== 'win32') {
  await chmod(output, 0o755);
}
