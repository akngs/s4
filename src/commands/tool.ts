import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn, S4 } from "../types.ts"

/**
 * Run a tool defined in spec
 * @param spec - The loaded S4 spec instance
 * @param toolId - Tool ID as defined in spec.tools
 * @returns Command result with tool execution output
 */
export default async function (spec: S4, toolId: string): Promise<CommandReturn> {
  const tool = spec.tools.find(t => t.id === toolId)
  if (!tool) return { stdout: "", stderr: `value_error: Tool "${toolId}" not found in spec`, exitCode: 1 }

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
