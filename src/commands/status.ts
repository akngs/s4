import { performOverallStatusCheck } from "../logics/index.ts"
import { renderStatus } from "../render/index.ts"
import type { CommandReturn } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn, loadSpec } from "./_base.ts"

/**
 * Display overall project status with comprehensive context and recommended next actions
 * @param opts - Command options
 * @param opts.format - Format of the spec file
 * @param opts.spec - Path to the spec file
 * @returns Command result with project status information
 */
export default async function (opts: { format: "yaml" | "json"; spec: string }): Promise<CommandReturn> {
  const specOrErr = await loadSpec(opts.spec, opts.format)
  if (isLeft(specOrErr)) return errToCommandReturn(specOrErr)
  const spec = specOrErr.R

  const statusOrErr = await performOverallStatusCheck(spec)
  if (isLeft(statusOrErr)) return errToCommandReturn(statusOrErr)
  const status = statusOrErr.R

  const rendered = renderStatus(spec, status.featureStats, status.issues, status.toolResults)
  const exitCode = status.issues.length === 0 ? 0 : 1
  return { stdout: rendered, stderr: "", exitCode }
}
