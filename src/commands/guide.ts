import { getGuidelineView } from "../logics/guide.ts"
import { renderGuide } from "../render/index.ts"
import type { CommandReturn } from "../types.ts"
import { isLeft } from "../types.ts"

/**
 * Display the spec authoring guidance from `guideline.yaml`.
 * When no section is provided, returns the brief guidance text.
 * When a section is provided, returns that section's content along with examples.
 * @param section - Optional section key to display (e.g., "title", "mission", "vision", "businessObjective", "feature", "acceptanceTest", "connectors", "tools")
 * @returns Command outcome containing stdout on success or stderr on error.
 */
export default async function runGuide(section?: string): Promise<CommandReturn> {
  const result = await getGuidelineView(section)
  if (isLeft(result)) return renderGuideError(result.L)
  const view = result.R
  if (view.kind === "unknown_section") return renderUnknownSection(section, view.allowed)
  return { stdout: renderGuide(view), stderr: "", exitCode: 0 }
}

function renderGuideError(err: { _tag: string } & Record<string, unknown>): CommandReturn {
  if (err._tag === "io_error") {
    const rawCause = (err as unknown as { cause?: unknown }).cause
    const cause = rawCause instanceof Error ? rawCause.message : String(rawCause)
    return { stdout: "", stderr: `io_error: Failed to read guideline.yaml: ${cause}`, exitCode: 1 }
  }
  if (err._tag === "parse_error") {
    const message = String((err as unknown as { message?: unknown }).message)
    return { stdout: "", stderr: `parse_error: ${message}`, exitCode: 1 }
  }
  const cause = "cause" in err ? String((err as unknown as { cause?: unknown }).cause) : ""
  return { stdout: "", stderr: `${err._tag}: ${cause}`, exitCode: 1 }
}

function renderUnknownSection(section: unknown, allowed: string[]): CommandReturn {
  const name = typeof section === "string" ? section : String(section)
  return { stdout: "", stderr: `value_error: Unknown section: ${name}. Allowed: ${allowed.join(", ")}`, exitCode: 1 }
}
