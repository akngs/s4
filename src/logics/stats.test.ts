import { makeSpec } from "../test-utils.ts"
import type { S4, TestResult } from "../types.ts"
import { calcFeatureStats } from "./stats.ts"

// Helper functions
const makeFeature = (id: string, prerequisites: string[] = [], covers: string[] = ["BO-0001"]) => ({
  id,
  title: id,
  description: id,
  covers,
  prerequisites,
})
const mkAT = (id: string, covers: string) => ({ id, covers, given: "G", when: "W", then: "T" })
const getAT = (s: S4, id: string) => {
  const t = s.acceptanceTests.find(a => a.id === id)
  if (!t) throw new Error(`AcceptanceTest ${id} not found in spec`)
  return t
}

describe("calcFeatureStats()", () => {
  const spec = makeSpec({
    features: [makeFeature("FE-0001"), makeFeature("FE-0002")],
    acceptanceTests: [mkAT("AT-0001", "FE-0001"), mkAT("AT-0002", "FE-0001"), mkAT("AT-0003", "FE-0002")],
  })

  it.each<{
    name: string
    testResults: TestResult[]
    expected: Map<string, { passed: number; total: number }>
  }>([
    {
      name: "calculate completion stats correctly",
      testResults: [
        { id: "AT-0001", test: getAT(spec, "AT-0001"), passed: true },
        { id: "AT-0002", test: getAT(spec, "AT-0002"), passed: false },
        { id: "AT-0003", test: getAT(spec, "AT-0003"), passed: true },
      ],
      expected: new Map([
        ["FE-0001", { passed: 1, total: 2 }],
        ["FE-0002", { passed: 1, total: 1 }],
      ]),
    },
    {
      name: "handle missing test results",
      testResults: [{ id: "AT-0001", test: getAT(spec, "AT-0001"), passed: true }],
      expected: new Map([
        ["FE-0001", { passed: 1, total: 2 }],
        ["FE-0002", { passed: 0, total: 1 }],
      ]),
    },
  ])("should %s", ({ testResults, expected }) => {
    expect(calcFeatureStats(spec, testResults)).toEqual(expected)
  })

  it("should handle features with no tests", () => {
    const specNoTests = makeSpec({ features: [makeFeature("FE-0001")], acceptanceTests: [] })
    expect(calcFeatureStats(specNoTests, []).get("FE-0001")).toEqual({ passed: 0, total: 0 })
  })
})
