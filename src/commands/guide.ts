import { isLeft } from "fp-ts/lib/Either.js"
import { getGuidelineView } from "../logics/guide.ts"
import { renderGuide } from "../render/index.ts"
import type { CommandReturn } from "../types.ts"

/**
 * Display the spec authoring guidance from `guideline.yaml`.
 * When no section is provided, returns the brief guidance text.
 * When a section is provided, returns that section's content along with examples.
 * @param section - Optional section key to display (e.g., "title", "mission", "vision", "concepts", "businessObjective", "feature", "acceptanceTest", "connectors", "tools")
 * @returns Command outcome containing stdout on success or stderr on error.
 */
export default async function runGuide(section?: string): Promise<CommandReturn> {
  const result = await getGuidelineView(section)
  if (isLeft(result)) {
    const err = result.left
    const cause = "cause" in err ? String((err as unknown as { cause?: unknown }).cause) : ""
    return { stdout: "", stderr: `${err._tag}: ${cause}`, exitCode: 1 }
  }

  const view = result.right

  return { stdout: renderGuide(view), stderr: "", exitCode: 0 }
}
