import { useEffect, useMemo, useState } from "react"
import Timeline from "./components/Timeline"
import SpanList from "./components/SpanList"
import { latest, normalize, range, rows } from "./model"
import { parse } from "./parse"
import type { SortDir, SortKey, Span, ViewMode } from "./types"

export default function App() {
  const [spans, setSpans] = useState<Span[]>([])
  const [bad, setBad] = useState(0)
  const [name, setName] = useState("")
  const [mode, setMode] = useState<ViewMode>("flat")
  const [keyName, setKeyName] = useState<SortKey>("start")
  const [dir, setDir] = useState<SortDir>("asc")
  const [dedupe, setDedupe] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<string[]>([])
  const [pick, setPick] = useState("")
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState("")

  const listRows = useMemo(() => (dedupe ? latest(spans) : spans), [spans, dedupe])
  const view = useMemo(() => rows(listRows, mode, keyName, dir), [listRows, mode, keyName, dir])
  const time = useMemo(() => range(view), [view])

  const load = (file: string, txt: string) => {
    const parsed = parse(txt)
    setBad(parsed.bad)
    setSpans(normalize(parsed.spans))
    setName(file)
    setExpanded(new Set())
  }

  const list = async () => {
    setBusy(true)
    setErr("")
    const res = await fetch("/api/traces")
    if (!res.ok) {
      setBusy(false)
      setErr("Failed to read traces folder")
      return
    }
    const next = (await res.json()) as { files?: unknown }
    const arr = Array.isArray(next.files) ? next.files.filter((v): v is string => typeof v === "string") : []
    setFiles(arr)
    const first = arr[0] ?? ""
    setPick(first)
    if (first) {
      const raw = await fetch(`/api/traces/${encodeURIComponent(first)}`)
      if (!raw.ok) {
        setBusy(false)
        setErr("Found trace list, but failed to load file")
        return
      }
      load(first, await raw.text())
    }
    setBusy(false)
  }

  useEffect(() => {
    list()
  }, [])

  useEffect(() => {
    setExpanded(new Set())
  }, [dedupe])

  const onFile = async (file: File | null) => {
    if (!file) return
    load(file.name, await file.text())
  }

  const onPick = async (file: string) => {
    setPick(file)
    if (!file) return
    setBusy(true)
    setErr("")
    const res = await fetch(`/api/traces/${encodeURIComponent(file)}`)
    if (!res.ok) {
      setBusy(false)
      setErr("Failed to load selected trace")
      return
    }
    load(file, await res.text())
    setBusy(false)
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
          <button type="button" onClick={list} disabled={busy}>
            {busy ? "Loading..." : "Refresh trace list"}
          </button>
          <label>
            Trace list
            <select value={pick} onChange={(e) => onPick(e.target.value)} disabled={busy || files.length === 0}>
              <option value="">Select trace</option>
              {files.map((file) => (
                <option key={file} value={file}>
                  {file}
                </option>
              ))}
            </select>
          </label>
          <input
            type="file"
            accept=".jsonl,.txt,application/json"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          {name ? <span className="pill">File: {name}</span> : null}
          <span className="pill">Spans: {listRows.length}</span>
          <span className="pill">Invalid lines: {bad}</span>
        </div>
        {err ? <p className="muted">{err}</p> : null}
      </header>

      <Timeline rows={view} min={time.min} span={time.span} />
      <SpanList
        rows={view}
        mode={mode}
        keyName={keyName}
        dir={dir}
        dedupe={dedupe}
        expanded={expanded}
        onMode={setMode}
        onKey={setKeyName}
        onDir={setDir}
        onDedupe={setDedupe}
        onToggle={onToggle}
      />
    </main>
  )
}
