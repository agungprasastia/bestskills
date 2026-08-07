# bestskills

Scan a codebase, find relevant agent skills from the [skills registry](https://skills.sh/), and install selected skills into the project or global user scope.

## Requirements

- Node.js 18 or newer
- npm
- Network access for `npx skills find` and `npx skills add`

## Install

```bash
git clone <repository-url> bestskills
cd bestskills
npm install
npm link
```

`npm link` makes the `bestskills` command available globally from this checkout.

## Quick Start

```bash
# Scan current directory. Choose project or global scope interactively.
bestskills scan

# Scan a specific project with additional pattern checks.
bestskills scan ~/Projects/my-app --deep

# Install every recommendation into target project without prompts.
bestskills scan ~/Projects/my-app --auto --project

# Install every recommendation globally without prompts.
bestskills scan ~/Projects/my-app --auto --global
```

## Commands

```text
bestskills scan [path]
```

| Option | Description |
| --- | --- |
| `--deep` | Detect test files, auth, ORM, state libraries, monorepos, source-file count, and missing patterns. |
| `--auto` | Select every recommendation without a skill-selection prompt. Defaults to project installation unless scope is specified. |
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
