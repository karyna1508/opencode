---
name: trace-ci-optimizer
description: Reads FastCI/OpenTelemetry trace data from .jsonl files, identifies CI bottlenecks, and proposes concrete workflow optimizations. Use when editing workflow files, analyzing traces, or optimizing CI pipelines.
---

# Trace CI Optimizer

## When to use

Use this skill when the task includes:
- editing `.github/workflows/*.yml`
- analyzing `traces/*.jsonl`
- optimizing CI pipelines or workflow performance

## Scope selection (mandatory)

Choose scope before analysis:

1. **Workflow editing case**
   - If the task edits one or more workflow files, treat those workflows as the only scope.
   - For each edited workflow, find the latest related trace files and analyze them before proposing edits.

2. **Trace analysis / CI optimization case**
   - If the task is trace analysis or CI optimization (without a specific workflow edit), loop through all existing workflow files in `.github/workflows/`.
   - For each workflow in that loop, find the latest related trace files and analyze them.

## Inputs

- Workflow files in `.github/workflows/*.yml`
- Trace files in `traces/*.jsonl`
- Optional focus workflow file(s) when editing

## Workflow

Copy this checklist and keep it updated:

```md
Trace CI optimization progress:
- [ ] Select scope (edited workflow(s) or all workflows)
- [ ] Find latest related traces for each workflow in scope
- [ ] Validate chosen traces are parseable JSONL
- [ ] Build step and job duration summary
- [ ] Identify top bottlenecks and failure-heavy spans
- [ ] Map findings to workflow lines and job dependencies
- [ ] Propose ranked optimizations with risk and expected gain
- [ ] Apply changes to relevant workflow files
- [ ] Push workflow changes
- [ ] Ask user to run workflow(s) and copy new traces to `opencode/traces` (`traces/`)
- [ ] After user confirmation, compare old vs new traces
- [ ] If pipeline is broken, fix workflows and repeat validation
- [ ] If pipeline is healthy, ask whether to run another optimization iteration
- [ ] Produce the structured changes report
```

## Output boundary (mandatory)

- Suggest and implement changes only in CI workflow definitions (for example `.github/workflows/*.yml`).
- Do not suggest or edit:
  - application or library source code
  - test files or test logic
  - package manifests, lockfiles, or build scripts
  - infrastructure outside workflow files
- If a potential gain requires non-workflow changes, mark it as out of scope and provide a workflow-only alternative.

### 1) Resolve workflows in scope

- For workflow editing: use only edited workflow files.
- For trace analysis / CI optimization: iterate all files in `.github/workflows/`.
- For each workflow file:
  - read `name:` from YAML when present
  - use filename stem as fallback workflow identifier

### 2) Find latest related traces (required)

For each workflow in scope:
- Collect candidate files from `traces/*.jsonl`.
- Keep files that contain spans related to the workflow (match by workflow name, pipeline id, or clearly linked job spans).
- Prefer the newest matching files by modification time and run recency.
- If no related traces are found, explicitly report that and continue with the next workflow.

### 3) Validate and profile traces

- Read the trace files and confirm each line is valid JSON.
- Focus on span types:
  - workflow: `attributes["span.type"] == "workflow"`
  - job: `attributes["span.type"] == "job"`
  - step: `attributes["span.type"] == "step"`
- Key timing fields:
  - jobs: `attributes["job.duration_ms"]`
  - steps: `attributes["step.execution_time_seconds"]`
  - fallback: `start_time` / `end_time`

### 2) Build an evidence table

Create a short table with:
- Job name
- Total duration
- Longest steps (top 3)
- Failure status (`status.code`, `attributes["step.result"]`)
- Repeated setup overhead (checkout/setup/install/cache misses)

### 4) Convert findings into CI changes

Prioritize high-impact, low-risk edits first:
- move or split expensive tests
- increase parallelism (`needs`, matrix strategy)
- reduce repeated setup/download work
- tighten artifact upload conditions and retention
- adjust timeouts/retries only when backed by trace evidence

Always tie each recommendation to exact trace evidence and expected gain.
Every recommendation must be a workflow-file change only.

### 5) Produce output in this format

```md
## Workflow: <workflow name>

### Trace Findings
- <fact with metric and source span>

### Bottlenecks
1. <bottleneck> - <duration / share>

### Recommended CI Changes
1. <change>
   - Why: <trace evidence>
   - Expected impact: <time or reliability gain>
   - Risk: <low/med/high>
   - Effort: <S/M/L>

### Validation Plan
- Compare workflow total duration across at least 3 runs before/after.
- Track p50 and p95 job duration for changed jobs.
```

When looping all workflows, repeat this block once per workflow, then add:

```md
## Cross-workflow priorities
1. <highest global impact change>
2. <second highest global impact change>
```

## Completion criteria (mandatory)

The skill is complete only when all are done:
- relevant workflow files are updated in the workspace
- workflow changes are pushed
- user is asked to run the affected workflow(s) and place new traces in `opencode/traces` (`traces/`)
- after user confirms traces are copied, old vs new traces are compared
- pipeline health is checked from traces (no new failures in previously passing tests/steps)
- if regressions appear, workflow fixes are applied and pushed
- the report above is produced for the updated workflow scope
- if no regressions appear, user is asked whether to run another optimization pass; if yes, restart this skill loop

Do not stop at recommendations only.

## Post-change validation loop (mandatory)

After applying workflow edits:

1. Push workflow-only changes.
2. Ask the user to:
   - execute the relevant workflow(s)
   - download/copy fresh traces into `opencode/traces` (`traces/`)
3. Wait for user confirmation that new traces are present.
4. Compare baseline traces (before change) vs new traces (after change):
   - measure CI performance gain (duration deltas per workflow/job/critical path)
   - check pipeline health from trace failure signals (`status.code`, `step.result`, error spans)
   - confirm previously passing tests/steps did not start failing
5. If broken/regressed:
   - fix workflow files only
   - push fixes
   - ask user to rerun workflows and refresh traces
   - repeat comparison
6. If healthy:
   - ask user if they want another optimization iteration
   - if yes, run this skill again from scope selection
   - if no, finalize with the report

## Guardrails

- Do not treat test failures as performance wins.
- Do not suggest broad caching changes without cache hit/miss evidence.
- Distinguish setup overhead from test execution time.
- If traces conflict, call out uncertainty and propose a small experiment.
- Do not skip trace lookup: always find latest related traces first.
- Do not suggest non-workflow changes (code/tests/packages/scripts/infrastructure).

## Additional reference

- For trace query snippets and optimization heuristics, see [reference.md](reference.md).
