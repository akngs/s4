import { getAcceptanceTestDetail, getFeatureDetail } from "../logics/details.ts"
import { renderAcceptanceTestDetail, renderFeatureDetail } from "../render/index.ts"
import type { CommandReturn, S4 } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn } from "./_base.ts"

/**
 * Display detailed information about a feature or acceptance test
 * @param spec - The loaded S4 spec instance
 * @param id - Feature ID (e.g., FE-0001) or Acceptance Test ID (e.g., AT-0001)
 * @returns Command result with detailed information
 */
export default function (spec: S4, id: string): CommandReturn {
  if (id.startsWith("FE-")) {
    const featureDetailOrErr = getFeatureDetail(spec, id)
    if (isLeft(featureDetailOrErr)) return errToCommandReturn(featureDetailOrErr)
    const featureDetail = featureDetailOrErr.R
    return { stdout: renderFeatureDetail(featureDetail), stderr: "", exitCode: 0 }
  }

  if (id.startsWith("AT-")) {
    const acceptanceTestDetailOrErr = getAcceptanceTestDetail(spec, id)
    if (isLeft(acceptanceTestDetailOrErr)) return errToCommandReturn(acceptanceTestDetailOrErr)
    const acceptanceTestDetail = acceptanceTestDetailOrErr.R
    return { stdout: renderAcceptanceTestDetail(acceptanceTestDetail), stderr: "", exitCode: 0 }
  }

  return { stdout: "", stderr: "value_error: Invalid ID format. Must start with 'FE-' or 'AT-'", exitCode: 1 }
}
