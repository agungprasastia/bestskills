import { checkbox, select, Separator } from '@inquirer/prompts';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import chalk from 'chalk';
import { formatInstalls } from './recommender.js';

const execFileAsync = promisify(execFile);

/**
 * Truncate text cleanly with ellipsis if exceeding max width.
 */
function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? `${str.slice(0, maxLen - 1)}…` : str;
}

/**
 * Format a single skill choice label for checkbox prompt.
 */
function formatChoiceLabel(recommendation) {
  const name = truncate(recommendation.name, 26).padEnd(26);
  const installs = chalk.cyan(formatInstalls(recommendation.installs).padStart(7));
  const reason = chalk.dim(truncate(recommendation.reason, 32));
  return `${chalk.bold.white(name)}  ${installs} installs  ${chalk.dim('│')} ${reason}`;
}

/**
 * Present recommendations interactively and install selected skills.
 * @param {Array} recommendations
 * @param {{ auto?: boolean, scope?: 'global'|'project'|null, projectPath?: string, timeout?: number, runCommand?: Function }} options
 */
export async function installSkills(recommendations, {
  auto = false, scope = null, projectPath = '.', timeout = 25000, runCommand = execFileAsync,
} = {}) {
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
      choices.push(new Separator(chalk.bold.red('  ── HIGH PRIORITY ──────────────────────────────────────────')));
      for (const r of grouped.high) {
        choices.push({
          value: r,
          name: formatChoiceLabel(r),
          short: r.name,
          checked: true,
        });
      }
    }

    if (grouped.medium.length) {
      choices.push(new Separator(chalk.bold.yellow('  ── MEDIUM PRIORITY ────────────────────────────────────────')));
      for (const r of grouped.medium) {
        choices.push({
          value: r,
          name: formatChoiceLabel(r),
          short: r.name,
          checked: false,
        });
      }
    }

    if (grouped.low.length) {
      choices.push(new Separator(chalk.bold.dim('  ── LOW PRIORITY ───────────────────────────────────────────')));
      for (const r of grouped.low) {
        choices.push({
          value: r,
          name: formatChoiceLabel(r),
          short: r.name,
          checked: false,
        });
      }
    }

    try {
      selected = await checkbox({
        message: 'Select skills to install',
        choices,
        pageSize: 15,
      });
    } catch {
      console.log(chalk.dim('\n  Cancelled.'));
      return { installed: [], failed: [], skipped: recommendations };
    }

    // Filter out non-object values if any
    selected = selected.filter(item => item && typeof item === 'object');

    if (selected.length === 0) {
      console.log(chalk.dim('\n  No skills selected.'));
      return { installed: [], failed: [], skipped: recommendations };
    }
  }

  console.log(chalk.cyan(`\n  Installing ${selected.length} skill${selected.length > 1 ? 's' : ''}...\n`));

  const installed = [];
  const failed = [];

  for (const skill of selected) {
    process.stdout.write(`  ${chalk.dim('•')} Installing ${chalk.white.bold(skill.name)}... `);
    try {
      await runCommand('npx', ['skills', 'add', skill.skillId, ...scopeFlag, '-y'], {
        timeout,
        cwd: projectPath,
      });
      console.log(chalk.green('✓'));
      installed.push(skill);
    } catch (err) {
      console.log(chalk.red('✗'));
      const rawMsg = err.message || '';
      let cleanMsg = rawMsg.split('\n')[0] || 'Unknown error';
      if (err.code === 'ETIMEDOUT' || err.killed || rawMsg.includes('TIMEDOUT') || rawMsg.includes('timed out')) {
        cleanMsg = 'Connection timed out (download took >25s)';
      } else if (rawMsg.includes('404') || rawMsg.includes('Not Found')) {
        cleanMsg = 'Repository or skill path not found';
      }
      console.log(chalk.dim(`    ↳ ${cleanMsg}`));
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
