import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { CommandReturn } from "../types.ts"

/**
 * Display a simple example specification in YAML format from examples/flash-cards.yaml.
 * @returns Command outcome containing the example specification.
 */
export default async function runExample(): Promise<CommandReturn> {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  const candidatePaths = [
    join(moduleDir, "..", "..", "examples", "flash-cards.yaml"), // sources (vitest, dev start)
    join(moduleDir, "..", "examples", "flash-cards.yaml"), // built artifacts (dist/*.js)
  ]

  for (const filePath of candidatePaths) {
    try {
      const content = await readFile(filePath, "utf-8")
      return { stdout: content, stderr: "", exitCode: 0 }
    } catch {
      // Continue to next path
    }
  }

  return { stdout: "", stderr: "io_error: Could not find examples/flash-cards.yaml", exitCode: 1 }
}
