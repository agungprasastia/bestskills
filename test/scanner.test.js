import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scanProject } from '../lib/scanner.js';

const directories = [];

async function project(files) {
  const directory = await mkdtemp(join(tmpdir(), 'bestskills-'));
  directories.push(directory);

  await Promise.all(Object.entries(files).map(async ([path, content]) => {
    const target = join(directory, path);
    await mkdir(join(target, '..'), { recursive: true });
    await writeFile(target, content);
  }));

  return directory;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

describe('scanProject', () => {
  it('detects Node, Next.js, React, TypeScript, Tailwind, and npm', async () => {
    const directory = await project({
      'package.json': JSON.stringify({
        dependencies: {
          next: '^16.3.0',
          react: '^19.2.8',
          tailwindcss: '^4.0.0',
        },
      }),
      'package-lock.json': '{}',
      'tsconfig.json': '{}',
    });

    const profile = await scanProject(directory);

    expect(profile.techStack).toEqual(expect.arrayContaining(['nextjs', 'react', 'tailwind', 'typescript']));
    expect(profile.languages).toContain('node');
    expect(profile.packageManager).toBe('npm');
    expect(profile.hasTypeScript).toBe(true);
    expect(profile.cssFramework).toBe('tailwind');
    expect(profile.frameworks).toEqual(expect.arrayContaining([
      { name: 'nextjs', version: '16.3.0' },
      { name: 'react', version: '19.2.8' },
    ]));
  });

  it('detects deep-mode libraries and missing project patterns', async () => {
    const directory = await project({
      'package.json': JSON.stringify({
        workspaces: ['packages/*'],
        dependencies: {
          '@clerk/nextjs': '^6.0.0',
          '@prisma/client': '^6.0.0',
          zustand: '^5.0.0',
        },
      }),
      'src/index.ts': 'export const answer = 42;\n',
    });

    const profile = await scanProject(directory, { deep: true });

    expect(profile.authLibraries).toEqual(['clerk']);
    expect(profile.ormLibraries).toEqual(['prisma']);
    expect(profile.stateManagement).toEqual(['zustand']);
    expect(profile.isMonorepo).toBe(true);
    expect(profile.projectSize.files).toBe(1);
    expect(profile.missingPatterns).toEqual(expect.arrayContaining(['no-tests', 'no-ci', 'no-env-example']));
  });

  it('recognizes test files in deep mode without a test dependency', async () => {
    const directory = await project({
      'package.json': '{}',
      'src/example.spec.ts': 'export {};\n',
    });

    const profile = await scanProject(directory, { deep: true });

    expect(profile.hasTests).toBe(true);
    expect(profile.missingPatterns).not.toContain('no-tests');
  });

  it('detects quality, workflow, monorepo, and deployment tools', async () => {
    const directory = await project({
      'biome.json': '{}', 'eslint.config.js': 'export default [];',
      '.prettierrc': '{}', '.husky/pre-commit': '', 'lefthook.yml': '',
      'turbo.json': '{}', 'nx.json': '{}', 'pnpm-workspace.yaml': 'packages:\n  - packages/*',
      'wrangler.toml': '', 'railway.json': '{}',
    });
    const profile = await scanProject(directory);

    expect(profile.techStack).toEqual(expect.arrayContaining([
      'biome', 'eslint', 'prettier', 'husky', 'lefthook', 'turbo', 'nx',
      'pnpm-workspace', 'cloudflare', 'railway',
    ]));
    expect(profile.isMonorepo).toBe(true);
  });

  it('detects a Turbo dependency as monorepo evidence', async () => {
    const directory = await project({
      'package.json': JSON.stringify({ devDependencies: { turbo: '^2.0.0' } }),
    });

    const profile = await scanProject(directory);

    expect(profile.techStack).toContain('turbo');
    expect(profile.isMonorepo).toBe(true);
  });

  it('detects an Nx dependency as monorepo evidence', async () => {
    const directory = await project({
      'package.json': JSON.stringify({ devDependencies: { nx: '^20.0.0' } }),
    });

    const profile = await scanProject(directory);

    expect(profile.techStack).toContain('nx');
    expect(profile.isMonorepo).toBe(true);
  });
});
