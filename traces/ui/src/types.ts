export type RawSpan = {
  trace_id?: string
  span_id?: string
  parent_span_id?: string
  name?: string
  start_time?: string
  end_time?: string
  [key: string]: unknown
}

export type Span = {
  uid: string
  id: string
  pid: string | null
  name: string
  start: number
  end: number
  dur: number
  raw: RawSpan
}

export type ViewMode = "flat" | "tree"
export type SortKey = "start" | "end" | "duration"
export type SortDir = "asc" | "desc"

export type ViewRow = {
  span: Span
  depth: number
}
