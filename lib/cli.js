import chalk from 'chalk';
import { formatInstalls } from './recommender.js';

const CATEGORIES = new Set(['testing', 'quality', 'devops', 'security', 'design', 'framework']);

const BANNER = [
  '██████╗ ███████╗███████╗████████╗███████╗██╗  ██╗██╗██╗     ██╗     ███████╗',
  '██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝',
  '██████╔╝█████╗  ███████╗   ██║   ███████╗█████╔╝ ██║██║     ██║     ███████╗',
  '██╔══██╗██╔══╝  ╚════██║   ██║   ╚════██║██╔═██╗ ██║██║     ██║     ╚════██║',
  '██████╔╝███████╗███████║   ██║   ███████║██║  ██╗██║███████╗███████╗███████╗',
  '╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝',
].map(line => chalk.cyan(line));

export async function runScan(projectPath, options, {
  scanProject,
  getRecommendations,
  getInstalledSkillIds,
  installSkills,
  stdout = process.stdout,
  stderr = process.stderr,
}) {
  if (options.max !== undefined && (!Number.isInteger(options.max) || options.max < 1)) {
    throw new Error('--max must be a positive integer');
  }
  if (options.category && !CATEGORIES.has(options.category)) {
    throw new Error(`--category must be one of: ${[...CATEGORIES].join(', ')}`);
  }

  const scope = options.global ? 'global' : 'project';
  const installScope = options.global ? 'global' : options.project ? 'project' : null;
  const write = (value) => {
    if (!options.json) stdout.write(value);
  };

  write(`\n${BANNER.join('\n')}\n\n  Scanning ${chalk.white.bold(projectPath)}${options.deep ? chalk.dim(' (deep mode)') : ''}...\n\n`);

  const profile = await scanProject(projectPath, { deep: options.deep });

  if (!options.json) {
    write(chalk.bold('  Tech Stack Detected:\n\n'));
    for (const framework of profile.frameworks) {
      write(`    ${chalk.cyan('•')} ${chalk.white(framework.name)}${framework.version ? chalk.dim(` ${framework.version}`) : ''}\n`);
    }
    if (profile.hasTypeScript) write(`    ${chalk.cyan('•')} ${chalk.white('TypeScript')}\n`);
    if (profile.cssFramework) write(`    ${chalk.cyan('•')} ${chalk.white(profile.cssFramework)}\n`);
    if (profile.hasDocker) write(`    ${chalk.cyan('•')} ${chalk.white('Docker')}\n`);
    if (profile.hasCI) write(`    ${chalk.cyan('•')} ${chalk.white('CI/CD')} ${chalk.dim(`(${profile.ciPlatform})`)}\n`);
    if (profile.packageManager) write(`    ${chalk.cyan('•')} ${chalk.white(profile.packageManager)}\n`);
    for (const language of profile.languages) {
      if (language !== 'node') write(`    ${chalk.cyan('•')} ${chalk.white(language)}\n`);
    }
    if (profile.testFrameworks.length) {
      write(`    ${chalk.cyan('•')} ${chalk.white('Testing:')} ${chalk.dim(profile.testFrameworks.join(', '))}\n`);
    }
    if (options.deep) {
      if (profile.authLibraries.length) write(`    ${chalk.cyan('•')} ${chalk.white('Auth:')} ${chalk.dim(profile.authLibraries.join(', '))}\n`);
      if (profile.ormLibraries.length) write(`    ${chalk.cyan('•')} ${chalk.white('ORM:')} ${chalk.dim(profile.ormLibraries.join(', '))}\n`);
      if (profile.stateManagement.length) write(`    ${chalk.cyan('•')} ${chalk.white('State:')} ${chalk.dim(profile.stateManagement.join(', '))}\n`);
      if (profile.isMonorepo) write(`    ${chalk.cyan('•')} ${chalk.white('Monorepo')}\n`);
      if (profile.projectSize) write(`    ${chalk.cyan('•')} ${chalk.dim(`${profile.projectSize.files} source files (~${profile.projectSize.estimatedLOC} LOC)`)}\n`);
    }
    const labels = {
      'no-tests': 'No test files found',
      'no-ci': 'No CI/CD configuration',
      'no-env-example': 'No .env.example file',
    };
    for (const pattern of profile.missingPatterns) {
      write(`    ${chalk.yellow('!')} ${chalk.dim(labels[pattern] || pattern)}\n`);
    }
    write('\n');
  }

  const { recommendations: allRecommendations } = await getRecommendations(profile, {
    max: options.max,
    category: options.category,
    useCache: options.cache,
    onProgress: options.json ? undefined : (message) => write(`  ${chalk.dim(message)}\n`),
  });

  const installedSkillIds = await getInstalledSkillIds({ scope, projectPath });
  const skippedInstalled = installedSkillIds
    ? allRecommendations.filter(({ skillId }) => installedSkillIds.has(skillId)).map(({ skillId }) => skillId)
    : [];
  const recommendations = installedSkillIds
    ? allRecommendations.filter(({ skillId }) => !installedSkillIds.has(skillId))
    : allRecommendations;

  if (options.json) {
    stdout.write(`${JSON.stringify({ scope, recommendations, skippedInstalled })}\n`);
    return { scope, recommendations, skippedInstalled };
  }

  if (!installedSkillIds) stderr.write(chalk.yellow('  Warning: could not read installed skills; showing all recommendations.\n'));

  if (recommendations.length === 0) {
    write(chalk.yellow('\n  No matching skills found in registry.\n'));
    return { scope, recommendations, skippedInstalled };
  }

  // If dry-run mode, print recommendations neatly and exit
  if (options.dryRun) {
    write(chalk.bold(`\n  Found ${recommendations.length} recommended skill${recommendations.length > 1 ? 's' : ''}:\n\n`));
    for (const rec of recommendations) {
      const name = rec.name.padEnd(28);
      const installs = chalk.cyan(formatInstalls(rec.installs).padStart(7));
      write(`    ${chalk.bold.white(name)} ${installs} installs  ${chalk.dim('│')} ${chalk.dim(rec.reason)}\n`);
    }
    write('\n');
    return { scope, recommendations, skippedInstalled };
  }

  // Interactive or Auto Install
  await installSkills(recommendations, { auto: options.auto, scope: installScope, projectPath });

  return { scope, recommendations, skippedInstalled };
}
