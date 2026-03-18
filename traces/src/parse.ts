import type { RawSpan } from "./types"

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null

const isSpan = (v: unknown): v is RawSpan => {
  if (!isObj(v)) return false
  if (typeof v.span_id !== "string") return false
  if (typeof v.start_time !== "string") return false
  if (typeof v.end_time !== "string") return false
  return true
}

export const parse = (txt: string) => {
  const spans: RawSpan[] = []
  let bad = 0

  for (const line of txt.split(/\r?\n/)) {
    if (!line.trim()) continue
    try {
      const v = JSON.parse(line)
      if (!isSpan(v)) {
        bad += 1
        continue
      }
      spans.push(v)
    } catch {
      bad += 1
    }
  }

  return { spans, bad }
}
