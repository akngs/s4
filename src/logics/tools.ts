import type { S4, ToolRunResult } from "../types.ts"
import { executeCommand } from "./exec.ts"

/**
 * Run all tools defined in the spec and return detailed results.
 * Tools are executed sequentially and may stop early if a tool fails and `stopOnError` is true.
 * @param spec - The S4 spec containing tool definitions
 * @returns Detailed results for each tool
 */
export async function runAllToolsDetailed(spec: S4): Promise<ToolRunResult[]> {
  const perTool: ToolRunResult[] = []
  for (const tool of spec.tools) {
    const result = await executeCommand(tool.command)
    perTool.push({
      id: tool.id,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      recommendedNextActions: tool.recommendedNextActions,
    })
    if (result.exitCode !== 0 && tool.stopOnError) break
  }
  return perTool
}
