import { runAllToolsDetailed } from "../logics/index.ts"
import { renderFailingTools, renderTools } from "../render/index.ts"
import type { CommandReturn, ToolRunResult } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn, loadSpec } from "./_base.ts"

/**
 * Run all user-defined tools
 * @param opts - Command options
 * @param opts.spec - Path to the spec file
 * @param opts.format - Format of the spec file
 * @returns Command result with all tools execution output
 */
export default async function (opts: { spec: string; format: "yaml" | "json" }): Promise<CommandReturn> {
  const specOrErr = await loadSpec(opts.spec, opts.format)
  if (isLeft(specOrErr)) return errToCommandReturn(specOrErr)
  const spec = specOrErr.R

  const toolResults: ToolRunResult[] = await runAllToolsDetailed(spec)
  const stdout = (() => {
    const header = renderTools(spec.tools, toolResults)
    const failures = toolResults.filter(r => r.exitCode !== 0)
    if (failures.length === 0) return header
    const details = renderFailingTools(failures)
    return `${header}\n${details}`
  })()
  const stderr = toolResults
    .map(r => r.stderr)
    .filter(s => s.length > 0)
    .join("\n")
  const exitCode = toolResults.length === 0 ? 0 : (toolResults[toolResults.length - 1]?.exitCode ?? 0)
  return { stdout, stderr, exitCode }
}
