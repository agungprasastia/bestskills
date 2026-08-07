# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-07

### Added
- **Root CLI Interface** — `bestskills [options] [path]` root command interface with default target path `.`.
- **ASCII Art Banner** — Custom `BESTSKILLS` banner header in CLI scan outputs.
- **Scanner Tooling & Stack Detection** — Automatic codebase profiling:
  - Frameworks: React, Vue, Next.js, Nuxt, Svelte, Angular, Express, Fastify, NestJS, Hono.
  - Languages & Types: TypeScript, JavaScript, Python, Go, Rust.
  - Styling & UI: Tailwind CSS.
  - Quality Tools: Biome, ESLint, Prettier.
  - DevOps & Workspaces: Husky, Lefthook, Turborepo, Nx, Cloudflare Workers, Railway, pnpm/npm/yarn workspaces.
  - Deep Scan (`--deep`): Auth (NextAuth, Clerk, Auth0, Supabase), ORM (Prisma, Drizzle, TypeORM), State Management (Zustand, Redux, Pinia), Monorepo detection, file counts (~LOC), and missing pattern checks (`no-tests`, `no-ci`, `no-env-example`).
- **Registry Recommendation Engine** — Query integration with [skills.sh](https://skills.sh/) registry:
  - Relevance exclusions (React Native, Clerk, GSAP, React Email).
  - Deterministic priority ranking and limit controls (`--max`, default `10`).
  - Category filtering (`--category`: `testing`, `quality`, `devops`, `security`, `design`, `framework`).
- **Registry Query Cache** — 24-hour local response caching stored at `~/.cache/bestskills/registry.json` with `--no-cache` bypass option.
- **Installed Skill Inventory** — Pre-scan check against `npx skills list --json` to filter out already-installed skills for target scope.
- **Interactive & Automated Installation** — Support for interactive scope/skill picker and non-interactive `--auto` mode using `npx skills add` with `-g/--global` and `-p/--project` scope flags.
- **Report-Only & Output Modes** — Safe inspection with `--dry-run` and `--json` outputs.
- **Standalone Bun Binary Builder** — Shell build script `scripts/build-release.sh` using `bun build --compile` for cross-platform executables (`linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, `windows-x64`).
- **One-Line Install Scripts** — `scripts/install.sh` (macOS/Linux via `curl | bash`) and `scripts/install.ps1` (Windows via PowerShell `irm | iex`).
- **GitHub Actions CI/CD** — `.github/workflows/ci.yml` (multi-OS testing on Ubuntu, macOS, Windows) and `.github/workflows/release.yml` (automated binary cross-compilation, packaging `.tar.gz`/`.zip`, and GitHub Releases publishing on tag `v*`).
- **Comprehensive Documentation** — Detailed `README.md`, `docs/user-guide.md`, `docs/development.md`, and architectural records.

### Changed
- Migrated package manager and development runtime from Node.js/npm to Bun (`bun.lock`, `bun install`, `bun run test`, `bun run build`).
- Replaced sub-command `bestskills scan [path]` with root CLI `bestskills [options] [path]`.
- Consolidated build process from `scripts/build.mjs` to `scripts/build-release.sh`.
- Set default branch to `main`.

### Fixed
- Preserved interactive scope prompt when neither `--project` nor `--global` is explicitly supplied.
- Corrected registry cache file path handling and directory creation.
- Filtered unsupported or invalid installed skill IDs gracefully.
- Handled Windows packaging path separators and missing command error checks in build scripts.
- Resolved CI release workflow dependencies for `bun install` step and changelog extraction.
