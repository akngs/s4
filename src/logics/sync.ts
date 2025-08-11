import { getInstance as getListAtsAdapter } from "../adapters/list-ats.ts"
import type { Either, S4, SyncIssue, SystemError } from "../types.ts"
import { executeCommand } from "./exec.ts"

/**
 * Checks for spec-code synchronization issues by comparing defined acceptance tests with implemented ones
 * @param spec - The S4 spec containing acceptance test definitions and tool configurations
 * @returns Either a system error or an array of synchronization issues (missing, dangling, or mismatching tests)
 */
export async function checkSyncIssues(spec: S4): Promise<Either<SystemError, SyncIssue[]>> {
  if (spec.connectors.listAcceptanceTests === "") return { _tag: "right", R: [] }

  const rawResult = await executeCommand(spec.connectors.listAcceptanceTests)
  if (rawResult.exitCode !== 0) {
    return {
      _tag: "left",
      L: { _tag: "exec_error", command: "listAcceptanceTests", cause: new Error(rawResult.stderr) },
    }
  }

  const parsedTestsResult = getListAtsAdapter("default").parse(rawResult.stdout)
  if (parsedTestsResult._tag === "left") return parsedTestsResult

  const implementedTests = parsedTestsResult.R
  const implementedTestIds = implementedTests.map(test => test.id)
  const implementedTestMap = new Map(implementedTests.map(test => [test.id, test.description]))

  const missingTests = spec.acceptanceTests.filter(test => !implementedTestIds.includes(test.id))
  const testOrderMap = getAcceptanceTestDependencyOrder(spec)
  const sortedMissingTests = missingTests.toSorted((a, b) => {
    const orderA = testOrderMap.get(a.id) ?? Infinity
    const orderB = testOrderMap.get(b.id) ?? Infinity
    return orderA - orderB
  })

  const missingTestIssues = await Promise.all(
    sortedMissingTests.map(async test => ({ _tag: "missing_at" as const, id: test.id, filePath: await resolveAcceptanceTestPath(spec, test.id) })),
  )

  const definedTestIds = new Set(spec.acceptanceTests.map(test => test.id))
  const danglingTests = implementedTestIds.filter((id: string) => !definedTestIds.has(id))
  const danglingTestIssues = await Promise.all(
    danglingTests.map(async (id: string) => ({ _tag: "dangling_at" as const, id, filePath: await resolveAcceptanceTestPath(spec, id) })),
  )

  const mismatchingTestIssues = await Promise.all(
    spec.acceptanceTests.flatMap(async test => {
      const actual = implementedTestMap.get(test.id)
      const expected = `GIVEN ${test.given}, WHEN ${test.when}, THEN ${test.then}`
      if (actual === undefined || actual === expected) return []

      const filePath = await resolveAcceptanceTestPath(spec, test.id)
      return [{ _tag: "mismatching_at" as const, id: test.id, expected, actual, filePath }]
    }),
  )

  return { _tag: "right", R: [...missingTestIssues, ...danglingTestIssues, ...mismatchingTestIssues.flat()] }
}

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
  const featureOrder = topologicalSortFeatures(spec.features)
  const featureOrderMap = new Map(featureOrder.map((id, index) => [id, index]))

  const testOrderMap = new Map<string, number>()
  for (const test of spec.acceptanceTests) {
    const order = featureOrderMap.get(test.covers) ?? Infinity
    testOrderMap.set(test.id, order)
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
