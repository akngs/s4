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

const VALID_SPEC = makeSpec({
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
})

it("should build context with completion stats", () => {
  const featureRates = new Map([
    ["FE-0001", { passed: 2, total: 2 }],
    ["FE-0002", { passed: 1, total: 2 }],
  ])
  const result = renderStatus(VALID_SPEC, featureRates, [], [])
  expect(result).toContainInOrder(["✔ FE-0001: Feature 1 (2/2)", "✘ FE-0002: Feature 2 (1/2)"])
})

it("should handle features without completion stats", () => {
  const result = renderStatus(VALID_SPEC, new Map(), [], [])
  expect(result).toContainInOrder(["✘ FE-0001: Feature 1 (?/?)", "✘ FE-0002: Feature 2 (?/?)"])
})

it("should handle empty spec", () => {
  const EMPTY_SPEC: S4 = {
    title: "Empty",
    mission: "Empty mission",
    vision: "Empty vision",
    concepts: [],
    businessObjectives: [],
    features: [],
    acceptanceTests: [],
    tools: [],
    connectors: { listAcceptanceTests: "", locateAcceptanceTest: "", runAcceptanceTest: "", runAcceptanceTests: "" },
  }
  const result = renderStatus(EMPTY_SPEC, new Map(), [], [])
  expect(result).toContainInOrder(["# Empty", "## Business Objectives", "## Features"])
})

it("should show happy path when no issues and no failing features", () => {
  const featureRates = new Map([
    ["FE-0001", { passed: 1, total: 1 }],
    ["FE-0002", { passed: 1, total: 1 }],
  ])
  expect(renderStatus(VALID_SPEC, featureRates, [], [])).toContain("No structural issues found")
})

it("should show failing features message when no issues but failing features exist", () => {
  const featureRates = new Map([["FE-0002", { passed: 0, total: 1 }]])
  expect(renderStatus(VALID_SPEC, featureRates, [], [])).toContain("There are 1 failing features")
})

it("should render failing tools and mismatching/missing/dangling issues", () => {
  const issues = [{ _tag: "failing_tools" as const, failures: [{ id: "t1", stdout: "", stderr: "", exitCode: 1, recommendedNextActions: "fix" }] }]
  expect(renderStatus(VALID_SPEC, new Map(), issues, [])).toContain("There are errors reported by tools.")
})

it("should fall back to Unknown issues when none match", () => {
  const unknownIssues = [{ _tag: "unknown_tag" } as unknown as ValidationIssue]
  expect(renderStatus(VALID_SPEC, new Map(), unknownIssues, [])).toContain("Unknown issues:")
})

it("should render complete feature information with all sections", () => {
  const data: FeatureDetail = {
    feature: { id: "FE-0001", title: "F1", description: "D", covers: ["BO-0001"], prerequisites: [] },
    businessObjectives: [{ id: "BO-0001", description: "O" }],
    prerequisites: [],
    dependentFeatures: [{ id: "FE-0002", title: "F2" }],
    acceptanceTests: [{ id: "AT-0001", given: "G", when: "W", then: "T" }],
  }
  const result = renderFeatureDetail(data)
  expect(result).toContainInOrder([
    "# FE-0001: F1",
    "## Business Objectives Covered by This Feature",
    "## Features That Depend On This Feature",
    "## Acceptance Tests Covering This Feature",
  ])
})

it("should handle feature with prerequisites", () => {
  const data: FeatureDetail = {
    feature: { id: "FE-0002", title: "Test Feature", description: "A test feature description", covers: ["BO-0001"], prerequisites: ["FE-0001"] },
    businessObjectives: [{ id: "BO-0001", description: "Test objective" }],
    prerequisites: [{ id: "FE-0001", title: "Prerequisite Feature" }],
    dependentFeatures: [],
    acceptanceTests: [],
  }
  expect(renderFeatureDetail(data)).toContain("## Prerequisites")
})

it("should render complete acceptance test information", () => {
  const data: AcceptanceTestDetail = {
    acceptanceTest: { id: "AT-0001", given: "G", when: "W", then: "T", covers: "FE-0001" },
    coveredFeature: { id: "FE-0001", title: "Test Feature", description: "Feature description" },
    relatedBusinessObjectives: [{ id: "BO-0001", description: "Test objective" }],
  }
  const result = renderAcceptanceTestDetail(data)
  expect(result).toContainInOrder(["# AT-0001", "## Feature Covered by This Acceptance Test", "## Related Business Objectives"])
})

it("should handle acceptance test with no related business objectives", () => {
  const data: AcceptanceTestDetail = {
    acceptanceTest: { id: "AT-0001", given: "G", when: "W", then: "T", covers: "FE-0001" },
    coveredFeature: { id: "FE-0001", title: "Test Feature", description: "Feature description" },
    relatedBusinessObjectives: [],
  }
  const result = renderAcceptanceTestDetail(data)
  expect(result).toContain("# AT-0001")
  expect(result).not.toContain("## Related Business Objectives")
})

it.each([
  [[{ _tag: "missing_at" as const, id: "AT-0001", filePath: "src/at/AT-0001.test.ts" }], "AT-0001"],
  [
    [
      { _tag: "missing_at" as const, id: "AT-0001", filePath: "src/at/AT-0001.test.ts" },
      { _tag: "missing_at" as const, id: "AT-0002", filePath: "src/at/AT-0002.test.ts" },
    ],
    "AT-0001",
  ],
])("should render missing tests", (missingTests, expected) => {
  expect(renderMissingTests(missingTests)).toContain(expected)
})

it("should return default action for empty array", () => {
  expect(renderMissingTests([])).toContain("No missing acceptance tests.")
})

it("should render dangling tests", () => {
  const danglingTests = [
    { _tag: "dangling_at" as const, id: "AT-0001", filePath: "src/at/AT-0001.test.ts" },
    { _tag: "dangling_at" as const, id: "AT-0002", filePath: "src/at/AT-0002.test.ts" },
  ]
  const result = renderDanglingTests(danglingTests)
  expect(result).toContainInOrder(["AT-0001", "AT-0002"])
})

it("should render failing tests action", () => {
  const testExecutionResult = [
    { id: "AT-0001", test: { id: "AT-0001", given: "G", when: "W", then: "T", covers: "FE-0001" }, passed: false, output: "A\nB" },
    { id: "AT-0002", test: { id: "AT-0002", given: "G", when: "W", then: "T", covers: "FE-0002" }, passed: true },
  ]
  expect(renderFailingTests(testExecutionResult)).toContain("AT-0001")
})

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

it("should render multiple validation issues", () => {
  const validationIssues: ValidationIssue[] = [
    { _tag: "uncovered_item", id: "BO-0001", itemType: "BO" },
    { _tag: "invalid_prereq", id: "FE-0001", referencedId: "FE-9999" },
    { _tag: "circular_dep", id: "FE-0002" },
    { _tag: "invalid_concept_ref", id: "FE-0003", conceptLabel: "X" },
  ]
  expect(renderValidationIssues(validationIssues)).toContain("There are 4 validation issues")
})

it("should handle empty validation issues array", () => {
  expect(renderValidationIssues([])).toContain("There are no validation issues")
})
