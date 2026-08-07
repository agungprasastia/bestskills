# User Guide

## Scan a Project

```bash
bestskills [path]
```

`path` defaults to the current directory. The scanner detects project files and package dependencies, then uses matching terms to search the online skills registry.

Quick scanning checks package and ecosystem files including `package.json`, `tsconfig.json`, language manifests, framework configs, test configs, Docker files, CI files, and selected service directories.

Detected technologies include Node.js frameworks, TypeScript, Tailwind, Prisma, Supabase, Docker, CI configuration, test frameworks, Python, Go, Rust, Ruby, and PHP.

## Deep Scan

```bash
bestskills ./my-project --deep
```

Deep scan also detects auth, ORM, state-management, and CSS dependencies. It checks for test files, estimates source-file count, finds common monorepo configuration, and reports missing tests, CI, or `.env.example` / `.env.local` files.

## Select Skills

After registry search completes, use arrow keys and space to choose skills. High-priority recommendations are selected initially. Press Enter to continue.

Recommendations are grouped by priority and include install count plus the detection that caused the recommendation.

## Choose Installation Scope

Without an explicit scope flag, bestskills asks where to install selected skills:

- **Project:** installs in scanned project root. This is useful for repository-specific workflows.
- **Global:** installs in user-level agent skill directories. This is useful for workflows reused across projects.

Use flags to skip the prompt:

```bash
bestskills ./my-project --project
bestskills ./my-project --global
```

`--auto` selects all recommendations. It installs to the project by default:

```bash
bestskills ./my-project --auto
bestskills ./my-project --auto --global
```

## Report Recommendations

Use `--dry-run` to display recommendations without installing. Use `--json` for machine-readable report-only output. Neither flag installs skills. Both default installed-skill inventory to project scope unless `--global` is supplied.

```bash
# Print recommendations without installing.
bestskills ./my-project --dry-run

# Emit report-only JSON without installing.
bestskills ./my-project --json

# Limit output. Default maximum is 10.
bestskills ./my-project --max 5

# Filter by category: testing, quality, devops, security, design, or framework.
bestskills ./my-project --category testing

# Refresh registry results instead of using 24-hour cached queries.
bestskills ./my-project --no-cache
```

## Troubleshooting

### No tech stack detected

Run the command from project root or pass the intended project directory explicitly:

```bash
bestskills /absolute/path/to/project
```

### Registry search returns no skills

Check network connectivity, then rerun. The registry might not contain skills for every detected technology.

### One skill fails to install

bestskills continues with remaining selections. Review the command error, then retry manually:

```bash
npx skills add <skill-id>
# or for global scope
npx skills add <skill-id> --global
```

For project installation, run manual command from project root.
