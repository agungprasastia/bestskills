# bestskills

Scan a codebase, find relevant agent skills from the [skills registry](https://skills.sh/), and install selected skills into the project or global user scope.

## Requirements

The compiled `dist/bestskills` binary runs standalone without Node.js. Node.js 18 or newer, npm, and network access are still required for registry operations, which delegate to `npx skills find` and `npx skills add`.

## Install

Build a standalone binary with bun:

```bash
git clone <repository-url> bestskills
cd bestskills
bun install
bun run build
./dist/bestskills --help
```

## Quick Start

```bash
# Scan current directory. Choose project or global scope interactively.
bestskills

# Scan a specific project with additional pattern checks.
bestskills ~/Projects/my-app --deep

# Install every recommendation into target project without prompts.
bestskills ~/Projects/my-app --auto --project

# Install every recommendation globally without prompts.
bestskills ~/Projects/my-app --auto --global

# Report up to five testing recommendations without installing.
bestskills ~/Projects/my-app --dry-run --category testing --max 5

# Emit report-only JSON for project-scope inventory.
bestskills ~/Projects/my-app --json

# Ignore 24-hour registry cache for a fresh search.
bestskills ~/Projects/my-app --no-cache
```

## Commands

```text
bestskills [path]
```

| Option | Description |
| --- | --- |
| `--deep` | Detect test files, auth, ORM, state libraries, monorepos, source-file count, and missing patterns. |
| `--auto` | Select every recommendation without a skill-selection prompt. Defaults to project installation unless scope is specified. |
| `--dry-run` | Print recommendations without installing. |
| `--json` | Emit report-only JSON without installing. Default inventory scope is project. |
| `--max <number>` | Limit recommendations to a positive integer. Default: `10`. |
| `--category <name>` | Filter recommendations: `testing`, `quality`, `devops`, `security`, `design`, or `framework`. |
| `--no-cache` | Bypass the 24-hour registry query cache. |
| `-p, --project` | Install into target project root. |
| `-g, --global` | Install into global user scope. |
| `-h, --help` | Show command help. |

## Testing

```bash
npm test
```

## Documentation

- [User guide](docs/user-guide.md)
- [Development guide](docs/development.md)
- [Architecture decisions](docs/decisions/)
