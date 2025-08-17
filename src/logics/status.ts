import { getInstance as getRunAtsAdapter } from "../adapters/run-ats.ts"
import {
  type Either,
  type Issue,
  isLeft,
  left,
  right,
  type S4,
  type StatusReport,
  type SystemError,
  type TestResult,
  type ToolRunResult,
} from "../types.ts"
import { executeCommand } from "./exec.ts"
import { calcFeatureStats } from "./stats.ts"
import { checkSyncIssues } from "./sync.ts"
import { runAllToolsDetailed } from "./tools.ts"
import { validateInternalConsistency } from "./validation.ts"

/**
 * Performs an overall status check of the project and suggests the next action to take
 * @param spec - The S4 spec containing project configuration and definitions
 * @returns Either a system error or the overall status check result with feature stats, issues, and the next action to take
 */
export async function performOverallStatusCheck(spec: S4): Promise<Either<SystemError, StatusReport>> {
  const issues: Issue[] = []

  const testsOrErr = await getAcceptanceTestResults(spec)
  if (isLeft(testsOrErr)) return left(testsOrErr.L)
  const { testResults, failingIssue } = testsOrErr.R
  if (failingIssue) issues.push(failingIssue)

  const syncIssuesOrErr = await checkSyncIssues(spec)
  if (isLeft(syncIssuesOrErr)) return left(syncIssuesOrErr.L)
  issues.push(...syncIssuesOrErr.R)

  // Internal consistency
  issues.push(...validateInternalConsistency(spec))

  const toolResults: ToolRunResult[] = await runAllToolsDetailed(spec)
  const failures = toolResults.filter(t => t.exitCode !== 0)
  if (failures.length > 0) issues.push({ _tag: "failing_tools", failures })

  return right({ issues, featureStats: calcFeatureStats(spec, testResults), toolResults })
}

/**
 * Run acceptance tests and return results along with a failing issue if any
 * @param spec - The S4 spec containing acceptance test definitions
 * @returns Either a system error or test results with optional failing issue
 */
async function getAcceptanceTestResults(
  spec: S4,
): Promise<Either<SystemError, { testResults: TestResult[]; failingIssue?: { _tag: "failing_tests"; testResults: TestResult[] } }>> {
  const rawResult = await executeCommand(spec.connectors.runAcceptanceTests)
  const testResultsOrErr = getRunAtsAdapter("default").parse(spec.acceptanceTests, rawResult)
  if (isLeft(testResultsOrErr)) return left(testResultsOrErr.L)
  const testResults = testResultsOrErr.R
  const failingIssue = testResults.some(r => !r.passed) ? { _tag: "failing_tests" as const, testResults } : undefined
  return right({ testResults, failingIssue })
}
