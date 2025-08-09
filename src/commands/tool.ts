import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn, loadSpec } from "./_base.ts"

/**
 * Run a user-defined tool
 * @param opts - Command options
 * @param opts.spec - Path to the spec file
 * @param opts.format - Format of the spec file
 * @param opts.toolId - ID of the tool to run
 * @returns Command result with tool execution output
 */
export default async function (opts: { spec: string; format: "yaml" | "json"; toolId: string }): Promise<CommandReturn> {
  const specOrErr = await loadSpec(opts.spec, opts.format)
  if (isLeft(specOrErr)) return errToCommandReturn(specOrErr)
  const spec = specOrErr.R

  const tool = spec.tools.find(t => t.id === opts.toolId)
  if (tool === undefined) {
    return { stdout: "", stderr: `value_error: Tool "${opts.toolId}" not found in spec`, exitCode: 1 }
  }

  const result: CommandReturn = await executeCommand(tool.command)
  if (result.exitCode !== 0 && tool.recommendedNextActions.length > 0) {
    const prefix = result.stdout.length > 0 ? "\n" : ""
    return {
      stdout: `${result.stdout}${prefix}${tool.recommendedNextActions}`.trim(),
      stderr: result.stderr,
      exitCode: result.exitCode,
    }
  }

  // Pass-through results as is per AT-0046
  return { stdout: result.stdout, stderr: result.stderr, exitCode: result.exitCode }
}
