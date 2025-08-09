import { exec } from "node:child_process"
import { promisify } from "node:util"
import type { CommandReturn } from "../types.ts"

const execAsync = promisify(exec)

/**
 * Executes a shell command and returns both stdout and stderr, even on non-zero exit code
 * @param cmd - The shell command to execute
 * @returns Command execution result with stdout, stderr, and exit code
 */
export async function executeCommand(cmd: string): Promise<CommandReturn> {
  try {
    const result = await execAsync(cmd)
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), exitCode: 0 }
  } catch (err: unknown) {
    return normalizeExecError(err)
  }
}

function normalizeExecError(err: unknown): CommandReturn {
  const e = err as { stdout?: unknown; stderr?: unknown; code?: unknown }
  const stdout = String(e.stdout)
  const stderr = String(e.stderr)
  const exitCode = Number(e.code ?? 1)
  return { stdout, stderr, exitCode }
}
