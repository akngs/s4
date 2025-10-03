import { makeSpec } from "../test-utils.ts"
import type { S4, TestResult } from "../types.ts"
import { calcFeatureStats } from "./stats.ts"

const getAT = (s: S4, id: string) => {
  const t = s.acceptanceTests.find(a => a.id === id)
  if (!t) throw new Error(`AcceptanceTest ${id} not found in spec`)
  return t
}

const spec = makeSpec({
  features: [
    { id: "FE-0001", title: "FE-0001", description: "FE-0001", covers: ["BO-0001"], prerequisites: [] },
    { id: "FE-0002", title: "FE-0002", description: "FE-0002", covers: ["BO-0001"], prerequisites: [] },
  ],
  acceptanceTests: [
    { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
    { id: "AT-0002", covers: "FE-0001", given: "G", when: "W", then: "T" },
    { id: "AT-0003", covers: "FE-0002", given: "G", when: "W", then: "T" },
  ],
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
  const specNoTests = makeSpec({
    features: [{ id: "FE-0001", title: "FE-0001", description: "FE-0001", covers: ["BO-0001"], prerequisites: [] }],
    acceptanceTests: [],
  })
  expect(calcFeatureStats(specNoTests, []).get("FE-0001")).toEqual({ passed: 0, total: 0 })
})
