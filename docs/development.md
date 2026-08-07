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
lib/recommender.js    Detection-to-query mapping and registry result ranking
lib/installer.js      Scope picker, skill picker, and `npx skills add` execution
test/                 Vitest unit tests
docs/                 User, contributor, and decision documentation
```

## Runtime Flow

1. CLI resolves and validates target directory.
2. `scanProject()` builds a profile from files, directories, and package dependencies.
3. `getRecommendations()` maps detected technology and missing patterns to registry search queries.
4. `installSkills()` prompts for scope and selected skills, unless flags skip prompts.
5. Installer runs `npx skills add <skill-id> -y`; global installation adds `-g`. Project installation runs with target project as working directory.

## Tests

Tests use Vitest and temporary filesystem fixtures. Current coverage validates:

- Framework, language, package manager, TypeScript, and Tailwind detection.
- Deep scan detection for auth, ORM, state management, monorepos, source files, and missing patterns.
- Test-file recognition without a declared test dependency.
- Display formatting for registry install counts.

Run all tests:

```bash
npm test
```

Add scanner tests with temporary files. Keep registry and installer tests isolated from real `npx` calls; external command execution requires mocks or explicit integration testing.
