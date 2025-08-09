import { validateInternalConsistency } from "../logics/validation.ts"
import { renderValidationIssues } from "../render/index.ts"
import type { CommandReturn } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn, loadSpec } from "./_base.ts"

/**
 * Validate internal consistency of the specification
 * @param opts - Command options
 * @param opts.format - Format of the spec file
 * @param opts.spec - Path to the spec file
 * @returns Command result with validation information
 */
export default async function (opts: { format: "yaml" | "json"; spec: string }): Promise<CommandReturn> {
  const specResult = await loadSpec(opts.spec, opts.format)
  if (isLeft(specResult)) return errToCommandReturn(specResult)
  const spec = specResult.R

  const inconsistencies = validateInternalConsistency(spec)
  if (inconsistencies.length === 0) return { stdout: "", stderr: "", exitCode: 0 }

  return { stdout: "", stderr: renderValidationIssues(inconsistencies), exitCode: 1 }
}
