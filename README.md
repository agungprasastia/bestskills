<div align="center">

```
██████╗ ███████╗███████╗████████╗███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
██████╔╝█████╗  ███████╗   ██║   ███████╗█████╔╝ ██║██║     ██║     ███████╗
██╔══██╗██╔══╝  ╚════██║   ██║   ╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
██████╔╝███████╗███████║   ██║   ███████║██║  ██╗██║███████╗███████╗███████║
╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝
```

**Scan a codebase. Find relevant agent skills. Install with one command.**

[![Release](https://img.shields.io/github/v/release/agungprasastia/bestskills?style=flat-square)](https://github.com/agungprasastia/bestskills/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

`bestskills` scans a project, detects its framework, tooling, and missing patterns, then recommends relevant agent skills from the [skills registry](https://skills.sh/) and installs the ones you pick — into the project or your global user scope.

---

## Features

- **Smart detection** — herds frameworks, tools, test suites, auth, ORM, monorepos, CI, and missing patterns like `no-tests` or `.env.example`.
- **Registry-powered recommendations** — queries [skills.sh](https://skills.sh/) and ranks by relevance and install count.
- **Already-installed filtering** — skips skills you already have in the target scope.
- **Interactive scopes** — install to a project or globally, with a prompt or via flags.
- **Safe report modes** — `--dry-run` and `--json` preview without touching anything.
- **24-hour cache** — registry lookups are cached (override with `--no-cache`).

## Requirements

- The compiled `bestskills` binary runs standalone — **no Node.js needed**.
- Node.js 18+ and npm are required only for registry operations, which delegate to `npx skills find` and `npx skills add`.

## Install

Grab the latest binary from [releases](https://github.com/agungprasastia/bestskills/releases):

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/agungprasastia/bestskills/main/scripts/install.sh | bash

# Windows (PowerShell)
irm https://raw.githubusercontent.com/agungprasastia/bestskills/main/scripts/install.ps1 | iex
```

Or build it yourself with [Bun](https://bun.sh):

```bash
git clone https://github.com/agungprasastia/bestskills.git
cd bestskills
bun install
bun run build
./dist/bestskills --help
```

## Quick Start

```bash
# Scan the current directory — choose project or global scope interactively.
bestskills

# Scan a specific project with deep pattern checks.
bestskills ~/Projects/my-app --deep

# Install every recommendation into the target project, no prompts.
bestskills ~/Projects/my-app --auto --project

# Install every recommendation globally, no prompts.
bestskills ~/Projects/my-app --auto --global

# Preview the top five testing skills without installing.
bestskills ~/Projects/my-app --dry-run --category testing --max 5

# Emit report-only JSON for the project scope.
bestskills ~/Projects/my-app --json

# Skip the 24-hour cache for a fresh search.
bestskills ~/Projects/my-app --no-cache
```

## Usage

```text
bestskills [options] [path]
```

| Option | Description |
| --- | --- |
| `path` | Project directory to scan (default: `.`). |
| `--deep` | Detect test files, auth, ORM, state libraries, monorepos, source-file count, and missing patterns. |
| `--dry-run` | Print recommendations without installing. |
| `--json` | Emit report-only JSON without installing (default scope: project). |
| `--max <number>` | Limit recommendations to a positive integer (default: `10`). |
| `--category <name>` | Filter by category: `testing`, `quality`, `devops`, `security`, `design`, `framework`. |
| `--no-cache` | Bypass the 24-hour registry query cache. |
| `-p, --project` | Install into the target project root. |
| `-g, --global` | Install into the global user scope. |
| `--auto` | Auto-select every recommendation (defaults to project unless scope is given). |
| `-h, --help` | Show help. |

## Documentation

- [User guide](docs/user-guide.md)
- [Development guide](docs/development.md)
- [Architecture decisions](docs/decisions/)

## Testing

```bash
bun install
bun run test
```

## License

MIT