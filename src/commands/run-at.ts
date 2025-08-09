import { executeCommand } from "../logics/exec.ts"
import type { CommandReturn } from "../types.ts"
import { loadSpecAndValidateId } from "./_base.ts"

/**
 * Run a specific acceptance test
 * @param opts - Command options including id, spec path, and format
 * @param opts.id - Acceptance test ID
 * @param opts.spec - Spec file path
 * @param opts.format - Spec file format
 * @returns Command result with test execution output
 */
export default async function (opts: { id: string; spec: string; format: "yaml" | "json" }): Promise<CommandReturn> {
  const specOrReturn = await loadSpecAndValidateId(opts.spec, opts.format, opts.id)
  if ("exitCode" in specOrReturn) return specOrReturn
  const spec = specOrReturn
  return executeCommand(spec.connectors.runAcceptanceTest.replace("{ID}", opts.id))
}
