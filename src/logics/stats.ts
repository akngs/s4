import type { FeatureStats, S4, TestResult } from "../types.ts"

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
