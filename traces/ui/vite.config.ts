import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import fs from "node:fs/promises"
import path from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"

const send = (res: ServerResponse, code: number, body: string, type = "text/plain") => {
  res.statusCode = code
  res.setHeader("content-type", type)
  res.end(body)
}

const read = async (req: IncomingMessage, res: ServerResponse, dir: string) => {
  const url = req.url ?? ""
  if (url === "/api/traces") {
    const files = (await fs.readdir(dir)).filter((file) => file.endsWith(".jsonl")).sort()
    send(res, 200, JSON.stringify({ files }), "application/json")
    return true
  }

  if (!url.startsWith("/api/traces/")) return false
  const file = decodeURIComponent(url.slice("/api/traces/".length))
  if (!file || file.includes("/") || file.includes("\\")) {
    send(res, 400, "bad trace path")
    return true
  }

  const full = path.resolve(dir, file)
  if (!full.startsWith(`${dir}${path.sep}`)) {
    send(res, 400, "invalid trace path")
    return true
  }

  const stat = await fs.stat(full).catch(() => null)
  if (!stat || !stat.isFile()) {
    send(res, 404, "trace not found")
    return true
  }

  send(res, 200, await fs.readFile(full, "utf8"))
  return true
}

export default defineConfig({
  server: {
    fs: {
      allow: [".."],
    },
  },
  plugins: [
    react(),
    {
      name: "trace-api",
      configureServer(srv) {
        const dir = path.resolve(srv.config.root, "..")
        srv.middlewares.use(async (req, res, next) => {
          if (!(await read(req, res, dir))) next()
        })
      },
      configurePreviewServer(srv) {
        const dir = path.resolve(srv.config.root, "..")
        srv.middlewares.use(async (req, res, next) => {
          if (!(await read(req, res, dir))) next()
        })
      },
    },
  ],
})
