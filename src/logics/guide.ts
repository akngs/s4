import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import * as yaml from "yaml"
import type { Either, Guideline, SystemError } from "../types.ts"
import { GuidelineSchema, isLeft, left, right } from "../types.ts"

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
    SystemError,
    | { _tag: "brief"; brief: string }
    | { _tag: "section"; sectionText: string; examples: { _tag: "scalar" | "block"; text: string }[] }
    | { _tag: "unknown_section"; allowed: string[] }
  >
> {
  const dataOrErr = await loadGuideline()
  if (isLeft(dataOrErr)) return left(dataOrErr.L)
  const data = dataOrErr.R

  if (!section) return right({ _tag: "brief", brief: data.brief })
  const allowedSections = Object.keys(data.sections)

  if (!allowedSections.includes(section)) return right({ _tag: "unknown_section", allowed: allowedSections })

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
    // When running from sources (vitest, dev start)
    join(moduleDir, "guideline.yaml"),
    // When running from built artifacts (dist/logics/*.js)
    join(moduleDir, "..", "guideline.yaml"),
  ]

  let raw: string | undefined
  let lastError: unknown

  for (const filePath of candidatePaths) {
    try {
      raw = await readFile(filePath, "utf-8")
      break
    } catch (err) {
      lastError = err
    }
  }

  if (raw === undefined) return left({ _tag: "io_error", filePath: "guideline.yaml", cause: lastError })

  const parsed = GuidelineSchema.safeParse(yaml.parse(raw) as unknown)
  return parsed.success ? right(parsed.data) : left({ _tag: "parse_error", message: parsed.error.message, cause: parsed.error })
}

/**
 * Convert an arbitrary example value into a renderable entry.
 * @param item Any example value from the guideline examples array.
 * @returns Renderable entry specifying whether it's scalar or a YAML block.
 */
function formatExampleToRenderable(item: unknown): { _tag: "scalar" | "block"; text: string } {
  const isScalar = typeof item === "string" || typeof item === "number" || typeof item === "boolean"
  if (isScalar) return { _tag: "scalar", text: String(item) }
  try {
    JSON.stringify(item)
    const yamlText = yaml.stringify(item).trimEnd()
    return { _tag: "block", text: yamlText }
  } catch {
    return { _tag: "scalar", text: Object.prototype.toString.call(item) }
  }
}
