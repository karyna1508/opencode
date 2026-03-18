# FastCI Founding Engineer Home Task Report

## Context
- **Candidate:** <!-- your name -->
- **Date:** <!-- YYYY-MM-DD -->
- **Repository:** `opencode`
- **Task goal:** Instrument one GitHub workflow with FastCI, analyze traces, and suggest optimizations.

## Selected Workflow
- **Workflow file:** <!-- e.g. .github/workflows/test.yml -->
- **Why this workflow was chosen:** <!-- rationale -->
- **Primary jobs in scope:** <!-- list jobs -->

## Baseline (Before FastCI)
### Run Metadata
- **Commit SHA:** <!-- sha -->
- **Branch:** <!-- branch -->
- **Run URL:** [test #16 (baseline)](https://github.com/karyna1508/opencode/actions/runs/23253206819)
- **Runner type:** <!-- ubuntu/mac/windows + size -->
- **Baseline run note:** 3 e2e tests fail in this run; failures are test-related and not caused by workflow configuration.

### Timing Snapshot
| Job | Duration | Queue Time | Notes |
|---|---:|---:|---|
| <!-- job --> | <!-- mm:ss --> | <!-- mm:ss --> | <!-- note --> |

### Initial Bottlenecks (Hypotheses)
- <!-- hypothesis 1 -->
- <!-- hypothesis 2 -->
- <!-- hypothesis 3 -->

## FastCI Instrumentation
### Configuration Changes
- **FastCI config file(s):** <!-- paths -->
- **Workflow modifications:** <!-- summary -->
- **Version / action used:** <!-- version -->

### Diff Summary
- <!-- key change 1 -->
- <!-- key change 2 -->
- <!-- key change 3 -->

### Validation
- **Instrumentation status:** <!-- success/failure -->
- **Any setup caveats:** <!-- caveats -->

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
- **Trace links / IDs:** <!-- links or ids -->
- **Sample size:** <!-- number of runs -->
- **Observation window:** <!-- dates/runs -->

### Job-Level Findings
| Job | Baseline | Instrumented | Delta | Observation |
|---|---:|---:|---:|---|
| <!-- job --> | <!-- mm:ss --> | <!-- mm:ss --> | <!-- +/- --> | <!-- insight --> |

### Step-Level Findings
| Job | Step | Duration | Variance | Insight |
|---|---|---:|---:|---|
| <!-- job --> | <!-- step --> | <!-- mm:ss --> | <!-- low/med/high --> | <!-- insight --> |

### Notable Patterns
- <!-- cache hit/miss behavior -->
- <!-- parallelism / serialization -->
- <!-- flaky or variable steps -->
- <!-- dependency/download overhead -->

## Optimization Suggestions
### High-Impact Opportunities
1. **<!-- optimization title -->**
   - **Why:** <!-- reasoning -->
   - **Expected impact:** <!-- estimate -->
   - **Risk / trade-off:** <!-- risk -->
   - **Implementation effort:** <!-- S/M/L -->

2. **<!-- optimization title -->**
   - **Why:** <!-- reasoning -->
   - **Expected impact:** <!-- estimate -->
   - **Risk / trade-off:** <!-- risk -->
   - **Implementation effort:** <!-- S/M/L -->

3. **<!-- optimization title -->**
   - **Why:** <!-- reasoning -->
   - **Expected impact:** <!-- estimate -->
   - **Risk / trade-off:** <!-- risk -->
   - **Implementation effort:** <!-- S/M/L -->

### Prioritized Plan
| Priority | Change | Expected Gain | Effort | Owner |
|---:|---|---|---|---|
| 1 | <!-- change --> | <!-- gain --> | <!-- effort --> | <!-- owner --> |
| 2 | <!-- change --> | <!-- gain --> | <!-- effort --> | <!-- owner --> |
| 3 | <!-- change --> | <!-- gain --> | <!-- effort --> | <!-- owner --> |

## Validation Plan
- **How improvements will be measured:** <!-- method -->
- **Success criteria:** <!-- thresholds -->
- **Rollback criteria:** <!-- guardrails -->

## Final Results
### Before vs After Summary
| Metric | Before | After | Improvement |
|---|---:|---:|---:|
| Workflow total duration | <!-- --> | <!-- --> | <!-- --> |
| Critical path duration | <!-- --> | <!-- --> | <!-- --> |
| CI cost estimate | <!-- --> | <!-- --> | <!-- --> |

### Outcome
- **Net result:** <!-- concise statement -->
- **Key takeaway:** <!-- concise statement -->

## Appendix
### References
- <!-- workflow run links -->
- <!-- trace links -->
- <!-- relevant PRs/commits -->

### Raw Notes
- <!-- free-form notes -->
