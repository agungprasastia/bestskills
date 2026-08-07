# Development Guide

## Setup

```bash
npm install
npm test
```

Run local CLI without linking it:

```bash
node bin/bestskills.js scan /path/to/project --deep
```

## Repository Layout

```text
bin/bestskills.js     CLI parsing, scan orchestration, terminal output
lib/scanner.js        Project file and dependency detection
lib/recommender.js    Detection-to-query mapping, cache-aware registry lookup, deterministic ranking
lib/cache.js          24-hour user registry-query cache
lib/installed.js      Installed-skill inventory by project or global scope
lib/cli.js            Output pipeline, report-only modes, filtering, and installation dispatch
lib/installer.js      Scope picker, skill picker, and `npx skills add` execution
test/scanner.test.js      Scanner tests
test/recommender.test.js  Recommendation, relevance, filtering, and ranking tests
test/cache.test.js        Registry cache tests
test/installed.test.js    Installed-skill inventory tests
test/cli.test.js          CLI output pipeline and report-only mode tests
test/installer.test.js    Installer scope and command tests
docs/                 User, contributor, and decision documentation
```

## Runtime Flow

1. CLI resolves and validates target directory.
2. `scanProject()` builds a profile from files, directories, and package dependencies.
3. `getRecommendations()` maps detected technology and missing patterns to registry queries, reads or writes the 24-hour user cache, filters irrelevant results, then sorts by priority and install count.
4. CLI filters recommendations already installed in selected inventory scope, then applies text or JSON output. `--dry-run` and `--json` end pipeline before installation.
5. `installSkills()` prompts for scope and selected skills, unless flags skip prompts.
6. Installer runs `npx skills add <skill-id> -y`; global installation adds `-g`. Project installation runs with target project as working directory.

## Tests

Tests use Vitest and temporary filesystem fixtures. Current coverage validates:

- Framework, language, package manager, TypeScript, and Tailwind detection.
- Deep scan detection for auth, ORM, state management, monorepos, source files, and missing patterns.
- Test-file recognition without a declared test dependency.
- Display formatting for registry install counts.
- Registry caching, installed-skill inventory, deterministic filtering and ranking, CLI options, JSON output, and non-installing report modes.

Run all tests:

```bash
npm test
```

Add scanner tests with temporary files. Keep registry and installer tests isolated from real `npx` calls; external command execution requires mocks or explicit integration testing.
