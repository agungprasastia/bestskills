# ADR-001: Use Static Scanning and the Skills Registry

## Status

Accepted

## Date

2026-08-07

## Context

bestskills must recommend agent skills from a project codebase and install user-selected results. The solution needs to work without API credentials and must support project-local or global skill installation.

## Decision

Use static local project analysis to detect files, framework configuration, and package dependencies. Convert detections into targeted search queries for `npx skills find`. Install chosen registry results with `npx skills add`.

Ask interactive users to select project or global installation scope. In non-interactive `--auto` mode, default to project scope. `--project` and `--global` override this default.

## Alternatives Considered

### LLM-Powered Project Analysis

An LLM could infer recommendations from source content. Rejected because it requires API configuration, adds latency and cost, produces less predictable results, and exceeds current need.

### Global-Only Installation

Rejected because repository-specific skills should remain versioned and scoped to their target project.

### Project-Only Installation

Rejected because reusable personal workflows need a user-level installation option.

## Consequences

- Recommendations are deterministic from maintained detection and query maps.
- Scanner remains offline and dependency-light; registry access still requires network connectivity.
- New technology support requires an explicit scanner rule and registry-query mapping.
- A failed skill installation does not stop installation of other selected skills.
