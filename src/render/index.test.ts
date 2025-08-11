import { makeSpec } from "../test-utils.ts"
import type { AcceptanceTestDetail, FeatureDetail, S4, SystemError, ValidationIssue } from "../types.ts"
import {
  renderAcceptanceTestDetail,
  renderDanglingTests,
  renderFailingTests,
  renderFeatureDetail,
  renderMissingTests,
  renderStatus,
  renderSystemError,
  renderValidationIssues,
} from "./index.ts"

// Test data helpers
const makeValidSpec = (): S4 =>
  makeSpec({
    title: "Test Project",
    mission: "Test mission",
    vision: "Test vision",
    businessObjectives: [
      { id: "BO-0001", description: "First objective" },
      { id: "BO-0002", description: "Second objective" },
    ],
    features: [
      { id: "FE-0001", title: "Feature 1", description: "First feature", covers: ["BO-0001"], prerequisites: [] },
      { id: "FE-0002", title: "Feature 2", description: "Second feature", covers: ["BO-0002"], prerequisites: ["FE-0001"] },
    ],
    acceptanceTests: [
      { id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" },
      { id: "AT-0002", covers: "FE-0002", given: "G", when: "W", then: "T" },
    ],
    tools: [],
    connectors: {
      listAcceptanceTests: "ls -1 src/at/*.test.ts | xargs -n 1 basename | sed 's/\.test\.ts$//'",
      locateAcceptanceTest: "ls src/at/{ID}.test.ts",
      runAcceptanceTest: "npm run test:acceptance -- src/at/{ID}.test.ts",
      runAcceptanceTests: "npm run test:acceptance",
    },
  })

const makeEmptySpec = (): S4 => ({
  title: "Empty",
  mission: "Empty mission",
  vision: "Empty vision",
  concepts: [],
  businessObjectives: [],
  features: [],
  acceptanceTests: [],
  tools: [],
  connectors: {
    listAcceptanceTests: "",
    locateAcceptanceTest: "",
    runAcceptanceTest: "",
    runAcceptanceTests: "",
  },
})

describe("buildSummarizedContext()", () => {
  it("should build context with completion stats", () => {
    const spec = makeValidSpec()
    const featureRates = new Map([
      ["FE-0001", { passed: 2, total: 2 }],
      ["FE-0002", { passed: 1, total: 2 }],
    ])
    const result = renderStatus(spec, featureRates, [], [])
    expect(result).toContainInOrder([
      "# Test Project",
      "- Mission: Test mission",
      "- Vision: Test vision",
      "## Business Objectives",
      "- BO-0001: First objective",
      "- BO-0002: Second objective",
      "## Features",
      "✔ FE-0001: Feature 1 (2/2)",
      "✘ FE-0002: Feature 2 (1/2)",
    ])
  })

  it("should handle features without completion stats", () => {
    const spec = makeValidSpec()
    const result = renderStatus(spec, new Map(), [], [])

    expect(result).toContainInOrder(["✘ FE-0001: Feature 1 (?/?)", "✘ FE-0002: Feature 2 (?/?)"])
  })

  it("should handle empty spec", () => {
    const spec = makeEmptySpec()
    const result = renderStatus(spec, new Map(), [], [])
    expect(result).toContainInOrder(["# Empty", "- Mission: Empty mission", "- Vision: Empty vision", "## Business Objectives", "## Features"])
  })
})

describe("renderTools and renderOverallIssues branches", () => {
  it("renderStatus should show happy path when no issues and no failing features", () => {
    const spec = makeValidSpec()
    const featureRates = new Map([
      ["FE-0001", { passed: 1, total: 1 }],
      ["FE-0002", { passed: 1, total: 1 }],
    ])
    const result = renderStatus(spec, featureRates, [], [])
    expect(result).toContain("Project is in good state")
  })

  it("renderOverallIssues should show failing features message when no issues but failing features exist", () => {
    const spec = makeValidSpec()
    const featureRates = new Map([["FE-0002", { passed: 0, total: 1 }]])
    const result = renderStatus(spec, featureRates, [], [])
    expect(result).toContain("There are 1 failing features")
  })

  it("renderOverallIssues should render failing tools and mismatching/missing/dangling issues", () => {
    const spec = makeValidSpec()
    const issues = [{ _tag: "failing_tools" as const, failures: [{ id: "t1", stdout: "", stderr: "", exitCode: 1, recommendedNextActions: "fix" }] }]
    const text = renderStatus(spec, new Map(), issues, [])
    expect(text).toContain("There are errors reported by tools.")
  })

  it("renderOverallIssues should fall back to Unknown issues when none match", () => {
    const spec = makeValidSpec()
    const unknownIssues = [{ _tag: "unknown_tag" } as unknown as ValidationIssue]
    const text = renderStatus(spec, new Map(), unknownIssues, [])
    expect(text).toContain("Unknown issues:")
  })
})

describe("renderFeatureInfo()", () => {
  it("should render complete feature information with all sections", () => {
    const data: FeatureDetail = {
      feature: {
        id: "FE-0001",
        title: "Test Feature",
        description: "A test feature description",
        covers: ["BO-0001"],
        prerequisites: [],
      },
      businessObjectives: [{ id: "BO-0001", description: "Test objective" }],
      prerequisites: [],
      dependentFeatures: [{ id: "FE-0002", title: "Dependent Feature" }],
      acceptanceTests: [{ id: "AT-0001", given: "G", when: "W", then: "T" }],
    }

    const result = renderFeatureDetail(data)
    expect(result).toContainInOrder([
      "# FE-0001: Test Feature",
      "A test feature description",
      "## Business Objectives Covered by This Feature",
      "- BO-0001: Test objective",
      "## Features That Depend On This Feature",
      "- FE-0002: Dependent Feature",
      "## Acceptance Tests Covering This Feature",
      "- AT-0001: GIVEN G, WHEN W, THEN T",
    ])
  })

  it("should handle feature with no related data", () => {
    const data: FeatureDetail = {
      feature: {
        id: "FE-0001",
        title: "Test Feature",
        description: "A test feature description",
        covers: [],
        prerequisites: [],
      },
      businessObjectives: [],
      prerequisites: [],
      dependentFeatures: [],
      acceptanceTests: [],
    }

    const result = renderFeatureDetail(data)
    expect(result).toContainInOrder(["# FE-0001: Test Feature", "A test feature description"])
    expect(result).not.toContain("## Business Objectives Covered by This Feature")
    expect(result).not.toContain("## Prerequisites")
    expect(result).not.toContain("## Features That Depend On This Feature")
    expect(result).not.toContain("## Acceptance Tests Covering This Feature")
  })

  it("should handle feature with prerequisites", () => {
    const data: FeatureDetail = {
      feature: { id: "FE-0002", title: "Test Feature", description: "A test feature description", covers: ["BO-0001"], prerequisites: ["FE-0001"] },
      businessObjectives: [{ id: "BO-0001", description: "Test objective" }],
      prerequisites: [{ id: "FE-0001", title: "Prerequisite Feature" }],
      dependentFeatures: [],
      acceptanceTests: [],
    }

    const result = renderFeatureDetail(data)
    expect(result).toContainInOrder(["## Prerequisites", "- FE-0001: Prerequisite Feature"])
  })
})

describe("renderAcceptanceTestInfo()", () => {
  it("should render complete acceptance test information", () => {
    const data: AcceptanceTestDetail = {
      acceptanceTest: { id: "AT-0001", given: "G", when: "W", then: "T", covers: "FE-0001" },
      coveredFeature: { id: "FE-0001", title: "Test Feature", description: "Feature description" },
      relatedBusinessObjectives: [{ id: "BO-0001", description: "Test objective" }],
    }

    const result = renderAcceptanceTestDetail(data)
    expect(result).toContainInOrder([
      "# AT-0001",
      "GIVEN G, WHEN W, THEN T",
      "## Feature Covered by This Acceptance Test",
      "- FE-0001: Test Feature",
      "## Related Business Objectives",
      "- BO-0001: Test objective",
    ])
  })

  it("should handle acceptance test with no related business objectives", () => {
    const data: AcceptanceTestDetail = {
      acceptanceTest: { id: "AT-0001", given: "G", when: "W", then: "T", covers: "FE-0001" },
      coveredFeature: { id: "FE-0001", title: "Test Feature", description: "Feature description" },
      relatedBusinessObjectives: [],
    }

    const result = renderAcceptanceTestDetail(data)
    expect(result).toContainInOrder(["# AT-0001", "GIVEN G, WHEN W, THEN T", "## Feature Covered by This Acceptance Test", "- FE-0001: Test Feature"])
    expect(result).not.toContain("## Related Business Objectives")
  })
})

describe("renderMissingTestsAction()", () => {
  it.each([
    [[{ _tag: "missing_at" as const, id: "AT-0001", filePath: "src/at/AT-0001.test.ts" }], "- [AT-0001] src/at/AT-0001.test.ts"],
    [
      [
        { _tag: "missing_at" as const, id: "AT-0001", filePath: "src/at/AT-0001.test.ts" },
        { _tag: "missing_at" as const, id: "AT-0002", filePath: "src/at/AT-0002.test.ts" },
      ],
      "- [AT-0001] src/at/AT-0001.test.ts",
    ],
  ])("should render missing tests", (missingTests, expected) => {
    const result = renderMissingTests(missingTests)
    expect(result).toContain(expected)
  })

  it("should return default action for empty array", () => {
    const result = renderMissingTests([])
    expect(result).toContain("No missing acceptance tests.")
  })
})

describe("renderDanglingTestsAction()", () => {
  it("should render dangling tests", () => {
    const danglingTests = [
      { _tag: "dangling_at" as const, id: "AT-0001", filePath: "src/at/AT-0001.test.ts" },
      { _tag: "dangling_at" as const, id: "AT-0002", filePath: "src/at/AT-0002.test.ts" },
    ]

    const result = renderDanglingTests(danglingTests)
    expect(result).toContainInOrder(["- AT-0001: src/at/AT-0001.test.ts", "- AT-0002: src/at/AT-0002.test.ts"])
  })
})

describe("renderFailingTestsAction()", () => {
  it("should render failing tests action", () => {
    const testExecutionResult = [
      { id: "AT-0001", test: { id: "AT-0001", given: "G", when: "W", then: "T", covers: "FE-0001" }, passed: false, output: "A\nB" },
      { id: "AT-0002", test: { id: "AT-0002", given: "G", when: "W", then: "T", covers: "FE-0002" }, passed: true },
    ]

    const result = renderFailingTests(testExecutionResult)
    expect(result).toContain("AT-0001: GIVEN G, WHEN W, THEN T")
  })
})

describe("System errors", () => {
  it.each<{
    error: SystemError
    expected: string
  }>([
    { error: { _tag: "exec_error", command: "npm test", cause: new Error("Command failed") }, expected: "Failed to execute command: npm test" },
    {
      error: { _tag: "io_error", filePath: "/path/to/file.yaml", cause: new Error("File not found") },
      expected: "Failed to read spec file: /path/to/file.yaml",
    },
    { error: { _tag: "parse_error", message: "Invalid YAML format", cause: new Error("Parse failed") }, expected: "Invalid YAML format" },
  ])("should render %s", ({ error, expected }) => {
    expect(renderSystemError(error)).toBe(expected)
  })
})

describe("renderValidationIssuesActionNew()", () => {
  it("should render multiple validation issues using renderIssue", () => {
    const validationIssues: ValidationIssue[] = [
      { _tag: "uncovered_item", id: "BO-0001", itemType: "BO" },
      { _tag: "invalid_prereq", id: "FE-0001", referencedId: "FE-9999" },
      { _tag: "circular_dep", id: "FE-0002" },
      { _tag: "invalid_concept_ref", id: "FE-0003", conceptLabel: "X" },
    ]

    const result = renderValidationIssues(validationIssues)
    expect(result).toContain("There are 4 validation issues - the spec has internal inconsistencies.")
  })

  it("should handle empty validation issues array", () => {
    const result = renderValidationIssues([])
    expect(result).toContain("There are no validation issues - the spec is consistent.")
  })
})
