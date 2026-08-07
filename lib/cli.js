const CATEGORIES = new Set(['testing', 'quality', 'devops', 'security', 'design', 'framework']);

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
  const write = (value) => {
    if (!options.json) stdout.write(value);
  };
  write(`\n  Scanning ${projectPath}${options.deep ? ' (deep mode)' : ''}...\n\n`);

  const profile = await scanProject(projectPath, { deep: options.deep });
  if (!options.json) {
    write('  Tech Stack Detected:\n\n');
    for (const framework of profile.frameworks) write(`    ${framework.name}${framework.version ? ` ${framework.version}` : ''}\n`);
    if (profile.hasTypeScript) write('    TypeScript\n');
    if (profile.cssFramework) write(`    ${profile.cssFramework}\n`);
    if (profile.hasDocker) write('    Docker\n');
    if (profile.hasCI) write(`    CI/CD (${profile.ciPlatform})\n`);
    if (profile.packageManager) write(`    ${profile.packageManager}\n`);
    for (const language of profile.languages) if (language !== 'node') write(`    ${language}\n`);
    if (profile.testFrameworks.length) write(`    Testing: ${profile.testFrameworks.join(', ')}\n`);
    if (options.deep) {
      if (profile.authLibraries.length) write(`    Auth: ${profile.authLibraries.join(', ')}\n`);
      if (profile.ormLibraries.length) write(`    ORM: ${profile.ormLibraries.join(', ')}\n`);
      if (profile.stateManagement.length) write(`    State: ${profile.stateManagement.join(', ')}\n`);
      if (profile.isMonorepo) write('    Monorepo\n');
      if (profile.projectSize) write(`    ${profile.projectSize.files} source files (~${profile.projectSize.estimatedLOC} LOC)\n`);
    }
    const labels = { 'no-tests': 'No test files found', 'no-ci': 'No CI/CD configuration', 'no-env-example': 'No .env.example file' };
    for (const pattern of profile.missingPatterns) write(`    ${labels[pattern] || pattern}\n`);
    write('\n');
  }
  const { recommendations: allRecommendations } = await getRecommendations(profile, {
    max: options.max,
    category: options.category,
    useCache: options.cache,
    onProgress: options.json ? undefined : (message) => write(`  ${message}\n`),
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

  if (!installedSkillIds) stderr.write('  Warning: could not read installed skills; showing all recommendations.\n');
  if (recommendations.length === 0) {
    write('\n  No matching skills found in registry.\n');
    return { scope, recommendations, skippedInstalled };
  }

  write(`\n  Found ${recommendations.length} recommended skills:\n`);
  for (const recommendation of recommendations) write(`    ${recommendation.name} (${recommendation.skillId})\n`);
  if (!options.dryRun) await installSkills(recommendations, { auto: options.auto, scope, projectPath });

  return { scope, recommendations, skippedInstalled };
}
