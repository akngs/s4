import { ARCHETYPAL_SPEC, makeSpec as makeArchetypalSpec } from "../test-utils.ts"
import type { Either, S4 } from "../types.ts"
import { getAcceptanceTestDetail, getFeatureDetail } from "./details.ts"

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
const makeSpec = (overrides: Partial<S4>): S4 => makeArchetypalSpec({ ...VALID_SPEC, ...overrides })

const unwrapRight = <L, R>(e: Either<L, R>): R => {
  expect(e._tag).toBe("right")
  return (e as { _tag: "right"; R: R }).R
}
const unwrapLeft = <L, R>(e: Either<L, R>): L => {
  expect(e._tag).toBe("left")
  return (e as { _tag: "left"; L: L }).L
}

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
    const spec = makeSpec({ acceptanceTests: [{ id: "AT-0001", covers: "FE-9999", given: "G", when: "W", then: "T" }] })
    const err = unwrapLeft(getAcceptanceTestDetail(spec, "AT-0001"))
    expect(err._tag).toBe("value_error")
    expect(err.message).toContain("FE-9999")
  })
})
