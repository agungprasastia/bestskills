#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { scanProject } from '../lib/scanner.js';
import { getRecommendations, formatInstalls } from '../lib/recommender.js';
import { installSkills } from '../lib/installer.js';

const program = new Command();

program
  .name('bestskills')
  .description('Scan projects and recommend agent skills from the registry')
  .version('1.0.0');

program
  .command('scan')
  .description('Scan a project and recommend skills to install')
  .argument('[path]', 'Project directory to scan', '.')
  .option('--deep', 'Enable deep pattern analysis')
  .option('--auto', 'Auto-install all recommendations without prompting')
  .option('-g, --global', 'Install skills globally (user-level)')
  .option('-p, --project', 'Install skills to project root')
  .action(async (path, opts) => {
    const projectPath = resolve(path);

    // Verify path exists
    try {
      await access(projectPath);
    } catch {
      console.error(chalk.red(`\n  Error: Directory not found: ${projectPath}`));
      process.exit(1);
    }

    console.log(chalk.cyan(`\n  Scanning ${projectPath}${opts.deep ? ' (deep mode)' : ''}...\n`));

    // Step 1: Scan
    const profile = await scanProject(projectPath, { deep: opts.deep });

    // Display detected tech
    if (profile.techStack.length === 0 && profile.languages.length === 0) {
      console.log(chalk.yellow('  No tech stack detected. Is this the right directory?\n'));
      process.exit(0);
    }

    console.log(chalk.bold('  Tech Stack Detected:\n'));

    for (const fw of profile.frameworks) {
      const ver = fw.version ? ` ${fw.version}` : '';
      console.log(chalk.green(`    ✓ ${fw.name}${ver}`));
    }

    if (profile.hasTypeScript) console.log(chalk.green('    ✓ TypeScript'));
    if (profile.cssFramework) console.log(chalk.green(`    ✓ ${profile.cssFramework}`));
    if (profile.hasDocker) console.log(chalk.green('    ✓ Docker'));
    if (profile.hasCI) console.log(chalk.green(`    ✓ CI/CD (${profile.ciPlatform})`));
    if (profile.packageManager) console.log(chalk.green(`    ✓ ${profile.packageManager}`));

    for (const lang of profile.languages) {
      if (lang !== 'node') console.log(chalk.green(`    ✓ ${lang}`));
    }

    if (profile.testFrameworks.length > 0) {
      console.log(chalk.green(`    ✓ Testing: ${profile.testFrameworks.join(', ')}`));
    }

    // Show remaining tech stack items not yet printed
    const printed = new Set([
      ...profile.frameworks.map(f => f.name),
      ...profile.languages,
      profile.hasTypeScript ? 'typescript' : null,
      profile.cssFramework,
      profile.hasDocker ? 'docker' : null,
      'node',
    ].filter(Boolean));
    for (const tech of profile.techStack) {
      if (!printed.has(tech)) console.log(chalk.green(`    ✓ ${tech}`));
    }

    // Deep mode extras
    if (opts.deep) {
      if (profile.authLibraries.length) console.log(chalk.green(`    ✓ Auth: ${profile.authLibraries.join(', ')}`));
      if (profile.ormLibraries.length) console.log(chalk.green(`    ✓ ORM: ${profile.ormLibraries.join(', ')}`));
      if (profile.stateManagement.length) console.log(chalk.green(`    ✓ State: ${profile.stateManagement.join(', ')}`));
      if (profile.isMonorepo) console.log(chalk.green('    ✓ Monorepo'));
      if (profile.projectSize) {
        console.log(chalk.dim(`    ℹ ${profile.projectSize.files} source files (~${profile.projectSize.estimatedLOC} LOC)`));
      }
    }

    // Missing patterns
    if (profile.missingPatterns.length > 0) {
      console.log('');
      for (const pattern of profile.missingPatterns) {
        const labels = {
          'no-tests': 'No test files found',
          'no-ci': 'No CI/CD configuration',
          'no-env-example': 'No .env.example file',
        };
        console.log(chalk.yellow(`    ⚠ ${labels[pattern] || pattern}`));
      }
    }

    console.log('');

    // Step 2: Get recommendations
    const { recommendations } = await getRecommendations(profile, {
      onProgress: (msg) => {
        console.log(chalk.dim(`  ${msg}`));
      },
    });

    if (recommendations.length === 0) {
      console.log(chalk.yellow('\n  No matching skills found in registry.\n'));
      process.exit(0);
    }

    console.log(chalk.bold(`\n  Found ${recommendations.length} recommended skills:\n`));

    // Step 3: Install
    const scope = opts.global ? 'global' : opts.project ? 'project' : null;
    await installSkills(recommendations, { auto: opts.auto, scope, projectPath });

    console.log('');
  });

program.parse();
