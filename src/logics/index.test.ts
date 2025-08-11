import { ARCHETYPAL_SPEC, makeSpec as makeArchetypalSpec } from "../test-utils.ts"
import type { Either, S4, TestResult } from "../types.ts"
import { getAcceptanceTestDetail, getFeatureDetail } from "./details.ts"
import { calcFeatureStats } from "./stats.ts"
import { checkSyncIssues, getAcceptanceTestDependencyOrder, topologicalSortFeatures } from "./sync.ts"
import { runAllToolsDetailed } from "./tools.ts"

const VALID_SPEC: S4 = ARCHETYPAL_SPEC

const QUERY_TEST_SPEC: S4 = makeArchetypalSpec({
  businessObjectives: [
    { id: "BO-0001", description: "Business Objective 1" },
    { id: "BO-0002", description: "Business Objective 2" },
  ],
  features: [
    { id: "FE-0001", title: "Feature 1", description: "Description 1", covers: ["BO-0001"], prerequisites: [] },
    { id: "FE-0002", title: "Feature 2", description: "Description 2", covers: ["BO-0001", "BO-0002"], prerequisites: ["FE-0001"] },
    { id: "FE-0003", title: "Feature 3", description: "Description 3", covers: ["BO-0002"], prerequisites: ["FE-0002"] },
  ],
  acceptanceTests: [
    { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
    { id: "AT-0002", covers: "FE-0002", given: "G", when: "W", then: "T" },
    { id: "AT-0003", covers: "FE-0002", given: "G", when: "W", then: "T" },
  ],
  tools: [],
  connectors: ARCHETYPAL_SPEC.connectors,
})

// Helper functions
const makeSpec = (overrides: Partial<S4>): S4 => makeArchetypalSpec({ ...VALID_SPEC, ...overrides })
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
const unwrapRight = <L, R>(e: Either<L, R>): R => {
  expect(e._tag).toBe("right")
  return (e as { _tag: "right"; R: R }).R
}
const unwrapLeft = <L, R>(e: Either<L, R>): L => {
  expect(e._tag).toBe("left")
  return (e as { _tag: "left"; L: L }).L
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

describe("topologicalSortFeatures()", () => {
  it.each([
    [
      "dependency order",
      [
        { id: "FE-0001", prerequisites: ["FE-0002"] },
        { id: "FE-0002", prerequisites: ["FE-0003"] },
        { id: "FE-0003", prerequisites: [] },
      ],
      ["FE-0003", "FE-0002", "FE-0001"],
    ],
    [
      "independent features",
      [
        { id: "FE-0001", prerequisites: [] },
        { id: "FE-0002", prerequisites: [] },
      ],
      ["FE-0001", "FE-0002"],
    ],
  ])("should sort features in %s", (_, features, expected) => {
    const result = topologicalSortFeatures(features)
    expect(result).toEqual(expected)
  })

  it("should handle circular dependencies gracefully", () => {
    const features = [
      { id: "FE-0001", prerequisites: ["FE-0002"] },
      { id: "FE-0002", prerequisites: ["FE-0001"] },
    ]
    const result = topologicalSortFeatures(features)
    expect(result).toContain("FE-0001")
    expect(result).toContain("FE-0002")
    expect(result).toHaveLength(2)
  })
})

describe("getAcceptanceTestDependencyOrder()", () => {
  it("should calculate dependency order for acceptance tests", () => {
    const spec = makeSpec({
      features: [makeFeature("FE-0001", ["FE-0002"]), makeFeature("FE-0002")],
      acceptanceTests: [mkAT("AT-0001", "FE-0001"), mkAT("AT-0002", "FE-0002")],
    })

    const result = getAcceptanceTestDependencyOrder(spec)
    expect(result.get("AT-0002")).toBe(0) // FE-0002 has no dependencies
    expect(result.get("AT-0001")).toBe(1) // FE-0001 depends on FE-0002
  })
})

describe("checkSyncIssues()", () => {
  it.each([
    [
      "title mismatches",
      { listAcceptanceTests: "echo 'AT-0001: WRONG'", locateAcceptanceTest: "echo 'src/at/AT-0001.test.ts'" },
      [{ _tag: "mismatching_at", id: "AT-0001", expected: "GIVEN G, WHEN W, THEN T", actual: "WRONG", filePath: "src/at/AT-0001.test.ts" }],
    ],
    ["matching titles", { listAcceptanceTests: "echo 'AT-0001: GIVEN G, WHEN W, THEN T'" }, []],
  ])("should detect %s", async (_, toolOverrides, expectedIssues) => {
    const spec = makeSpec({ connectors: { ...VALID_SPEC.connectors, ...toolOverrides } })
    const issues = unwrapRight(await checkSyncIssues(spec))
    expect(issues).toEqual(expectedIssues)
  })
})

describe("getFeatureDetail()", () => {
  it("should return feature information with all relationships", () => {
    const info = unwrapRight(getFeatureDetail(QUERY_TEST_SPEC, "FE-0002"))
    expect(info.feature.id).toBe("FE-0002")
    expect(info.businessObjectives).toHaveLength(2)
    expect(info.prerequisites.map(p => p.id)).toEqual(["FE-0001"])
    expect(info.dependentFeatures.map(p => p.id)).toEqual(["FE-0003"])
    expect(info.acceptanceTests).toHaveLength(2)
  })

  it("should handle feature with no prerequisites or dependents", () => {
    const info = unwrapRight(getFeatureDetail(QUERY_TEST_SPEC, "FE-0001"))
    expect(info.prerequisites).toHaveLength(0)
    expect(info.dependentFeatures).toHaveLength(1)
  })

  it("should return error when feature not found", () => {
    const err = unwrapLeft(getFeatureDetail(QUERY_TEST_SPEC, "FE-9999"))
    expect(err._tag).toBe("value_error")
    expect(err.message).toContain("FE-9999")
  })
})

describe("getAcceptanceTestDetail()", () => {
  it("should return acceptance test information with relationships", () => {
    const info = unwrapRight(getAcceptanceTestDetail(QUERY_TEST_SPEC, "AT-0002"))
    expect(info.acceptanceTest.id).toBe("AT-0002")
    expect(info.coveredFeature.id).toBe("FE-0002")
    expect(info.relatedBusinessObjectives).toHaveLength(2)
  })

  it("should return error when acceptance test not found", () => {
    const err = unwrapLeft(getAcceptanceTestDetail(QUERY_TEST_SPEC, "AT-9999"))
    expect(err._tag).toBe("value_error")
    expect(err.message).toContain("AT-9999")
  })

  it("should return error when covered feature not found", () => {
    const spec = makeSpec({ acceptanceTests: [mkAT("AT-0001", "FE-9999")] })
    const err = unwrapLeft(getAcceptanceTestDetail(spec, "AT-0001"))
    expect(err._tag).toBe("value_error")
    expect(err.message).toContain("FE-9999")
  })
})

// --- merged from tools.test.ts ---
describe("runAllToolsDetailed()", () => {
  const SPEC_WITH_TOOLS: S4 = makeSpec({
    tools: [
      { id: "success-tool", command: "echo 'success'", stopOnError: false, recommendedNextActions: "Continue with next step" },
      { id: "another-success", command: "echo 'another'", stopOnError: false, recommendedNextActions: "All good" },
    ],
  })

  const SPEC_WITH_FAILING_TOOL: S4 = makeSpec({
    ...SPEC_WITH_TOOLS,
    tools: [
      { id: "success-tool", command: "echo 'success'", stopOnError: false, recommendedNextActions: "Continue" },
      { id: "fail-tool", command: "bash -c 'echo error >&2; exit 1'", stopOnError: true, recommendedNextActions: "Fix the error" },
      { id: "never-runs", command: "echo 'never executed'", stopOnError: false, recommendedNextActions: "Should not see this" },
    ],
  })

  const SPEC_WITH_FAILING_NO_STOP: S4 = makeSpec({
    ...SPEC_WITH_TOOLS,
    tools: [
      { id: "fail-tool", command: "bash -c 'exit 1'", stopOnError: false, recommendedNextActions: "Keep going" },
      { id: "success-after-fail", command: "echo 'still runs'", stopOnError: false, recommendedNextActions: "Final step" },
    ],
  })

  it("should run all tools successfully when all commands succeed", async () => {
    const [tool1, tool2] = await runAllToolsDetailed(SPEC_WITH_TOOLS)
    expect(tool1).toMatchObject({ id: "success-tool", stdout: "success", stderr: "", exitCode: 0, recommendedNextActions: "Continue with next step" })
    expect(tool2).toMatchObject({ id: "another-success", stdout: "another", exitCode: 0 })
  })

  it("should stop execution when tool fails and stopOnError is true", async () => {
    const result = await runAllToolsDetailed(SPEC_WITH_FAILING_TOOL)
    expect(result[0]).toMatchObject({ id: "success-tool", exitCode: 0 })
    expect(result[1]).toMatchObject({ id: "fail-tool", exitCode: 1, stderr: "error\n" })
    expect(result.find(t => t.id === "never-runs")).toBeUndefined()
  })

  it("should continue execution when tool fails but stopOnError is false", async () => {
    const [failTool, successTool] = await runAllToolsDetailed(SPEC_WITH_FAILING_NO_STOP)
    expect(failTool).toMatchObject({ id: "fail-tool", exitCode: 1 })
    expect(successTool).toMatchObject({ id: "success-after-fail", exitCode: 0, stdout: "still runs" })
  })

  it("should handle empty tools array", async () => {
    const result = await runAllToolsDetailed(makeSpec({ ...SPEC_WITH_TOOLS, tools: [] }))
    expect(result).toHaveLength(0)
  })
})
