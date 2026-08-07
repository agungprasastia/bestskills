# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-07

### Added
- **Root CLI Command** — Simplified command line interface `bestskills [options] [path]`.
- **Bun Cross-Platform Binary Build** — Compiled standalone native binaries for `linux-x64`, `linux-arm64`, `darwin-x64`, `darwin-arm64`, and `windows-x64`.
- **Project Scanner** — Automatic detection for frameworks, TypeScript, CSS frameworks, Docker, CI/CD, package managers, languages, test frameworks, auth/ORM libraries, state management, monorepos, and missing project patterns (`no-tests`, `no-ci`, `no-env-example`).
- **Registry Recommendations** — Recommendation engine querying [skills.sh](https://skills.sh/) with relevance filters, deterministic priority ranking, and 24-hour local caching (`~/.cache/bestskills/registry.json`).
- **Interactive & Automated Installation** — Support for interactive skill selection and installation to project or global (`-g/--global`) scope via `npx skills add`.
- **CLI Output Modes** — Added `--deep`, `--auto`, `--dry-run`, `--json`, `--max`, `--category`, `-g/--global`, `-p/--project`, and `--no-cache` flags.
- **ASCII Art Banner** — Custom `BESTSKILLS` banner displayed in terminal scan output.
- **Installer Scripts & Workflows** — Single-command installation scripts (`install.sh` and `install.ps1`) and GitHub Actions release automation.
