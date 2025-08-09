import { getInstance as getRunAtsAdapter } from "../adapters/run-ats.ts"
import { executeCommand } from "../logics/exec.ts"
import { renderFailingTests } from "../render/index.ts"
import type { CommandReturn } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn, loadSpec } from "./_base.ts"

/**
 * Run all acceptance tests
 * @param options - Command options
 * @param options.spec - Path to the spec file
 * @param options.format - Format of the spec file
 * @returns Command result with test execution output
 */
export default async function (options: { spec: string; format: "yaml" | "json" }): Promise<CommandReturn> {
  const specOrErr = await loadSpec(options.spec, options.format)
  if (isLeft(specOrErr)) return errToCommandReturn(specOrErr)
  const spec = specOrErr.R

  const commandResult = await executeCommand(spec.connectors.runAcceptanceTests)
  const testResultsOrErr = getRunAtsAdapter("default").parse(spec.acceptanceTests, commandResult)
  if (isLeft(testResultsOrErr)) return errToCommandReturn(testResultsOrErr)
  const testResults = testResultsOrErr.R

  const renderedResult = renderFailingTests(testResults)
  return { stdout: renderedResult, stderr: "", exitCode: 0 }
}
