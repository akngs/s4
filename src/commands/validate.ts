import { validateInternalConsistency } from "../logics/validation.ts"
import { renderValidationIssues } from "../render/index.ts"
import type { CommandReturn, S4 } from "../types.ts"

/**
 * Validate internal consistency of the specification
 * @param spec - The loaded S4 spec instance
 * @returns Command result with validation information
 */
export default function runValidate(spec: S4): CommandReturn {
  const inconsistencies = validateInternalConsistency(spec)
  if (inconsistencies.length === 0) return { stdout: "", stderr: "", exitCode: 0 }

  return { stdout: "", stderr: renderValidationIssues(inconsistencies), exitCode: 1 }
}
