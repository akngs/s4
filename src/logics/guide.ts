import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Either } from "fp-ts/lib/Either.js"
import { isLeft, left, right } from "fp-ts/lib/Either.js"
import * as yaml from "yaml"
import type { Guideline, SystemError } from "../types.ts"
import { GuidelineSchema } from "../types.ts"

/**
 * Build data for the guide command by reading and validating `guideline.yaml`.
 * When no section is provided, returns the brief guidance text.
 * When a section is provided, validates the key and returns the section text
 * along with flattened, YAML-formatted example entries suitable for rendering.
 * @param section Optional section key (e.g., "title", "mission", "vision", "concepts", "businessObjective", "feature", "acceptanceTest", "connectors", "tools").
 * @returns Either a system error or a view model for rendering the guide.
 */
export async function getGuidelineView(
  section?: string,
): Promise<
  Either<
    SystemError | { _tag: "unknown_section" },
    { _tag: "brief"; brief: string } | { _tag: "section"; sectionText: string; examples: { _tag: "scalar" | "block"; text: string }[] }
  >
> {
  const dataOrErr = await loadGuideline()
  if (isLeft(dataOrErr)) return left(dataOrErr.left)
  const data = dataOrErr.right

  if (!section) return right({ _tag: "brief", brief: data.brief })
  const allowedSections = Object.keys(data.sections)

  if (!allowedSections.includes(section)) return left({ _tag: "unknown_section" })

  const sectionText = data.sections[section as keyof typeof data.sections]
  const rawValues = data.examples.map(ex => ex[section as keyof (typeof data.examples)[number]])
  const valuesForRendering = rawValues.flat(1)
  const examples = valuesForRendering.map((item: unknown) => formatExampleToRenderable(item))

  return right({ _tag: "section", sectionText, examples })
}

/**
 * Load and validate the guideline YAML.
 * @returns Parsed guideline object.
 */
async function loadGuideline(): Promise<Either<SystemError, Guideline>> {
  const moduleDir = dirname(fileURLToPath(import.meta.url))
  const candidatePaths = [
    join(moduleDir, "guideline.yaml"), // sources (vitest, dev start)
    join(moduleDir, "..", "guideline.yaml"), // built artifacts (dist/logics/*.js)
  ]

  for (const filePath of candidatePaths) {
    try {
      const raw = await readFile(filePath, "utf-8")
      const parsed = GuidelineSchema.safeParse(yaml.parse(raw) as unknown)
      return parsed.success ? right(parsed.data) : left({ _tag: "parse_error", message: parsed.error.message, cause: parsed.error })
    } catch {
      // Continue to next path
    }
  }

  return left({ _tag: "io_error", filePath: "guideline.yaml", cause: new Error("File not found in any candidate path") })
}

/**
 * Convert an arbitrary example value into a renderable entry.
 * @param item Any example value from the guideline examples array.
 * @returns Renderable entry specifying whether it's scalar or a YAML block.
 */
function formatExampleToRenderable(item: unknown): { _tag: "scalar" | "block"; text: string } {
  if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
    return { _tag: "scalar", text: String(item) }
  }
  try {
    const yamlText = yaml.stringify(item).trimEnd()
    return { _tag: "block", text: yamlText }
  } catch {
    return { _tag: "scalar", text: Object.prototype.toString.call(item) }
  }
}
