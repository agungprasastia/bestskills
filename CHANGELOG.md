# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-07

### Added
- **Initial Release of `bestskills`** — CLI tool to scan codebases, query the [skills.sh](https://skills.sh/) registry, and install agent skills.
- **Root CLI Interface** — `bestskills [options] [path]` root command with interactive scope/skill prompt.
- **ASCII Art Terminal Banner** — Custom cyan `BESTSKILLS` header banner in terminal scan output.
- **Tech Stack & Tooling Scanner** — Automatic detection of:
  - Frameworks: React, Vue, Next.js, Nuxt, Svelte, Angular, Express, Fastify, NestJS, Hono.
  - Languages: TypeScript, JavaScript, Python, Go, Rust, Ruby, PHP.
  - Test Suites & Folders: Vitest, Jest, Playwright, Cypress, Mocha, plus root test directories (`tests/`, `test/`, `spec/`, `__tests__/`) and multi-language test files (`*.rs`, `*.py`, `*.go`, `*.php`, `*.rb`).
  - Quality & Styling: Biome, ESLint, Prettier, Tailwind CSS.
  - DevOps & Workspaces: Husky, Lefthook, Turborepo, Nx, Cloudflare Workers, Railway, pnpm/npm/yarn monorepos.
  - Deep Analysis (`--deep`): Auth libraries, ORMs, state management, source file metrics (~LOC), and missing project patterns (`no-tests`, `no-ci`, `no-env-example`).
- **Registry Recommendation Engine** — Query integration with [skills.sh](https://skills.sh/) with relevance filters, priority ranking, category filtering (`--category`), `--max` limits, and automatic filtering of broken/unresponsive repos.
- **24-Hour Registry Cache** — Local query caching stored at `~/.cache/bestskills/registry.json` (`--no-cache` to bypass).
- **Installed Skill Inventory Filter** — Automatic pre-scan check (`npx skills list --json`) to skip already-installed skills.
- **Polished Terminal UI** — Truncated skill labels, clean priority dividers, short choice summary output to prevent word-wrap, and non-blocking 25-second download timeouts per skill.
- **Scope & Execution Control** — Non-interactive `--auto` mode, report-only inspection (`--dry-run` and `--json`), and scope targeting (`-g/--global`, `-p/--project`).
- **Standalone Native Binaries** — Cross-platform executables compiled via Bun (`linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows-x64`).
- **One-Line Installers** — Shell installer `install.sh` (macOS/Linux) and PowerShell installer `install.ps1` (Windows).
- **Developer Tooling** — Added `vitest.config.js` and npm scripts (`bun run dev`, `bun run build:dev`, `bun run test:watch`).
- **GitHub Actions Workflows** — Automated multi-OS CI testing (`ci.yml`) and automated release packaging/publishing on tag `v*` (`release.yml`).
