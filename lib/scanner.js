import { readFile, access, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { glob } from 'node:fs/promises';

/** @typedef {import('./types.js').ProjectProfile} ProjectProfile */

const FRAMEWORK_CONFIGS = {
  'next.config.js': 'nextjs', 'next.config.mjs': 'nextjs', 'next.config.ts': 'nextjs',
  'nuxt.config.js': 'nuxt', 'nuxt.config.ts': 'nuxt',
  'svelte.config.js': 'sveltekit', 'svelte.config.ts': 'sveltekit',
  'astro.config.mjs': 'astro', 'astro.config.ts': 'astro',
  'angular.json': 'angular',
  'vue.config.js': 'vue',
};

const TEST_CONFIGS = {
  'jest.config.js': 'jest', 'jest.config.ts': 'jest', 'jest.config.mjs': 'jest',
  'vitest.config.js': 'vitest', 'vitest.config.ts': 'vitest', 'vitest.config.mts': 'vitest',
  'playwright.config.js': 'playwright', 'playwright.config.ts': 'playwright',
  'cypress.config.js': 'cypress', 'cypress.config.ts': 'cypress',
};

const LANG_FILES = {
  'requirements.txt': 'python', 'pyproject.toml': 'python', 'setup.py': 'python', 'Pipfile': 'python',
  'go.mod': 'go',
  'Cargo.toml': 'rust',
  'Gemfile': 'ruby',
  'composer.json': 'php',
};

const CI_FILES = {
  '.gitlab-ci.yml': 'gitlab-ci',
};

const DEP_CATEGORIES = {
  frameworks: {
    'react': 'react', 'react-dom': 'react',
    'next': 'nextjs',
    'vue': 'vue', 'nuxt': 'nuxt',
    'svelte': 'svelte', '@sveltejs/kit': 'sveltekit',
    'astro': 'astro',
    '@angular/core': 'angular',
    'express': 'express', 'fastify': 'fastify', 'hono': 'hono',
    'remix': 'remix', '@remix-run/react': 'remix',
    '@supabase/supabase-js': 'supabase', '@supabase/ssr': 'supabase',
  },
  auth: {
    'next-auth': 'next-auth', '@auth/core': 'authjs',
    '@clerk/nextjs': 'clerk', '@clerk/clerk-react': 'clerk',
    'lucia': 'lucia', '@supabase/auth-helpers-nextjs': 'supabase-auth',
  },
  orm: {
    'prisma': 'prisma', '@prisma/client': 'prisma',
    'drizzle-orm': 'drizzle',
    'typeorm': 'typeorm', 'sequelize': 'sequelize', 'mongoose': 'mongoose',
    'knex': 'knex',
  },
  state: {
    'zustand': 'zustand', 'redux': 'redux', '@reduxjs/toolkit': 'redux',
    'jotai': 'jotai', 'recoil': 'recoil', 'valtio': 'valtio',
    'mobx': 'mobx', 'pinia': 'pinia',
  },
  css: {
    'tailwindcss': 'tailwind',
    'styled-components': 'styled-components',
    '@emotion/react': 'emotion',
    'sass': 'sass',
  },
  testing: {
    'jest': 'jest', 'vitest': 'vitest',
    'playwright': 'playwright', '@playwright/test': 'playwright',
    'cypress': 'cypress',
    'mocha': 'mocha',
  },
};

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function readJson(p) {
  try { return JSON.parse(await readFile(p, 'utf8')); } catch { return null; }
}

async function dirExists(p) {
  try { return (await stat(p)).isDirectory(); } catch { return false; }
}

/**
 * Scan a project directory and build a profile.
 * @param {string} projectPath
 * @param {{ deep?: boolean }} options
 * @returns {Promise<ProjectProfile>}
 */
export async function scanProject(projectPath, { deep = false } = {}) {
  const profile = {
    techStack: new Set(),
    languages: new Set(),
    frameworks: [],
    packageManager: null,
    hasTests: false,
    testFrameworks: [],
    hasCI: false,
    ciPlatform: null,
    hasDocker: false,
    hasTypeScript: false,
    isMonorepo: false,
    authLibraries: [],
    ormLibraries: [],
    stateManagement: [],
    cssFramework: null,
    projectSize: null,
    missingPatterns: [],
  };

  // Detect package manager
  if (await exists(join(projectPath, 'bun.lockb')) || await exists(join(projectPath, 'bun.lock'))) {
    profile.packageManager = 'bun';
  } else if (await exists(join(projectPath, 'pnpm-lock.yaml'))) {
    profile.packageManager = 'pnpm';
  } else if (await exists(join(projectPath, 'yarn.lock'))) {
    profile.packageManager = 'yarn';
  } else if (await exists(join(projectPath, 'package-lock.json'))) {
    profile.packageManager = 'npm';
  }

  // Read package.json
  const pkg = await readJson(join(projectPath, 'package.json'));
  if (pkg) {
    profile.languages.add('node');
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    // Detect from dependencies
    for (const [dep, category] of Object.entries(DEP_CATEGORIES.frameworks)) {
      if (allDeps[dep]) {
        profile.techStack.add(category);
        const ver = allDeps[dep].replace(/[\^~>=<]/, '');
        profile.frameworks.push({ name: category, version: ver });
      }
    }

    for (const [dep, name] of Object.entries(DEP_CATEGORIES.testing)) {
      if (allDeps[dep]) { profile.testFrameworks.push(name); profile.hasTests = true; }
    }

    if (deep) {
      for (const [dep, name] of Object.entries(DEP_CATEGORIES.auth)) {
        if (allDeps[dep]) profile.authLibraries.push(name);
      }
      for (const [dep, name] of Object.entries(DEP_CATEGORIES.orm)) {
        if (allDeps[dep]) profile.ormLibraries.push(name);
      }
      for (const [dep, name] of Object.entries(DEP_CATEGORIES.state)) {
        if (allDeps[dep]) profile.stateManagement.push(name);
      }
      for (const [dep, name] of Object.entries(DEP_CATEGORIES.css)) {
        if (allDeps[dep]) { profile.cssFramework = name; profile.techStack.add(name); }
      }
    }

    // Detect CSS framework even in quick mode for tailwind
    if (allDeps['tailwindcss']) { profile.cssFramework = 'tailwind'; profile.techStack.add('tailwind'); }

    // Monorepo detection
    if (pkg.workspaces || await exists(join(projectPath, 'pnpm-workspace.yaml'))
        || await exists(join(projectPath, 'lerna.json')) || await exists(join(projectPath, 'nx.json'))) {
      profile.isMonorepo = true;
    }
  }

  // TypeScript
  if (await exists(join(projectPath, 'tsconfig.json'))) {
    profile.hasTypeScript = true;
    profile.techStack.add('typescript');
  }

  // Framework configs
  for (const [file, fw] of Object.entries(FRAMEWORK_CONFIGS)) {
    if (await exists(join(projectPath, file))) {
      profile.techStack.add(fw);
      if (!profile.frameworks.find(f => f.name === fw)) {
        profile.frameworks.push({ name: fw, version: null });
      }
    }
  }

  // Test configs
  for (const [file, fw] of Object.entries(TEST_CONFIGS)) {
    if (await exists(join(projectPath, file))) {
      if (!profile.testFrameworks.includes(fw)) profile.testFrameworks.push(fw);
      profile.hasTests = true;
    }
  }

  // Language files
  for (const [file, lang] of Object.entries(LANG_FILES)) {
    if (await exists(join(projectPath, file))) {
      profile.languages.add(lang);
      profile.techStack.add(lang);
    }
  }

  // Docker
  if (await exists(join(projectPath, 'Dockerfile')) || await exists(join(projectPath, 'docker-compose.yml'))
      || await exists(join(projectPath, 'docker-compose.yaml'))) {
    profile.hasDocker = true;
    profile.techStack.add('docker');
  }

  // CI
  if (await dirExists(join(projectPath, '.github', 'workflows'))) {
    profile.hasCI = true;
    profile.ciPlatform = 'github-actions';
  }
  for (const [file, ci] of Object.entries(CI_FILES)) {
    if (await exists(join(projectPath, file))) {
      profile.hasCI = true;
      profile.ciPlatform = ci;
    }
  }

  // Special directories
  if (await dirExists(join(projectPath, 'prisma'))) profile.techStack.add('prisma');
  if (await dirExists(join(projectPath, 'supabase'))) profile.techStack.add('supabase');
  if (await exists(join(projectPath, 'firebase.json')) || await exists(join(projectPath, '.firebaserc'))) {
    profile.techStack.add('firebase');
  }
  if (await exists(join(projectPath, 'vercel.json'))) profile.techStack.add('vercel');
  if (await exists(join(projectPath, 'tailwind.config.js')) || await exists(join(projectPath, 'tailwind.config.ts'))
      || await exists(join(projectPath, 'tailwind.config.mjs'))) {
    profile.techStack.add('tailwind');
    profile.cssFramework = 'tailwind';
  }

  // Deep mode: check for test files, project size, missing patterns
  if (deep) {
    // Check test files exist
    if (!profile.hasTests) {
      try {
        const entries = await readdir(projectPath, { recursive: true });
        const testFiles = entries.filter(e =>
          /\.(test|spec)\.(js|ts|jsx|tsx|mjs)$/.test(e) || e.includes('__tests__/')
        );
        if (testFiles.length > 0) profile.hasTests = true;
      } catch { /* ignore */ }
    }

    // Project size estimate
    try {
      const entries = await readdir(projectPath, { recursive: true });
      const srcFiles = entries.filter(e =>
        /\.(js|ts|jsx|tsx|py|go|rs|rb|php|vue|svelte)$/.test(e)
        && !e.includes('node_modules') && !e.includes('.next') && !e.includes('dist')
      );
      profile.projectSize = { files: srcFiles.length, estimatedLOC: srcFiles.length * 80 };
    } catch { /* ignore */ }

    // Missing patterns
    if (!profile.hasTests) profile.missingPatterns.push('no-tests');
    if (!profile.hasCI) profile.missingPatterns.push('no-ci');
    if (!await exists(join(projectPath, '.env.example')) && !await exists(join(projectPath, '.env.local'))) {
      profile.missingPatterns.push('no-env-example');
    }
  }

  // Deduplicate
  profile.techStack = [...new Set(profile.techStack)];
  profile.languages = [...new Set(profile.languages)];
  profile.frameworks = profile.frameworks.filter((f, i, a) => a.findIndex(x => x.name === f.name) === i);
  profile.testFrameworks = [...new Set(profile.testFrameworks)];
  profile.authLibraries = [...new Set(profile.authLibraries)];
  profile.ormLibraries = [...new Set(profile.ormLibraries)];
  profile.stateManagement = [...new Set(profile.stateManagement)];

  return profile;
}
