import { makeSpec } from "../test-utils.ts"
import { unwrapRight } from "../types.ts"
import { checkSyncIssues, getAcceptanceTestDependencyOrder, topologicalSortFeatures } from "./sync.ts"

// Test helpers
const makeFeature = (id: string, prerequisites: string[] = []) => ({ id, title: id, description: id, covers: ["BO-0001"], prerequisites })

describe("topologicalSortFeatures()", () => {
  const cases: Array<[string, { id: string; prerequisites: string[] }[], string[]]> = [
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
  ]

  it.each(cases)("should sort features in %s", (_, features, expected) => {
    expect(topologicalSortFeatures(features)).toEqual(expected)
  })

  it("should handle circular dependencies gracefully", () => {
    const features: { id: string; prerequisites: string[] }[] = [
      { id: "FE-0001", prerequisites: ["FE-0002"] },
      { id: "FE-0002", prerequisites: ["FE-0001"] },
    ]
    const result = topologicalSortFeatures(features)
    expect(result).toContain("FE-0001")
    expect(result).toContain("FE-0002")
  })
})
describe("getAcceptanceTestDependencyOrder()", () => {
  it("should calculate dependency order for acceptance tests", () => {
    const spec = makeSpec({
      features: [makeFeature("FE-0001", ["FE-0002"]), makeFeature("FE-0002")],
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
      { listAcceptanceTests: "echo 'AT-0001: WRONG'", locateAcceptanceTest: "echo 'src/at/AT-0001.test.ts'" },
      [{ _tag: "mismatching_at", id: "AT-0001", expected: "GIVEN G, WHEN W, THEN T", actual: "WRONG", filePath: "src/at/AT-0001.test.ts" }],
    ],
    ["matching titles", { listAcceptanceTests: "echo 'AT-0001: GIVEN G, WHEN W, THEN T'" }, []],
  ])("should detect %s", async (_, toolOverrides, expectedIssues) => {
    const spec = makeSpec({ connectors: { ...makeSpec().connectors, ...toolOverrides } })
    const issues = unwrapRight(await checkSyncIssues(spec))
    expect(issues).toEqual(expectedIssues)
  })
})
