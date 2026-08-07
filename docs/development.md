# Development Guide

## Setup

```bash
bun install
bun run test
```

Run local CLI without linking it:

```bash
bun bin/bestskills.js /path/to/project --deep
```

## Build

Build the standalone host-native binary with Bun:

```bash
bun install
bun run build
```

The build writes a single compiled binary to `dist/bestskills` (`dist/bestskills.exe` on Windows). The binary runs without Node.js; only registry operations (`npx skills find`, `npx skills add`) require Node.js 18 or newer with npm. `dist/` is gitignored, so the binary is a build artifact and is never committed.

## Release

Build and package the current platform into `dist/bestskills-<platform>-<arch>.tar.gz` (or `.zip` on Windows):

```bash
scripts/build-release.sh
```

Releases are cross-compiled by GitHub Actions. Tag `vX.Y.Z` to trigger `.github/workflows/release.yml`, which builds linux-x64, linux-arm64, darwin-x64, darwin-arm64, and windows-x64 via `bun build --compile --target=bun-<platform>-<arch>`, packages each, and creates a GitHub release with release notes from git tags. Installers (`scripts/install.sh`, `scripts/install.ps1`) download the matching asset from the latest release.

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
bun run test
```

Add scanner tests with temporary files. Keep registry and installer tests isolated from real `npx` calls; external command execution requires mocks or explicit integration testing.
