import { getAcceptanceTestDetail, getFeatureDetail } from "../logics/index.ts"
import { renderAcceptanceTestDetail, renderFeatureDetail } from "../render/index.ts"
import type { CommandReturn, S4 } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn, loadSpec } from "./_base.ts"

/**
 * Display detailed information about a feature or acceptance test
 * @param opts - Command options including id, format, and spec path
 * @param opts.id - ID of the feature or acceptance test
 * @param opts.format - Format of the spec file
 * @param opts.spec - Path to the spec file
 * @returns Command result with detailed information
 */
export default async function (opts: { id: string; format: "yaml" | "json"; spec: string }): Promise<CommandReturn> {
  const { id, spec: specPath, format } = opts

  const specOrErr = await loadSpec(specPath, format)
  if (isLeft(specOrErr)) return errToCommandReturn(specOrErr)
  const spec = specOrErr.R

  if (typeof id !== "string" || id.length === 0) {
    return { stdout: "", stderr: "value_error: Missing ID - Provide FE-nnnn or AT-nnnn", exitCode: 1 }
  }

  if (id.startsWith("FE-")) return handleFeatureInfo(spec, id)
  if (id.startsWith("AT-")) return handleAcceptanceTestInfo(spec, id)

  return {
    stdout: "",
    stderr: `value_error: Invalid value: ${id} - Invalid ID format. Expected FE-nnnn or AT-nnnn, got: ${id}`,
    exitCode: 1,
  }
}

function handleFeatureInfo(spec: S4, id: string): CommandReturn {
  const featureInfoOrErr = getFeatureDetail(spec, id)
  if (isLeft(featureInfoOrErr)) return errToCommandReturn(featureInfoOrErr)
  const featureInfo = featureInfoOrErr.R
  return { stdout: renderFeatureDetail(featureInfo), stderr: "", exitCode: 0 }
}

function handleAcceptanceTestInfo(spec: S4, id: string): CommandReturn {
  const atInfoOrErr = getAcceptanceTestDetail(spec, id)
  if (isLeft(atInfoOrErr)) return errToCommandReturn(atInfoOrErr)
  const atInfo = atInfoOrErr.R
  return { stdout: renderAcceptanceTestDetail(atInfo), stderr: "", exitCode: 0 }
}
