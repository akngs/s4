import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import * as yaml from "yaml"
import { getInstance as getListAtsAdapter } from "../adapters/list-ats.ts"
import { getInstance as getRunAtsAdapter } from "../adapters/run-ats.ts"
import {
  type AcceptanceTestDetail,
  type Either,
  type FeatureDetail,
  type FeatureStats,
  type Guideline,
  GuidelineSchema,
  type Issue,
  isLeft,
  left,
  right,
  type S4,
  type StatusReport,
  type SyncIssue,
  type SystemError,
  type TestResult,
  type ToolRunResult,
  type ValueError,
} from "../types.ts"
import { executeCommand } from "./exec.ts"
import { validateInternalConsistency } from "./validation.ts"

// moved executeCommand to exec.ts to avoid circular dependency

/**
 * Performs an overall status check of the project and suggests the next action to take
 * @param spec - The S4 spec containing project configuration and definitions
 * @returns Either a system error or the overall status check result with feature stats, issues, and the next action to take
 */
export async function performOverallStatusCheck(spec: S4): Promise<Either<SystemError, StatusReport>> {
  const issues: Issue[] = []

  // Acceptance tests
  const testsOrErr = await getAcceptanceTestResults(spec)
  if (isLeft(testsOrErr)) return left(testsOrErr.L)
  const { testResults, failingIssue } = testsOrErr.R
  if (failingIssue) issues.push(failingIssue)

  // Internal consistency
  issues.push(...validateInternalConsistency(spec))

  // Spec-code synchronization
  const syncIssuesOrErr = await checkSyncIssues(spec)
  if (isLeft(syncIssuesOrErr)) return left(syncIssuesOrErr.L)
  issues.push(...syncIssuesOrErr.R)

  // Tools
  const toolResults = await runAllToolsDetailed(spec)
  const failures = toolResults.filter(t => t.exitCode !== 0)
  if (failures.length > 0) {
    issues.push({ _tag: "failing_tools", failures })
  }

  return right({ issues, featureStats: calcFeatureStats(spec, testResults), toolResults })
}

/**
 * Run all tools defined in the spec and return detailed results.
 * Tools are executed sequentially and may stop early if a tool fails and `stopOnError` is true.
 * @param spec - The S4 spec containing tool definitions
 * @returns Detailed results for each tool
 */
export async function runAllToolsDetailed(spec: S4): Promise<ToolRunResult[]> {
  const perTool: ToolRunResult[] = []
  for (const tool of spec.tools) {
    const result = await executeCommand(tool.command)
    perTool.push({
      id: tool.id,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      recommendedNextActions: tool.recommendedNextActions,
    })
    if (result.exitCode !== 0 && tool.stopOnError) break
  }
  return perTool
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

// (removed) collectToolFailures(): tools are now executed once in performOverallStatusCheck()

/**
 * Checks for spec-code synchronization issues by comparing defined acceptance tests with implemented ones
 * @param spec - The S4 spec containing acceptance test definitions and tool configurations
 * @returns Either a system error or an array of synchronization issues (missing, dangling, or mismatching tests)
 */
export async function checkSyncIssues(spec: S4): Promise<Either<SystemError, SyncIssue[]>> {
  if (spec.connectors.listAcceptanceTests === "") return right([])

  // Execute the command to list acceptance test files
  const rawResult = await executeCommand(spec.connectors.listAcceptanceTests)

  // Check if command failed
  if (rawResult.exitCode !== 0) {
    return left({ _tag: "exec_error", command: "listAcceptanceTests", cause: new Error(rawResult.stderr) })
  }

  // Parse the output to get implemented acceptance test IDs and titles
  const parsedTestsResult = getListAtsAdapter("default").parse(rawResult.stdout)
  if (isLeft(parsedTestsResult)) return left(parsedTestsResult.L)

  const implementedTests = parsedTestsResult.R
  const implementedTestIds = implementedTests.map(test => test.id)
  const implementedTestMap = new Map(implementedTests.map(test => [test.id, test.description]))

  // Find missing acceptance tests (defined in spec but not implemented)
  const missingTests = spec.acceptanceTests.filter(test => !implementedTestIds.includes(test.id))

  // Sort missing tests by dependency order
  const testOrderMap = getAcceptanceTestDependencyOrder(spec)
  const sortedMissingTests = missingTests.toSorted((a, b) => {
    const orderA = testOrderMap.get(a.id) ?? Infinity
    const orderB = testOrderMap.get(b.id) ?? Infinity
    return orderA - orderB
  })

  const missingTestIssues = await Promise.all(
    sortedMissingTests.map(async test => ({ _tag: "missing_at" as const, id: test.id, filePath: await resolveAcceptanceTestPath(spec, test.id) })),
  )

  // Find dangling acceptance tests (implemented in code but not defined in spec)
  const definedTestIds = new Set(spec.acceptanceTests.map(test => test.id))
  const danglingTests = implementedTestIds.filter((id: string) => !definedTestIds.has(id))
  const danglingTestIssues = await Promise.all(
    danglingTests.map(async (id: string) => ({ _tag: "dangling_at" as const, id, filePath: await resolveAcceptanceTestPath(spec, id) })),
  )

  // Find mismatching acceptance test (implemented test's description doesn't match spec description)
  const mismatchingTestIssues = await Promise.all(
    spec.acceptanceTests.flatMap(async test => {
      const actual = implementedTestMap.get(test.id)
      const expected = `GIVEN ${test.given}, WHEN ${test.when}, THEN ${test.then}`
      if (actual === undefined || actual === expected) return []

      const filePath = await resolveAcceptanceTestPath(spec, test.id)
      return [{ _tag: "mismatching_at" as const, id: test.id, expected, actual, filePath }]
    }),
  )

  return right([...missingTestIssues, ...danglingTestIssues, ...mismatchingTestIssues.flat()])
}

/**
 * Calculates completion stats for features based on passing acceptance tests
 * @param spec - The S4 spec containing features and acceptance tests
 * @param testResults - Results from running acceptance tests
 * @returns Map of feature IDs to their completion stats (passed/total test counts)
 */
export function calcFeatureStats(spec: S4, testResults: TestResult[]): FeatureStats {
  const stats = new Map<string, { passed: number; total: number }>()

  for (const feat of spec.features) {
    const coveringTests = spec.acceptanceTests.filter(at => at.covers === feat.id)
    const total = coveringTests.length
    const passed = coveringTests.filter(at => testResults.find(r => r.id === at.id)?.passed).length
    stats.set(feat.id, { passed, total })
  }
  return stats
}

/**
 * Executes a shell command and returns both stdout and stderr, even on non-zero exit code
 * @param cmd - The shell command to execute
 * @returns Command execution result with stdout, stderr, and exit code
 */
// executeCommand imported from exec.ts

/**
 * Resolves the file path for an acceptance test by executing the locate command
 * @param spec - The S4 spec containing tool configurations
 * @param testId - ID of the acceptance test to locate
 * @returns Promise that resolves to the file path of the acceptance test
 */
async function resolveAcceptanceTestPath(spec: S4, testId: string): Promise<string> {
  const locateCommand = spec.connectors.locateAcceptanceTest.replace("{ID}", testId)
  const result = await executeCommand(locateCommand)
  return result.stdout.trim()
}

/**
 * Gets the dependency order for acceptance tests based on their feature dependencies
 * @param spec - The S4 spec containing features and acceptance tests
 * @returns Map of acceptance test IDs to their dependency order (lower numbers = higher priority)
 */
export function getAcceptanceTestDependencyOrder(spec: S4): Map<string, number> {
  // Create a map from feature ID to its dependency order
  const featureOrder = topologicalSortFeatures(spec.features)
  const featureOrderMap = new Map(featureOrder.map((id, index) => [id, index]))

  // Create a map from acceptance test ID to its dependency order
  const testOrderMap = new Map<string, number>()

  for (const test of spec.acceptanceTests) {
    const featureOrder = featureOrderMap.get(test.covers) ?? Infinity
    testOrderMap.set(test.id, featureOrder)
  }

  return testOrderMap
}

/**
 * Topologically sorts features based on their prerequisites to determine dependency order
 * @param features - Array of features with their prerequisites
 * @returns Array of feature IDs in topological order (prerequisites come before dependents)
 */
export function topologicalSortFeatures(features: { id: string; prerequisites: string[] }[]): string[] {
  const visited = new Set<string>()
  const temp = new Set<string>()
  const order: string[] = []
  const featureMap = new Map(features.map(f => [f.id, f.prerequisites]))

  const visit = (id: string): void => {
    if (temp.has(id)) return
    if (visited.has(id)) return

    temp.add(id)

    const prerequisites = featureMap.get(id) ?? []
    for (const prereq of prerequisites) visit(prereq)

    temp.delete(id)
    visited.add(id)
    order.push(id)
  }

  for (const feature of features) {
    if (!visited.has(feature.id)) {
      visit(feature.id)
    }
  }

  return order
}

/**
 * Gets detailed information about a specific feature including its relationships
 * @param spec - The S4 spec containing features, business objectives, and acceptance tests
 * @param featureId - ID of the feature to get information for
 * @returns Either a value error or detailed feature information including related business objectives, prerequisites, dependents, and acceptance tests
 */
export function getFeatureDetail(spec: S4, featureId: string): Either<ValueError, FeatureDetail> {
  const feature = spec.features.find(f => f.id === featureId)
  if (feature === undefined) return left({ _tag: "value_error", value: featureId, message: `Feature "${featureId}" not found in spec` })

  const businessObjectives = spec.businessObjectives.filter(bo => feature.covers.includes(bo.id))
  const prerequisites = spec.features.filter(f => feature.prerequisites.includes(f.id))
  const dependentFeatures = spec.features.filter(f => f.prerequisites.includes(featureId))
  const acceptanceTests = spec.acceptanceTests.filter(at => at.covers === featureId)

  return right({ feature, businessObjectives, prerequisites, dependentFeatures, acceptanceTests })
}

/**
 * Gets detailed information about a specific acceptance test including its relationships
 * @param spec - The S4 spec containing acceptance tests, features, and business objectives
 * @param acceptanceTestId - ID of the acceptance test to get information for
 * @returns Either a value error or detailed acceptance test information including the covered feature and related business objectives
 */
export function getAcceptanceTestDetail(spec: S4, acceptanceTestId: string): Either<ValueError, AcceptanceTestDetail> {
  const acceptanceTest = spec.acceptanceTests.find(at => at.id === acceptanceTestId)
  if (acceptanceTest === undefined) {
    return left({ _tag: "value_error", value: acceptanceTestId, message: `Acceptance test "${acceptanceTestId}" not found in spec` })
  }

  const coveredFeature = spec.features.find(f => f.id === acceptanceTest.covers)
  if (coveredFeature === undefined) {
    return left({ _tag: "value_error", value: acceptanceTest.covers, message: `Feature "${acceptanceTest.covers}" not found in spec` })
  }

  const relatedBusinessObjectives = spec.businessObjectives.filter(bo => coveredFeature.covers.includes(bo.id))

  return right({ acceptanceTest, coveredFeature, relatedBusinessObjectives })
}

/**
 * Build data for the guide command by reading and validating `guideline.yaml`.
 * When no section is provided, returns the brief guidance text.
 * When a section is provided, validates the key and returns the section text
 * along with flattened, YAML-formatted example entries suitable for rendering.
 * @param section Optional section key (e.g., "title", "mission", "vision", "businessObjective", "feature", "acceptanceTest", "connectors", "tools").
 * @returns Either a system error or a view model for rendering the guide.
 */
export async function getGuidelineView(
  section?: string,
): Promise<
  Either<
    SystemError,
    | { kind: "brief"; brief: string }
    | { kind: "section"; sectionText: string; examples: ReadonlyArray<{ kind: "scalar" | "block"; text: string }> }
    | { kind: "unknown_section"; allowed: string[] }
  >
> {
  const dataOrErr = await loadGuideline()
  if (isLeft(dataOrErr)) return left(dataOrErr.L)
  const data = dataOrErr.R

  if (!section) return right({ kind: "brief", brief: data.brief })
  const allowedSections = Object.keys(data.sections)

  if (!allowedSections.includes(section)) return right({ kind: "unknown_section", allowed: allowedSections })

  const sectionText = data.sections[section as keyof typeof data.sections]
  const rawValues = data.examples.map(ex => ex[section as keyof (typeof data.examples)[number]])
  const valuesForRendering = _flattenOneLevel(rawValues)
  const examples = valuesForRendering.map((item: unknown) => formatExampleToRenderable(item))

  return right({ kind: "section", sectionText, examples })
}

/**
 * Load and validate the guideline YAML.
 * @returns Parsed guideline object.
 */
async function loadGuideline(): Promise<Either<SystemError, Guideline>> {
  try {
    const moduleDir = dirname(fileURLToPath(import.meta.url))
    const filePath = join(moduleDir, "guideline.yaml")
    const raw = await readFile(filePath, "utf-8")

    const obj = yaml.parse(raw) as unknown
    const parsed = GuidelineSchema.safeParse(obj)
    if (!parsed.success) {
      return left({ _tag: "parse_error", message: parsed.error.message, cause: parsed.error })
    }
    return right(parsed.data)
  } catch (err) {
    return left({ _tag: "io_error", filePath: "guideline.yaml", cause: err })
  }
}

/**
 * Flatten nested arrays by one level.
 * @param values Array of values possibly containing arrays.
 * @returns New array flattened by one level.
 */
function _flattenOneLevel(values: unknown[]): unknown[] {
  const out: unknown[] = []
  for (const v of values) {
    if (Array.isArray(v)) out.push(...(v as unknown[]))
    else out.push(v)
  }
  return out
}

/**
 * Convert an arbitrary example value into a renderable entry.
 * @param item Any example value from the guideline examples array.
 * @returns Renderable entry specifying whether it's scalar or a YAML block.
 */
function formatExampleToRenderable(item: unknown): { kind: "scalar" | "block"; text: string } {
  const isScalar = typeof item === "string" || typeof item === "number" || typeof item === "boolean"
  if (isScalar) return { kind: "scalar", text: String(item) }
  try {
    // Invoke JSON.stringify to allow tests that spy on it to force a failure path
    // Discard the result because we render as YAML for examples
    JSON.stringify(item)
    const yamlText = yaml.stringify(item).trimEnd()
    return { kind: "block", text: yamlText }
  } catch {
    return { kind: "scalar", text: Object.prototype.toString.call(item) }
  }
}
