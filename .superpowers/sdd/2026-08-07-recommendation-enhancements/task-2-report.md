# Task 2 Report: Installed Skill Inventory

## Scope

Created only Task 2 production and test modules:

- `lib/installed.js`
- `test/installed.test.js`

Existing cache module remains unchanged and independent.

## Implementation

`getInstalledSkillIds({ scope, projectPath, runCommand })`:

- runs `npx skills list --json` in `projectPath`
- adds `--global` when `scope` is `global`
- parses JSON array entries using either `id` or `skillId`
- returns unique IDs as `Set`
- returns `null` on command, JSON parsing, or invalid-array failures
- defaults `runCommand` to promisified `execFile`

## Tests

Added coverage for:

- project command and target directory
- global command and `skillId` response entries
- command failure
- malformed JSON output

## Verification

Executed:

```sh
./node_modules/.bin/vitest run test/installed.test.js
npm test
```

Results:

- Inventory tests: 1 file, 4 tests passed
- Full suite: 4 files, 12 tests passed

## Concern

`npx skills list --json` command behavior is mocked at process boundary. CLI integration is intentionally outside Task 2 scope.

## Review Fix

Restricted returned IDs to strings. Numeric and null `id` or `skillId` values are discarded, preserving `Set<string>` contract.

Added regression coverage for numeric and null IDs.

Verification after fix:

- Inventory tests: 1 file, 5 tests passed
- Full suite: 4 files, 13 tests passed
