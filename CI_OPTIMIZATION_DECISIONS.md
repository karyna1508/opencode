# CI Optimization Decisions and Evidence

This document records the CI optimization decisions applied to `test` workflow in `.github/workflows/test.yml`, why they were made, and what trace evidence shows after each iteration.

## Scope

- Workflow: `test` (`.github/workflows/test.yml`)
- Trace sets:
  - Baseline: `traces/trace-e2e.jsonl`, `traces/trace-unit.jsonl`
  - Iteration 1: `traces/trace-e2e-1.jsonl`, `traces/trace-unit-1.jsonl`
  - Iteration 2: `traces/trace-e2e-2.jsonl`, `traces/trace-unit-2.jsonl`
  - Iteration 3 (cache warm check): `traces/trace-e2e-3.jsonl`, `traces/trace-unit-3.jsonl`

## Decision Log

### 1) Remove `unit -> e2e` job dependency to unlock parallelism

- **Change made**
  - Removed `needs: unit` from `e2e` job in `.github/workflows/test.yml`.
- **Motivation**
  - `unit` and `e2e` test scopes are independent; serializing them extended wall clock time without adding signal quality.
- **Evidence**
  - Baseline job durations:
    - `unit (linux)`: `189.592s`
    - `e2e (linux)`: `527.760s`
  - If serialized (old model), critical path is approximately `717.352s` (sum).
  - Iteration 1 (parallel model) critical path is approximately `540.495s` (max of `unit`/`e2e`).
  - **Estimated wall-clock gain:** `~176.857s` (~24.7% reduction vs serialized baseline model).
- **Outcome**
  - High-impact improvement to total workflow time by reducing the critical path.

### 2) Add Playwright browser cache and gate install on cache hit

- **Change made**
  - Set `PLAYWRIGHT_BROWSERS_PATH` to `~/.cache/ms-playwright`.
  - Added `Cache Playwright browsers` step (`actions/cache@v4`).
  - Added condition to `Install Playwright browsers`:
    - `if: steps.pw-cache.outputs.cache-hit != 'true'`
- **Motivation**
  - Browser download/install is setup overhead and should be reused when dependency-compatible.
- **Evidence**
  - Baseline and later traces consistently show `Install Playwright browsers` as a material setup step:
    - Baseline: `42s`
    - Iteration 1: `51s`
    - Iteration 2: `26s`
    - Iteration 3: `25s`
  - Cache step executes quickly (`~1s`) in iterations with caching enabled.
- **Outcome**
  - Setup cost became controllable and prepared the workflow for cache-hit skip behavior.
  - Full skip did not occur yet in observed traces (see iteration 3 notes).

### 3) Install only required browser (`chromium`) and stabilize cache key

- **Change made**
  - Updated matrix install command to:
    - `bunx playwright install --with-deps chromium`
  - Refined cache key to hash only `packages/app/package.json`.
- **Motivation**
  - `packages/app/playwright.config.ts` runs only Chromium; downloading extra browsers is unnecessary.
  - Reducing cache key volatility should improve cache reuse probability.
- **Evidence**
  - `Install Playwright browsers` duration:
    - Iteration 1: `51s`
    - Iteration 2: `26s`
    - Iteration 3: `25s`
  - **Measured gain vs iteration 1:** `~25-26s` on install step.
  - E2E job with same test duration in iteration 1 vs 2:
    - `Run app e2e tests`: `452s` in both
    - `e2e (linux)` improved from `540.495s` to `532.285s` (net `~8.21s`, affected by run noise in other setup steps).
- **Outcome**
  - Clear reduction in install-time overhead on cache-miss paths.

## Performance Summary by Iteration

| Metric | Baseline | Iteration 1 | Iteration 2 | Iteration 3 |
|---|---:|---:|---:|---:|
| `e2e (linux)` job duration | 527.760s | 540.495s | 532.285s | 542.217s |
| `Install Playwright browsers` | 42s | 51s | 26s | 25s |
| `Run app e2e tests` | 456s | 452s | 452s | 477s |
| `unit (linux)` job duration | 189.592s | 183.082s | 185.665s | 189.982s |
| `Run unit tests` | 144s | 142s | 141s | 147s |

## Interpretation

- The biggest structural gain came from **parallelizing `unit` and `e2e`** (critical path reduction).
- The most reliable setup gain came from **Chromium-only Playwright install**, reducing install time by ~25s compared to iteration 1.
- Cache warming did **not** yet show a skip of Playwright install in iteration 3; install still ran for ~25s.
- Iteration 3 overall was slower primarily because `Run app e2e tests` regressed (`452s -> 477s`), which dominates total e2e runtime.

## Remaining Risk / Next Check

- Because e2e failed in observed runs, cache save/restore behavior may not be consistently reaching a fully warm state for the install-skip condition.
- Next validation should confirm a successful run and check whether `Install Playwright browsers` is skipped entirely on subsequent runs.
