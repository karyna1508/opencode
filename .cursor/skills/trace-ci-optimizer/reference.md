# Trace Query Reference

Use these commands when traces are large and a quick aggregate is needed.

## Discover workflows

```bash
ls -1 .github/workflows/*.yml
```

## Find latest related traces for one workflow

Replace `<wf>` with workflow name or filename stem.

```bash
ls -t traces/*.jsonl \
| while read -r f; do
  if jq -e --arg wf "<wf>" '
    select(
      .attributes["workflow.name"] == $wf or
      .attributes["cicd.pipeline.id"] == $wf or
      .name == $wf
    )
  ' "$f" >/dev/null; then
    echo "$f"
  fi
done
```

Use the first file(s) from this output as the latest related trace set.

## Loop all workflows for trace analysis / CI optimization

```bash
for wf in .github/workflows/*.yml; do
  name="$(rg '^name:\s*' "$wf" -N -m 1 | sed -E 's/^name:\s*//')"
  id="$(basename "$wf" .yml)"
  key="$name"
  if [ -z "$key" ]; then key="$id"; fi
  echo "=== $wf ($key) ==="
  ls -t traces/*.jsonl \
  | while read -r f; do
    if jq -e --arg wf "$key" '
      select(
        .attributes["workflow.name"] == $wf or
        .attributes["cicd.pipeline.id"] == $wf or
        .name == $wf
      )
    ' "$f" >/dev/null; then
      echo "$f"
      break
    fi
  done
done
```

## Compare old vs new traces

Assume old traces are stored in `traces/baseline/` and new traces are in `traces/`.

### Workflow/job duration deltas

```bash
jq -r '
  select(.attributes["span.type"] == "job")
  | [.name, (.attributes["job.duration_ms"] // 0)]
  | @tsv
' traces/baseline/*.jsonl | sort > /tmp/old-jobs.tsv

jq -r '
  select(.attributes["span.type"] == "job")
  | [.name, (.attributes["job.duration_ms"] // 0)]
  | @tsv
' traces/*.jsonl | sort > /tmp/new-jobs.tsv

join -a1 -a2 -e 0 -o 0,1.2,2.2 /tmp/old-jobs.tsv /tmp/new-jobs.tsv \
| awk -F'\t' '{d=$3-$2; p=($2==0?0:(d*100/$2)); printf "%s\told=%sms\tnew=%sms\tdelta=%+sms\tpct=%+.1f%%\n",$1,$2,$3,d,p}'
```

### Failure/regression check

```bash
echo "OLD failures"
jq -r '
  select((.status.code == "Error") or (.attributes["step.result"] == "failed"))
  | [.name, (.attributes["step.result"] // .status.code), (.attributes["error.message"] // "")]
  | @tsv
' traces/baseline/*.jsonl | sort -u

echo "NEW failures"
jq -r '
  select((.status.code == "Error") or (.attributes["step.result"] == "failed"))
  | [.name, (.attributes["step.result"] // .status.code), (.attributes["error.message"] // "")]
  | @tsv
' traces/*.jsonl | sort -u
```

## Quick sanity checks

```bash
wc -l traces/trace-unit.jsonl traces/trace-e2e.jsonl
```

```bash
jq -c . traces/trace-unit.jsonl >/dev/null
jq -c . traces/trace-e2e.jsonl >/dev/null
```

## Top slow steps (from one file)

```bash
jq -r '
  select(.attributes["span.type"] == "step")
  | [
      .name,
      (.attributes["step.execution_time_seconds"] // 0),
      (.attributes["step.result"] // "unknown")
    ]
  | @tsv
' traces/trace-e2e.jsonl \
| sort -k2,2nr \
| head -n 10
```

## Job duration summary

```bash
jq -r '
  select(.attributes["span.type"] == "job")
  | [
      .name,
      (.attributes["job.duration_ms"] // 0),
      (.resource["cicd.pipeline.job.id"] // "unknown")
    ]
  | @tsv
' traces/trace-unit.jsonl traces/trace-e2e.jsonl \
| sort -k2,2nr
```

## Failure spans

```bash
jq -r '
  select((.status.code == "Error") or (.attributes["step.result"] == "failed"))
  | [.name, .status.code, (.attributes["error.message"] // "")]
  | @tsv
' traces/trace-unit.jsonl traces/trace-e2e.jsonl
```

## Optimization heuristics

- **Long test step dominates job** (`Run app e2e tests` very large):
  - shard/split tests or isolate flaky suites
  - keep heavy browser install out of critical path where possible

- **Repeated setup across jobs** (`Checkout`, `Setup Bun`, install steps):
  - verify cache effectiveness first
  - reduce duplicate setup work in dependent jobs when safe

- **Upload/artifact overhead is visible**:
  - upload only on failure for heavy artifacts
  - reduce artifact retention for non-critical data

- **Cache miss patterns appear** (`cache.hit_rate_percent` low):
  - tune cache keys and restore paths
  - avoid frequent key busting from non-essential files

- **A single long critical path job gates others**:
  - refactor `needs` graph to improve parallelism
  - split job into independently parallelizable chunks

## Recommendation quality bar

Each recommendation must include:
- evidence: span name + measured duration
- expected impact: rough estimate in seconds or percent
- risk: low/med/high
- validation: how to verify on future runs
