import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn } from "../types.ts"
import { loadSpecAndValidateId } from "./_base.ts"

/**
 * Locate an acceptance test file
 * @param opts - Command options including id, spec path, and format
 * @param opts.id - Acceptance test ID
 * @param opts.spec - Spec file path
 * @param opts.format - Spec file format
 * @returns Command result with file location information
 */
export default async function (opts: { id: string; spec: string; format: "yaml" | "json" }): Promise<CommandReturn> {
  const { id, spec: specPath, format } = opts
  const specOrReturn = await loadSpecAndValidateId(specPath, format, id)
  if ("exitCode" in specOrReturn) return specOrReturn
  const spec = specOrReturn
  return executeCommand(spec.connectors.locateAcceptanceTest.replace("{ID}", id))
}
