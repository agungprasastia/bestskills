# Task 5 Report

## Status

Implemented CLI recommendation modes and installed-skill filtering.

## Changes

- Added injectable `runScan()` in `lib/cli.js`.
- Added `--dry-run`, `--json`, `--max`, `--category`, and `--no-cache`.
- Excluded exact installed `skillId` values; JSON reports `skippedInstalled`.
- JSON mode emits one JSON payload to stdout and never installs.
- Inventory failures warn only in human mode.
- Added CLI behavior and validation tests.

## Tests

- `npx vitest run test/cli.test.js`: 4 passed.
- `npm test`: 28 passed.

## Concerns

- Brief says `useCache: !options.cache`, conflicting with Commander `--no-cache`. Implemented `useCache: options.cache`, so default caches and `--no-cache` bypasses cache.
