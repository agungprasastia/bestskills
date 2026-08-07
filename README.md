<div align="center">

```
██████╗ ███████╗███████╗████████╗███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
██████╔╝█████╗  ███████╗   ██║   ███████╗█████╔╝ ██║██║     ██║     ███████╗
██╔══██╗██╔══╝  ╚════██║   ██║   ╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
██████╔╝███████╗███████║   ██║   ███████║██║  ██╗██║███████╗███████╗███████║
╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝
```

### Automated Skill Recommender & Installer for AI Coding Agents

[![CI](https://github.com/agungprasastia/bestskills/actions/workflows/ci.yml/badge.svg)](https://github.com/agungprasastia/bestskills/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/agungprasastia/bestskills?style=flat-square&color=blue)](https://github.com/agungprasastia/bestskills/releases)
[![Bun](https://img.shields.io/badge/Bun-1.3+-black?style=flat-square&logo=bun)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Supported Stack](#supported-stack) • [CLI Reference](#cli-reference) • [Documentation](#documentation)

</div>

---

## Overview

**`bestskills`** is an intelligent CLI tool designed for developers using AI agent frameworks. It analyzes your codebase—detecting languages, frameworks, testing suites, ORMs, auth systems, CI/CD setups, and missing patterns—then automatically queries the [skills.sh](https://skills.sh/) registry to recommend and install the exact agent skills your project needs.

```
 ┌──────────────┐     ┌────────────────┐     ┌──────────────────┐     ┌──────────────────┐
 │  Scan Code   │ ──> │ Query Registry │ ──> │ Filter Installed │ ──> │ Install Skills   │
 │ (Stack & LOC)│     │  (skills.sh)   │     │  & Relevance     │     │ (npx skills add) │
 └──────────────┘     └────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Features

- **⚡ Zero-Config Detection** — Instantly identifies 30+ frameworks, libraries, tools, and missing conventions (e.g. `no-tests`, `no-ci`, `no-env-example`).
- **🔍 Registry Intelligence** — Queries [skills.sh](https://skills.sh/) with smart relevance exclusions (filters out incompatible cross-stack matches like React Native or GSAP when inappropriate).
- **🚀 Dual Scope Support** — Install recommended skills directly into the target **project root** or your **global user scope**.
- **📦 Deduplication & Cache** — Inspects currently installed skills to prevent duplicate prompts and caches registry responses locally for 24 hours (`~/.cache/bestskills/registry.json`).
- **🛡️ Safe Inspection Modes** — Non-destructive `--dry-run` and structured `--json` output modes for script automation and CI integration.
- **🚀 Native Standalone Executable** — Compiled with Bun for zero-dependency execution across Linux, macOS, and Windows.

---

## Installation

### One-Line Installers (Recommended)

**macOS / Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/agungprasastia/bestskills/main/scripts/install.sh | bash
```

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/agungprasastia/bestskills/main/scripts/install.ps1 | iex
```

### Build from Source

Requirements: [Bun 1.3+](https://bun.sh)

```bash
git clone https://github.com/agungprasastia/bestskills.git
cd bestskills
bun install
bun run build
./dist/bestskills --help
```

---

## Quick Start

```bash
# Interactive scan in the current directory
bestskills

# Deep pattern scan on a specific repository
bestskills ~/Projects/my-app --deep

# Non-interactive auto-installation into project root
bestskills ~/Projects/my-app --auto --project

# Preview testing-category recommendations without installing
bestskills ~/Projects/my-app --dry-run --category testing --max 5

# Export structured JSON report for CI pipelines
bestskills ~/Projects/my-app --json

# Bypass the 24-hour query cache for fresh registry results
bestskills ~/Projects/my-app --no-cache
```

---

## Supported Stack

`bestskills` automatically profiles your project structure and dependencies:

| Category | Supported Detectors |
| --- | --- |
| **Frameworks** | React, Vue, Next.js, Nuxt, Svelte, Angular, Express, Fastify, NestJS, Hono |
| **Languages** | TypeScript, JavaScript, Python, Go, Rust |
| **Styling & UI** | Tailwind CSS |
| **Quality Tools** | Biome, ESLint, Prettier |
| **DevOps & Tools** | Docker, GitHub Actions, GitLab CI, Husky, Lefthook, Turborepo, Nx, Cloudflare Workers, Railway, Monorepos |
| **Deep Scan (`--deep`)** | Auth (NextAuth, Clerk, Auth0, Supabase), ORM (Prisma, Drizzle, TypeORM), State (Zustand, Redux, Pinia), Source metrics (~LOC) |

---

## CLI Reference

```text
bestskills [options] [path]
```

### Options

| Flag | Short | Description | Default |
| --- | --- | --- | --- |
| `path` | | Directory path of the target project | `.` |
| `--deep` | | Enable deep pattern analysis (auth, ORM, state, monorepo, LOC) | `false` |
| `--auto` | | Auto-install all recommendations without interactive prompts | `false` |
| `--dry-run` | | Print recommendations without installing | `false` |
| `--json` | | Emit machine-readable JSON output | `false` |
| `--max` | | Maximum number of recommendations to retrieve | `10` |
| `--category` | | Filter by category (`testing`, `quality`, `devops`, `security`, `design`, `framework`) | All |
| `--no-cache` | | Bypass the 24-hour local registry cache | `false` |
| `--project` | `-p` | Force installation into target project root | Interactive |
| `--global` | `-g` | Force installation into global user scope | Interactive |
| `--help` | `-h` | Display help information | |
| `--version` | `-V` | Output version number | |

---

## Prerequisites

- **Binary Execution:** Standalone compiled binaries run natively without Node.js.
- **Registry Installation:** Node.js 18+ and `npm` are required during the installation phase, as `bestskills` delegates execution to `npx skills add`.

---

## Documentation

- 📘 [User Guide](docs/user-guide.md) — Usage workflows and flag combinations
- 🛠️ [Development Guide](docs/development.md) — Architecture, testing, and build scripts
- 📜 [Changelog](CHANGELOG.md) — Release notes and version history
- 📄 [License](LICENSE) — MIT License

---

## Development & Testing

```bash
# Run CLI directly from source during development
bun run dev -- ~/Projects/my-app --deep

# Build a quick local binary (without .tar.gz packaging)
bun run build:dev

# Run all unit tests
bun run test

# Run tests in watch mode
bun run test:watch
```

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more details.
