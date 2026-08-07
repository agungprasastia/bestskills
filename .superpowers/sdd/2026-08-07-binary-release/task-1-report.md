# Task 1 Report

## Changes

- Moved scan argument, options, and action from `bestskills scan` to root `bestskills [path]`.
- Added a child-process help regression test for root usage, `--deep`, and absence of `scan [options]`.

## Verification

- RED: `./node_modules/.bin/vitest run test/cli.test.js` failed because help showed `bestskills [options] [command]` and `scan [options] [path]`.
- GREEN: `./node_modules/.bin/vitest run test/cli.test.js` passed: 6 tests.
- Help: `node bin/bestskills.js --help` showed `Usage: bestskills [options] [path]` and `--deep`.
- Full: `npm test` passed: 6 files, 33 tests.
