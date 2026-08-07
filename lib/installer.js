import { checkbox, select } from '@inquirer/prompts';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { formatInstalls } from './recommender.js';

const execFileAsync = promisify(execFile);

/**
 * Present recommendations interactively and install selected skills.
 * @param {Array} recommendations
 * @param {{ auto?: boolean, scope?: 'global'|'project'|null, projectPath?: string }} options
 */
export async function installSkills(recommendations, { auto = false, scope = null, projectPath = '.' } = {}) {
  if (recommendations.length === 0) {
    console.log(chalk.yellow('\n  No matching skills found in registry.'));
    return { installed: [], failed: [], skipped: [] };
  }

  // Determine install scope
  let installScope = scope;
  if (!installScope && !auto) {
    try {
      installScope = await select({
        message: 'Where to install skills?',
        choices: [
          { value: 'project', name: `Project  ${chalk.dim(`(${projectPath})`)}` },
          { value: 'global', name: `Global   ${chalk.dim('(~/.agents/skills/)')}` },
        ],
      });
    } catch {
      console.log(chalk.dim('\n  Cancelled.'));
      return { installed: [], failed: [], skipped: recommendations };
    }
  }
  // Default to project if auto and no scope specified
  if (!installScope) installScope = 'project';

  const scopeLabel = installScope === 'global' ? 'globally' : 'to project';
  const scopeFlag = installScope === 'global' ? ['-g'] : [];

  let selected;

  if (auto) {
    selected = recommendations;
    console.log(chalk.cyan(`\n  Auto-installing ${selected.length} skills...\n`));
  } else {
    // Group by priority for display
    const grouped = { high: [], medium: [], low: [] };
    for (const r of recommendations) {
      (grouped[r.priority] || grouped.low).push(r);
    }

    const choices = [];

    if (grouped.high.length) {
      choices.push({ value: null, name: chalk.bold.red('  HIGH PRIORITY'), disabled: '' });
      for (const r of grouped.high) {
        choices.push({
          value: r,
          name: `${chalk.white(r.name.padEnd(40))} ${chalk.cyan(formatInstalls(r.installs).padStart(8))} installs  ${chalk.dim('│')} ${r.reason}`,
          checked: true,
        });
      }
    }

    if (grouped.medium.length) {
      choices.push({ value: null, name: chalk.bold.yellow('\n  MEDIUM PRIORITY'), disabled: '' });
      for (const r of grouped.medium) {
        choices.push({
          value: r,
          name: `${chalk.white(r.name.padEnd(40))} ${chalk.cyan(formatInstalls(r.installs).padStart(8))} installs  ${chalk.dim('│')} ${r.reason}`,
          checked: false,
        });
      }
    }

    if (grouped.low.length) {
      choices.push({ value: null, name: chalk.bold.dim('\n  LOW PRIORITY'), disabled: '' });
      for (const r of grouped.low) {
        choices.push({
          value: r,
          name: `${chalk.white(r.name.padEnd(40))} ${chalk.cyan(formatInstalls(r.installs).padStart(8))} installs  ${chalk.dim('│')} ${r.reason}`,
          checked: false,
        });
      }
    }

    try {
      selected = await checkbox({
        message: 'Select skills to install (space to toggle, enter to confirm)',
        choices,
        pageSize: 20,
      });
    } catch {
      console.log(chalk.dim('\n  Cancelled.'));
      return { installed: [], failed: [], skipped: recommendations };
    }

    // Filter out null separators
    selected = selected.filter(Boolean);

    if (selected.length === 0) {
      console.log(chalk.dim('\n  No skills selected.'));
      return { installed: [], failed: [], skipped: recommendations };
    }
  }

  console.log(chalk.cyan(`\n  Installing ${selected.length} skill${selected.length > 1 ? 's' : ''}...\n`));

  const installed = [];
  const failed = [];

  for (const skill of selected) {
    try {
      process.stdout.write(`  Installing ${chalk.white(skill.name)}... `);
      await execFileAsync('npx', ['skills', 'add', skill.skillId, ...scopeFlag, '-y'], {
        timeout: 60000,
        cwd: projectPath,
      });
      console.log(chalk.green('✓'));
      installed.push(skill);
    } catch (err) {
      console.log(chalk.red('✗'));
      console.log(chalk.dim(`    ${err.message?.split('\n')[0] || 'Unknown error'}`));
      failed.push(skill);
    }
  }

  // Summary
  const skipped = recommendations.filter(r => !selected.includes(r));
  console.log('');
  if (installed.length) console.log(chalk.green(`  ✓ ${installed.length} skill${installed.length > 1 ? 's' : ''} installed ${scopeLabel}`));
  if (failed.length) console.log(chalk.red(`  ✗ ${failed.length} failed`));
  if (skipped.length) console.log(chalk.dim(`  — ${skipped.length} skipped`));

  return { installed, failed, skipped };
}
