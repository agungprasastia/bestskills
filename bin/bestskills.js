#!/usr/bin/env node

import { Command } from 'commander';
import { resolve } from 'node:path';
import { access } from 'node:fs/promises';
import { scanProject } from '../lib/scanner.js';
import { getRecommendations } from '../lib/recommender.js';
import { installSkills } from '../lib/installer.js';
import { getInstalledSkillIds } from '../lib/installed.js';
import { runScan } from '../lib/cli.js';

const program = new Command();

program
  .name('bestskills')
  .description('Scan projects and recommend agent skills from the registry')
  .version('1.0.0');

program
  .argument('[path]', 'Project directory to scan', '.')
  .option('--deep', 'Enable deep pattern analysis')
  .option('--auto', 'Auto-install all recommendations without prompting')
  .option('--dry-run', 'Print recommendations without installing')
  .option('--json', 'Emit recommendations as JSON')
  .option('--max <number>', 'Maximum recommendations', Number)
  .option('--category <name>', 'Filter by category')
  .option('--no-cache', 'Bypass registry cache')
  .option('-g, --global', 'Install skills globally (user-level)')
  .option('-p, --project', 'Install skills to project root')
  .action(async (path, opts) => {
    const projectPath = resolve(path);

    // Verify path exists
    try {
      await access(projectPath);
    } catch {
      console.error(`\n  Error: Directory not found: ${projectPath}`);
      process.exit(1);
    }
    try {
      await runScan(projectPath, opts, { scanProject, getRecommendations, getInstalledSkillIds, installSkills });
    } catch (error) {
      console.error(`  Error: ${error.message}`);
      process.exitCode = 1;
    }
  });

program.parse();
