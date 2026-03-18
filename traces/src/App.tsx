import { useMemo, useState } from "react"
import Timeline from "./components/Timeline"
import SpanList from "./components/SpanList"
import { normalize, range, rows } from "./model"
import { parse } from "./parse"
import type { SortDir, SortKey, Span, ViewMode } from "./types"

export default function App() {
  const [spans, setSpans] = useState<Span[]>([])
  const [bad, setBad] = useState(0)
  const [name, setName] = useState("")
  const [mode, setMode] = useState<ViewMode>("flat")
  const [keyName, setKeyName] = useState<SortKey>("start")
  const [dir, setDir] = useState<SortDir>("asc")
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const view = useMemo(() => rows(spans, mode, keyName, dir), [spans, mode, keyName, dir])
  const time = useMemo(() => range(view), [view])

  const onFile = async (file: File | null) => {
    if (!file) return
    const txt = await file.text()
    const parsed = parse(txt)
    setBad(parsed.bad)
    setSpans(normalize(parsed.spans))
    setName(file.name)
    setExpanded(new Set())
  }

  const onToggle = (uid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(uid)) {
        next.delete(uid)
        return next
      }
      next.add(uid)
      return next
    })
  }

  return (
    <main>
      <header className="card">
        <h1>Trace Visualizer</h1>
        <div className="upload">
          <input
            type="file"
            accept=".jsonl,.txt,application/json"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {name ? <span className="pill">File: {name}</span> : null}
          <span className="pill">Spans: {spans.length}</span>
          <span className="pill">Invalid lines: {bad}</span>
        </div>
      </header>

      <Timeline rows={view} min={time.min} span={time.span} />
      <SpanList
        rows={view}
        mode={mode}
        keyName={keyName}
        dir={dir}
        expanded={expanded}
        onMode={setMode}
        onKey={setKeyName}
        onDir={setDir}
        onToggle={onToggle}
      />
    </main>
  )
}
