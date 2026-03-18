import { fmtDur, fmtTime, tone } from "../model"
import type { ViewRow } from "../types"

type Props = {
  rows: ViewRow[]
  min: number
  span: number
}

export default function Timeline(props: Props) {
  if (!props.rows.length) {
    return (
      <section className="card">
        <h2>Timeline</h2>
        <p className="muted">Upload a JSONL file to render spans.</p>
      </section>
    )
  }

  return (
    <section className="card">
      <h2>Timeline</h2>
      <div className="timeline">
        {props.rows.map((row) => {
          const left = ((row.span.start - props.min) / props.span) * 100
          const width = (row.span.dur / props.span) * 100
          return (
            <div className="timeline-row" key={row.span.uid}>
              <span className="timeline-name" title={row.span.name}>
                {row.span.name}
              </span>
              <div className="timeline-track">
                <div
                  className="timeline-bar"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(0.8, width)}%`,
                    background: tone(row.span.id),
                  }}
                  title={`${row.span.name}\n${fmtTime(row.span.start)} -> ${fmtTime(
                    row.span.end,
                  )}\n${fmtDur(row.span.dur)}`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
