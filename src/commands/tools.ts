import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn, S4 } from "../types.ts"

/**
 * Run all tools in defined order
 * @param spec - The loaded S4 spec instance
 * @returns Command result with tool execution output
 */
export default async function (spec: S4): Promise<CommandReturn> {
  const results: string[] = []
  let hasErrors = false

  for (const tool of spec.tools) {
    const result = await executeCommand(tool.command)
    results.push(`${tool.id}: ${result.exitCode === 0 ? "success" : "failure"}`)
    if (result.exitCode !== 0) hasErrors = true
  }

  return { stdout: results.join("\n"), stderr: "", exitCode: hasErrors ? 1 : 0 }
}
