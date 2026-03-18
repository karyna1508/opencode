import type { RawSpan, SortDir, SortKey, Span, ViewMode, ViewRow } from "./types"

type Node = {
  span: Span
  kids: Node[]
}

const val = (span: Span, key: SortKey) => {
  if (key === "start") return span.start
  if (key === "end") return span.end
  return span.dur
}

const cmp = (a: Span, b: Span, key: SortKey, dir: SortDir) => {
  const mul = dir === "asc" ? 1 : -1
  const d = val(a, key) - val(b, key)
  if (d !== 0) return d * mul
  return a.name.localeCompare(b.name) * mul
}

const sort = (rows: Span[], key: SortKey, dir: SortDir) =>
  [...rows].sort((a, b) => cmp(a, b, key, dir))

const tree = (rows: Span[], key: SortKey, dir: SortDir) => {
  const map = new Map<string, Node>()
  const roots: Node[] = []

  for (const span of rows) map.set(span.id, { span, kids: [] })

  for (const node of map.values()) {
    if (!node.span.pid) {
      roots.push(node)
      continue
    }

    const parent = map.get(node.span.pid)
    if (!parent) {
      roots.push(node)
      continue
    }

    parent.kids.push(node)
  }

  const walk = (nodes: Node[]) => {
    nodes.sort((a, b) => cmp(a.span, b.span, key, dir))
    for (const node of nodes) walk(node.kids)
  }

  walk(roots)
  return roots
}

const flatten = (nodes: Node[], depth = 0): ViewRow[] => {
  const out: ViewRow[] = []
  for (const node of nodes) {
    out.push({ span: node.span, depth })
    out.push(...flatten(node.kids, depth + 1))
  }
  return out
}

export const normalize = (raws: RawSpan[]) =>
  raws.flatMap((raw, i) => {
    const start = Date.parse(raw.start_time!)
    const end = Date.parse(raw.end_time!)
    if (!Number.isFinite(start) || !Number.isFinite(end)) return []
    return [
      {
        uid: `${raw.span_id}-${i}`,
        id: raw.span_id!,
        pid: typeof raw.parent_span_id === "string" ? raw.parent_span_id : null,
        name: typeof raw.name === "string" && raw.name ? raw.name : raw.span_id!,
        start,
        end,
        dur: Math.max(0, end - start),
        raw,
      },
    ]
  })

export const latest = (rows: Span[]) => {
  const map = new Map<string, Span>()
  for (const row of rows) {
    const prev = map.get(row.id)
    if (!prev) {
      map.set(row.id, row)
      continue
    }
    if (row.end > prev.end) {
      map.set(row.id, row)
      continue
    }
    if (row.end === prev.end && row.start > prev.start) {
      map.set(row.id, row)
      continue
    }
    if (row.end === prev.end && row.start === prev.start && row.uid > prev.uid) {
      map.set(row.id, row)
    }
  }
  return [...map.values()]
}

export const rows = (
  spans: Span[],
  mode: ViewMode,
  key: SortKey,
  dir: SortDir,
): ViewRow[] => {
  if (mode === "flat") return sort(spans, key, dir).map((span) => ({ span, depth: 0 }))
  return flatten(tree(spans, key, dir))
}

export const range = (rows: ViewRow[]) => {
  if (!rows.length) return { min: 0, max: 0, span: 1 }
  const min = Math.min(...rows.map((row) => row.span.start))
  const max = Math.max(...rows.map((row) => row.span.end))
  return { min, max, span: Math.max(1, max - min) }
}

export const tone = (id: string) => {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 70% 55%)`
}

export const fmtDur = (dur: number) => `${(dur / 1000).toFixed(3)}s`

export const fmtTime = (v: number) => new Date(v).toISOString()
