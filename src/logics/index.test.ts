import { ARCHETYPAL_SPEC, createSpec as createArchetypalSpec } from "../test-utils.ts"
import type { S4, TestResult } from "../types.ts"
import { isRight } from "../types.ts"
import {
  calcFeatureStats,
  checkSyncIssues,
  getAcceptanceTestDependencyOrder,
  getAcceptanceTestDetail,
  getFeatureDetail,
  runAllToolsDetailed,
  topologicalSortFeatures,
} from "./index.ts"

const VALID_SPEC: S4 = ARCHETYPAL_SPEC

const QUERY_TEST_SPEC: S4 = createArchetypalSpec({
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
const createSpec = (overrides: Partial<S4>): S4 => createArchetypalSpec({ ...VALID_SPEC, ...overrides })

describe("calcFeatureStats()", () => {
  const spec = createSpec({
    features: [
      { id: "FE-0001", title: "Feature 1", description: "Description", covers: ["BO-0001"], prerequisites: [] },
      { id: "FE-0002", title: "Feature 2", description: "Description", covers: ["BO-0001"], prerequisites: [] },
    ],
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
      { id: "AT-0002", covers: "FE-0001", given: "G", when: "W", then: "T" },
      { id: "AT-0003", covers: "FE-0002", given: "G", when: "W", then: "T" },
    ],
  })

  it("should calculate completion stats correctly", () => {
    const testResults: TestResult[] = [
      { id: "AT-0001", test: spec.acceptanceTests[0] as NonNullable<(typeof spec.acceptanceTests)[0]>, passed: true },
      { id: "AT-0002", test: spec.acceptanceTests[1] as NonNullable<(typeof spec.acceptanceTests)[1]>, passed: false },
      { id: "AT-0003", test: spec.acceptanceTests[2] as NonNullable<(typeof spec.acceptanceTests)[2]>, passed: true },
    ]
    const result = calcFeatureStats(spec, testResults)
    expect(result.get("FE-0001")).toEqual({ passed: 1, total: 2 })
    expect(result.get("FE-0002")).toEqual({ passed: 1, total: 1 })
  })

  it("should handle features with no tests", () => {
    const specNoTests = createSpec({
      features: [{ id: "FE-0001", title: "Feature 1", description: "Description", covers: ["BO-0001"], prerequisites: [] }],
      acceptanceTests: [],
    })
    expect(calcFeatureStats(specNoTests, []).get("FE-0001")).toEqual({ passed: 0, total: 0 })
  })

  it("should handle missing test results", () => {
    const testResults: TestResult[] = [
      { id: "AT-0001", test: spec.acceptanceTests[0] as NonNullable<(typeof spec.acceptanceTests)[0]>, passed: true },
    ]
    const result = calcFeatureStats(spec, testResults)
    expect(result.get("FE-0001")).toEqual({ passed: 1, total: 2 })
    expect(result.get("FE-0002")).toEqual({ passed: 0, total: 1 })
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
    const spec = createSpec({
      features: [
        { id: "FE-0001", title: "Feature 1", description: "Description", covers: ["BO-0001"], prerequisites: ["FE-0002"] },
        { id: "FE-0002", title: "Feature 2", description: "Description", covers: ["BO-0001"], prerequisites: [] },
      ],
      acceptanceTests: [
        { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
        { id: "AT-0002", covers: "FE-0002", given: "G", when: "W", then: "T" },
      ],
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
      {
        listAcceptanceTests: "echo 'AT-0001: WRONG'",
        locateAcceptanceTest: "echo 'src/at/AT-0001.test.ts'",
      },
      {
        _tag: "mismatching_at",
        id: "AT-0001",
        expected: "GIVEN G, WHEN W, THEN T",
        actual: "WRONG",
        filePath: "src/at/AT-0001.test.ts",
      },
    ],
    [
      "matching titles",
      {
        listAcceptanceTests: "echo 'AT-0001: GIVEN G, WHEN W, THEN T'",
      },
      null,
    ],
  ])("should detect %s", async (_, toolOverrides, expectedIssue) => {
    const spec = createSpec({
      connectors: { ...VALID_SPEC.connectors, ...toolOverrides },
    })

    const result = await checkSyncIssues(spec)
    expect(isRight(result)).toBe(true)
    if (!isRight(result)) return

    if (expectedIssue) {
      expect(result.R).toHaveLength(1)
      expect(result.R[0]).toEqual(expectedIssue)
    } else {
      expect(result.R).toHaveLength(0)
    }
  })
})

describe("getFeatureDetail()", () => {
  it("should return feature information with all relationships", () => {
    const result = getFeatureDetail(QUERY_TEST_SPEC, "FE-0002")
    expect(result._tag).toBe("right")
    if (result._tag === "right") {
      const info = result.R
      expect(info.feature.id).toBe("FE-0002")
      expect(info.businessObjectives).toHaveLength(2)
      expect(info.prerequisites).toHaveLength(1)
      expect(info.prerequisites[0]?.id).toBe("FE-0001")
      expect(info.dependentFeatures).toHaveLength(1)
      expect(info.dependentFeatures[0]?.id).toBe("FE-0003")
      expect(info.acceptanceTests).toHaveLength(2)
    }
  })

  it("should handle feature with no prerequisites or dependents", () => {
    const result = getFeatureDetail(QUERY_TEST_SPEC, "FE-0001")
    expect(result._tag).toBe("right")
    if (result._tag === "right") {
      const info = result.R
      expect(info.prerequisites).toHaveLength(0)
      expect(info.dependentFeatures).toHaveLength(1)
    }
  })

  it("should return error when feature not found", () => {
    const result = getFeatureDetail(QUERY_TEST_SPEC, "FE-9999")
    expect(result._tag).toBe("left")
    if (result._tag === "left") {
      expect(result.L._tag).toBe("value_error")
      expect(result.L.message).toContain("FE-9999")
    }
  })
})

describe("getAcceptanceTestDetail()", () => {
  it("should return acceptance test information with relationships", () => {
    const result = getAcceptanceTestDetail(QUERY_TEST_SPEC, "AT-0002")
    expect(result._tag).toBe("right")
    if (result._tag === "right") {
      const info = result.R
      expect(info.acceptanceTest.id).toBe("AT-0002")
      expect(info.coveredFeature.id).toBe("FE-0002")
      expect(info.relatedBusinessObjectives).toHaveLength(2)
    }
  })

  it("should return error when acceptance test not found", () => {
    const result = getAcceptanceTestDetail(QUERY_TEST_SPEC, "AT-9999")
    expect(result._tag).toBe("left")
    if (result._tag === "left") {
      expect(result.L._tag).toBe("value_error")
      expect(result.L.message).toContain("AT-9999")
    }
  })

  it("should return error when covered feature not found", () => {
    const spec = createSpec({ acceptanceTests: [{ id: "AT-0001", covers: "FE-9999", given: "G", when: "W", then: "T" }] })
    const result = getAcceptanceTestDetail(spec, "AT-0001")
    expect(result._tag).toBe("left")
    if (result._tag === "left") {
      expect(result.L._tag).toBe("value_error")
      expect(result.L.message).toContain("FE-9999")
    }
  })
})

// --- merged from tools.test.ts ---
describe("runAllToolsDetailed()", () => {
  const SPEC_WITH_TOOLS: S4 = createSpec({
    tools: [
      { id: "success-tool", command: "echo 'success'", stopOnError: false, recommendedNextActions: "Continue with next step" },
      { id: "another-success", command: "echo 'another'", stopOnError: false, recommendedNextActions: "All good" },
    ],
  })

  const SPEC_WITH_FAILING_TOOL: S4 = createSpec({
    ...SPEC_WITH_TOOLS,
    tools: [
      { id: "success-tool", command: "echo 'success'", stopOnError: false, recommendedNextActions: "Continue" },
      { id: "fail-tool", command: "bash -c 'echo error >&2; exit 1'", stopOnError: true, recommendedNextActions: "Fix the error" },
      { id: "never-runs", command: "echo 'never executed'", stopOnError: false, recommendedNextActions: "Should not see this" },
    ],
  })

  const SPEC_WITH_FAILING_NO_STOP: S4 = createSpec({
    ...SPEC_WITH_TOOLS,
    tools: [
      { id: "fail-tool", command: "bash -c 'exit 1'", stopOnError: false, recommendedNextActions: "Keep going" },
      { id: "success-after-fail", command: "echo 'still runs'", stopOnError: false, recommendedNextActions: "Final step" },
    ],
  })

  it("should run all tools successfully when all commands succeed", async () => {
    const result = await runAllToolsDetailed(SPEC_WITH_TOOLS)

    const tool1 = result[0]
    if (!tool1) throw new Error("Success tool not found")
    const tool2 = result[1]
    if (!tool2) throw new Error("Another success tool not found")

    expect(tool1.id).toBe("success-tool")
    expect(tool1.stdout).toBe("success")
    expect(tool1.stderr).toBe("")
    expect(tool1.exitCode).toBe(0)
    expect(tool1.recommendedNextActions).toBe("Continue with next step")

    expect(tool2.id).toBe("another-success")
    expect(tool2.stdout).toBe("another")
    expect(tool2.exitCode).toBe(0)
  })

  it("should stop execution when tool fails and stopOnError is true", async () => {
    const result = await runAllToolsDetailed(SPEC_WITH_FAILING_TOOL)

    const successTool = result[0]
    if (!successTool) throw new Error("Success tool not found")
    const failTool = result[1]
    if (!failTool) throw new Error("Fail tool not found")

    expect(successTool.id).toBe("success-tool")
    expect(successTool.exitCode).toBe(0)

    expect(failTool.id).toBe("fail-tool")
    expect(failTool.exitCode).toBe(1)
    expect(failTool.stderr).toBe("error\n")

    // Third tool should not have run
    expect(result.find(t => t.id === "never-runs")).toBeUndefined()
  })

  it("should continue execution when tool fails but stopOnError is false", async () => {
    const result = await runAllToolsDetailed(SPEC_WITH_FAILING_NO_STOP)

    const failTool = result[0]
    if (!failTool) throw new Error("Fail tool not found")
    const successTool = result[1]
    if (!successTool) throw new Error("Success tool not found")

    expect(failTool.id).toBe("fail-tool")
    expect(failTool.exitCode).toBe(1)

    expect(successTool.id).toBe("success-after-fail")
    expect(successTool.exitCode).toBe(0)
    expect(successTool.stdout).toBe("still runs")
  })

  it("should handle empty tools array", async () => {
    const emptySpec: S4 = createSpec({ ...SPEC_WITH_TOOLS, tools: [] })
    const result = await runAllToolsDetailed(emptySpec)

    expect(result).toHaveLength(0)
  })
})
