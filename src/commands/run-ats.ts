import { getInstance as getRunAtsAdapter } from "../adapters/run-ats.ts"
import { executeCommand } from "../logics/exec.ts"
import { renderFailingTests } from "../render/index.ts"
import type { CommandReturn, S4 } from "../types.ts"
import { isLeft } from "../types.ts"
import { errToCommandReturn } from "./_base.ts"

/**
 * Run all acceptance tests
 * @param spec - The loaded S4 spec instance
 * @returns Command result with test execution output
 */
export default async function (spec: S4): Promise<CommandReturn> {
  const commandResult = await executeCommand(spec.connectors.runAcceptanceTests)
  const testResultsOrErr = getRunAtsAdapter("default").parse(spec.acceptanceTests, commandResult)
  if (isLeft(testResultsOrErr)) return errToCommandReturn(testResultsOrErr)
  const testResults = testResultsOrErr.R

  const renderedResult = renderFailingTests(testResults)
  return { stdout: renderedResult, stderr: "", exitCode: 0 }
}
