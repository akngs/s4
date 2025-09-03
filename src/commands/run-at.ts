import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn, S4 } from "../types.ts"

/**
 * Run an acceptance test by ID
 * @param spec - The loaded S4 spec instance
 * @param id - Acceptance test ID
 * @returns Command result with test execution output
 */
export default async function (spec: S4, id: string): Promise<CommandReturn> {
  const connector = spec.connectors.runAcceptanceTest
  return executeCommand(connector.replace("{ID}", id))
}
