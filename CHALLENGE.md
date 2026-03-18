# FastCI Founding Engineer Home Task Report

## Context
- **Candidate:** Karyna
- **Date:** 2026-03-18
- **Repository:** `opencode`
- **Task goal:** Instrument one GitHub workflow with FastCI, analyze traces, and suggest optimizations.

## Selected Workflow
- **Workflow file:** `.github/workflows/test.yml` (`test`)
- **Why this workflow was chosen:** It has both `unit` and `e2e` jobs, making it a good candidate to measure critical-path and setup-overhead optimizations.
- **Primary jobs in scope:** `unit (linux)`, `e2e (linux)`

## Baseline (Before FastCI)
### Run Metadata
- **Commit SHA:** `922bb97`
- **Branch:** `fastci_challenge`
- **Run URL:** [test #16 (baseline)](https://github.com/karyna1508/opencode/actions/runs/23253206819)
- **Runner type:** Linux (GitHub-hosted)
- **Baseline run note:** 3 e2e tests fail in this run; failures are test-related and not caused by workflow configuration.

### Timing Snapshot
| Job | Duration | Queue Time | Notes |
|---|---:|---:|---|
| `unit (linux)` | `189.592s` | `n/a` | Baseline unit job duration from trace |
| `e2e (linux)` | `527.760s` | `n/a` | Baseline e2e job duration from trace |

### Initial Bottlenecks (Hypotheses)
- `unit -> e2e` serialization likely inflates workflow wall-clock by extending the critical path.
- Playwright browser installation appears as repeated setup overhead in e2e job runs.
- Browser install likely downloads more than required for current config and can be narrowed to Chromium.

## FastCI Instrumentation
### Configuration Changes
- **FastCI config file(s):** `fastci.config.json`
- **Workflow modifications:** Instrumented `test` workflow and iterated on dependency graph + Playwright cache/install strategy.
- **Version / action used:** `jfrog-fastci/fastci@v0`

### Diff Summary
- Removed `needs: unit` from `e2e` to run `unit` and `e2e` in parallel.
- Added Playwright cache via `actions/cache@v4` and gated browser install on cache hit.
- Reduced browser install scope to Chromium only and stabilized cache key input.

### Validation
- **Instrumentation status:** Successful; traces collected for baseline and 3 follow-up iterations.
- **Any setup caveats:** E2E failures persisted across observed runs and can affect cache warm-up behavior for full install-skip validation.

## Trace Analysis (After Instrumentation)
### Trace Visualization Tool
- **Tool:** `@opencode/traces/ui` (local path: `traces/ui`)
- **Purpose:** Provide a visual and interactive way to inspect FastCI trace spans beyond raw artifact files.
- **How it is used in this task:** Open exported trace files and inspect timeline ordering, duration distribution, and span-level details to identify bottlenecks and optimization candidates.
- **Key capabilities used for analysis:**
  - Timeline view of spans across the full run window
  - Sort/filter style inspection via span list controls
  - Duplicate span suppression (dedupe) to focus on latest relevant entries
  - Invalid-line counter to detect malformed trace input early

### Cursor Skill: `trace-ci-optimizer`
- **Location:** `.cursor/skills/trace-ci-optimizer`
- **Purpose:** Standardize FastCI trace analysis and CI optimization into an iterative, evidence-based workflow lifecycle.
- **What it adds:** A mandatory checklist covering scope selection, related-trace discovery, JSONL validation, bottleneck analysis, workflow-only change proposals, and structured reporting.
- **Validation loop:** Requires pushing workflow changes, rerunning affected workflows, collecting fresh traces, and comparing baseline vs new traces for both performance gains and regression signals.
- **Completion criteria:** Treats the work as complete only after trace-backed validation confirms pipeline health; otherwise it loops with additional workflow fixes.

### Trace Sources
- **Trace links / IDs:** Baseline run [test #16](https://github.com/karyna1508/opencode/actions/runs/23253206819); local trace sets in `traces/*.jsonl`
- **Sample size:** 4 trace sets (baseline + 3 iterations)
- **Observation window:** Baseline + Iteration 1/2/3 (`trace-*.jsonl` files listed below)
- **Trace files used:**
  - Baseline: `traces/trace-e2e.jsonl`, `traces/trace-unit.jsonl`
  - Iteration 1: `traces/trace-e2e-1.jsonl`, `traces/trace-unit-1.jsonl`
  - Iteration 2: `traces/trace-e2e-2.jsonl`, `traces/trace-unit-2.jsonl`
  - Iteration 3: `traces/trace-e2e-3.jsonl`, `traces/trace-unit-3.jsonl`

### Job-Level Findings
| Job | Baseline | Instrumented | Delta | Observation |
|---|---:|---:|---:|---|
| `unit (linux)` | `189.592s` | `183.082s` (iter 1) | `-6.510s` | Minor variation; not a dominant bottleneck |
| `e2e (linux)` | `527.760s` | `540.495s` (iter 1) | `+12.735s` | Single-run noise; job still dominates runtime |
| `critical path` (serialized model -> parallel model) | `~717.352s` | `~540.495s` (iter 1) | `-176.857s` | Major gain from parallelizing `unit` and `e2e` |

### Step-Level Findings
| Job | Step | Duration | Variance | Insight |
|---|---|---:|---:|---|
| `e2e (linux)` | `Run app e2e tests` | `456s` -> `452s` -> `452s` -> `477s` | High | Dominant step; test-time variability strongly impacts total runtime |
| `e2e (linux)` | `Install Playwright browsers` | `42s` -> `51s` -> `26s` -> `25s` | Medium | Chromium-only install reduced setup overhead by ~25s vs iter 1 |
| `unit (linux)` | `Run unit tests` | `144s` -> `142s` -> `141s` -> `147s` | Low-Med | Relatively stable compared with e2e execution time |

### Notable Patterns
- Parallelizing `unit` and `e2e` delivered the largest structural wall-clock improvement.
- E2E execution step is the primary variability driver and can mask setup-level gains.
- Playwright install overhead dropped significantly after switching to Chromium-only install.
- Cache step overhead is small, but full install-skip behavior was not yet observed in these traces.

## Optimization Suggestions
### High-Impact Opportunities
1. **Parallelize independent jobs (`unit` and `e2e`)**
   - **Why:** Removes unnecessary serialization in the critical path.
   - **Expected impact:** `~176.857s` wall-clock reduction vs serialized baseline model (`~24.7%`).
   - **Risk / trade-off:** Low; test scopes are independent.
   - **Implementation effort:** S

2. **Cache Playwright browsers and gate install on cache hit**
   - **Why:** Convert repeated browser setup from mandatory work to conditional work.
   - **Expected impact:** Reduces setup overhead on warm-cache paths; currently partial in observed runs.
   - **Risk / trade-off:** Medium; depends on cache warm/save behavior in successful runs.
   - **Implementation effort:** M

3. **Install only Chromium for e2e**
   - **Why:** Current Playwright config uses Chromium only; other browser downloads are unnecessary.
   - **Expected impact:** `~25-26s` reduction in Playwright install step vs iteration 1.
   - **Risk / trade-off:** Low if browser matrix remains Chromium-only.
   - **Implementation effort:** S

### Prioritized Plan
| Priority | Change | Expected Gain | Effort | Owner |
|---:|---|---|---|---|
| 1 | Remove `unit -> e2e` dependency | `~176.857s` on workflow critical path model | S | Candidate |
| 2 | Chromium-only Playwright install | `~25s` on browser install step | S | Candidate |
| 3 | Validate cache-hit install skip on clean successful rerun | Potential full install skip | M | Candidate |

## Validation Plan
- **How improvements will be measured:** Compare baseline and post-change traces at workflow/job/step level; track critical path and setup-step deltas.
- **Success criteria:** Preserve or improve pipeline health while reducing critical path and/or setup overhead; confirm cache-hit skip behavior on successful warm run.
- **Rollback criteria:** Any workflow change that introduces regressions in previously stable steps/jobs is reverted or revised.

## Final Results
### Before vs After Summary
| Metric | Before | After | Improvement |
|---|---:|---:|---:|
| Workflow total duration | Serialized model `~717.352s` | Parallel model `~540.495s` (iter 1) | `-176.857s` (`~24.7%`) |
| Critical path duration | `~717.352s` | `~540.495s` | `-176.857s` |
| CI cost estimate | Not explicitly measured | Expected to decrease with reduced wall-clock and setup overhead | Qualitative improvement only in this report |

### Outcome
- **Net result:** Largest measurable gain came from removing unnecessary job serialization; setup optimizations reduced Playwright install overhead but are partially masked by e2e runtime variance.
- **Key takeaway:** Structural parallelism produced the strongest improvement; next step is to validate full cache-hit install skip on a successful warm run.

## Appendix
### References
- Baseline run: [test #16](https://github.com/karyna1508/opencode/actions/runs/23253206819)
- Final run: [test #22](https://github.com/karyna1508/opencode/actions/runs/23266284525)
- Decision log and evidence: `CI_OPTIMIZATION_DECISIONS.md`
- Trace sets: `traces/trace-e2e*.jsonl`, `traces/trace-unit*.jsonl`

### Raw Notes
- E2E failures were treated as quality signals, not as performance wins.
- Final cache-hit skip validation should be run on a fully successful e2e pipeline execution.
