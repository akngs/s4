import { isLeft } from "fp-ts/lib/Either.js"
import { performOverallStatusCheck } from "../logics/status.ts"
import { renderStatus } from "../render/index.ts"
import type { CommandReturn, S4 } from "../types.ts"
import { errToCommandReturn } from "./_base.ts"

/**
 * Display overall project status with comprehensive context and recommended next actions
 * @param spec - The loaded S4 spec instance
 * @returns Command result with project status information
 */
export default async function runStatus(spec: S4): Promise<CommandReturn> {
  const statusOrErr = await performOverallStatusCheck(spec)
  if (isLeft(statusOrErr)) return errToCommandReturn(statusOrErr)
  const status = statusOrErr.right

  const rendered = renderStatus(spec, status.featureStats, status.issues, status.toolResults)
  const exitCode = status.issues.length === 0 ? 0 : 1
  return { stdout: rendered, stderr: "", exitCode }
}
