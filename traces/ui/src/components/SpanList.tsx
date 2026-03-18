import { Fragment } from "react"
import { fmtDur, fmtTime } from "../model"
import type { SortDir, SortKey, ViewMode, ViewRow } from "../types"

type Props = {
  rows: ViewRow[]
  mode: ViewMode
  keyName: SortKey
  dir: SortDir
  dedupe: boolean
  expanded: Set<string>
  onMode: (mode: ViewMode) => void
  onKey: (key: SortKey) => void
  onDir: (dir: SortDir) => void
  onDedupe: (v: boolean) => void
  onToggle: (uid: string) => void
}

const pad = (depth: number) => ({ paddingLeft: `${depth * 16 + 8}px` })

export default function SpanList(props: Props) {
  return (
    <section className="card">
      <div className="head">
        <h2>Spans</h2>
        <div className="controls">
          <label>
            View
            <select value={props.mode} onChange={(e) => props.onMode(e.target.value as ViewMode)}>
              <option value="flat">Flat</option>
              <option value="tree">Tree</option>
            </select>
          </label>

          <label>
            Sort
            <select
              value={props.keyName}
              onChange={(e) => props.onKey(e.target.value as SortKey)}
            >
              <option value="start">Start time</option>
              <option value="end">End time</option>
              <option value="duration">Duration</option>
            </select>
          </label>

          <label>
            Order
            <select value={props.dir} onChange={(e) => props.onDir(e.target.value as SortDir)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </label>

          <label className="check">
            <span>Deduplicate</span>
            <input
              type="checkbox"
              checked={props.dedupe}
              onChange={(e) => props.onDedupe(e.target.checked)}
            />
          </label>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Duration</th>
              <th>Start time</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) => {
              const open = props.expanded.has(row.span.uid)
              return (
                <Fragment key={row.span.uid}>
                  <tr>
                    <td style={pad(row.depth)} className="name-cell">
                      {props.mode === "tree" && row.depth > 0 ? "└ " : ""}
                      {row.span.name}
                    </td>
                    <td>{fmtDur(row.span.dur)}</td>
                    <td>{fmtTime(row.span.start)}</td>
                    <td className="right">
                      <button onClick={() => props.onToggle(row.span.uid)}>
                        {open ? "Collapse" : "Expand"}
                      </button>
                    </td>
                  </tr>
                  {open ? (
                    <tr>
                      <td colSpan={4}>
                        <pre>{JSON.stringify(row.span.raw, null, 2)}</pre>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
