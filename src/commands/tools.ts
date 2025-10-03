import { runAllToolsDetailed } from "../logics/tools.ts"
import { renderTools } from "../render/index.ts"
import type { CommandReturn, S4 } from "../types.ts"

/**
 * Run all tools in defined order
 * @param spec - The loaded S4 spec instance
 * @returns Command result with tool execution output
 */
export default async function runTools(spec: S4): Promise<CommandReturn> {
  const results = await runAllToolsDetailed(spec)
  const rendered = renderTools(spec, results)
  return { stdout: rendered, stderr: "", exitCode: results.some(r => r.exitCode !== 0) ? 1 : 0 }
}
