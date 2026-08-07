# Task 7 Report

## Changes

- Documented `--dry-run`, `--json`, `--max`, `--category`, and `--no-cache` in README and user guide.
- Recorded report-only behavior, project-default inventory scope, and default maximum of 10.
- Updated development layout and runtime pipeline for cache, installed-skill filtering, output modes, and test files.
- Updated ADR consequences for 24-hour cache, installed-skill filtering, deterministic relevance rules, and report-only JSON.

## Scope

- Left prior CLI test gaps unchanged. Documentation-only task required no behavior changes.

## Verification

- `npm test && node bin/bestskills.js scan --help`: 6 test files passed, 31 tests passed; help lists `--dry-run`, `--json`, `--max`, `--category`, and `--no-cache`.

## Commit

- Pending.
