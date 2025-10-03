import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn, S4 } from "../types.ts"

/**
 * Locate an acceptance test file by ID
 * @param spec - The loaded S4 spec instance
 * @param id - Acceptance test ID
 * @returns Command result with file location information
 */
export default async function runLocateAt(spec: S4, id: string): Promise<CommandReturn> {
  const connector = spec.connectors.locateAcceptanceTest
  return executeCommand(connector.replace("{ID}", id))
}
