import { makeSpec } from "../test-utils.ts"
import {
  extractConceptReferences,
  findDuplicates,
  hasCircularDependency,
  validateBusinessObjectiveCoverage,
  validateConceptLabelUniqueness,
  validateConceptReferences,
  validateCoverage,
  validateFeatureCircularDependencies,
  validateFeatureCoverage,
  validateIdUniqueness,
  validateInternalConsistency,
  validateRefExistence,
  validateUnusedConcepts,
} from "./validation.ts"

describe("extractConceptReferences", () => {
  it.each([
    ["This is a [[concept]] and another [[concept2]]", ["concept", "concept2"]],
    ["This is a plain description without concepts", []],
    ["", []],
    ["This has [[concept]] and [[nested [brackets]]]", ["concept", "nested [brackets"]],
  ])("should extract concept references from '%s'", (description, expected) => {
    expect(extractConceptReferences(description)).toEqual(expected)
  })
})

describe("findDuplicates", () => {
  it.each([
    [
      ["a", "b", "a", "c", "b"],
      ["a", "b"],
    ],
    [["a", "b", "c"], []],
    [[], []],
    [["a"], []],
    [
      ["0", "1", "2", "1", "2"],
      ["1", "2"],
    ],
  ])("should find duplicates in %p", (data, expected) => {
    expect(findDuplicates(data)).toEqual(expected)
  })
})

describe("hasCircularDependency", () => {
  it.each([
    [
      new Map([
        ["A", ["B"]],
        ["B", ["C"]],
        ["C", ["A"]],
      ]),
      "A",
      true,
      "circular dependency",
    ],
    [
      new Map([
        ["A", ["B"]],
        ["B", ["C"]],
        ["C", []],
      ]),
      "A",
      false,
      "no circular dependency",
    ],
    [new Map([["A", ["A"]]]), "A", true, "self-reference"],
    [new Map([["A", []]]), "A", false, "empty prerequisites"],
    [new Map([["A", ["B"]]]), "B", false, "unknown feature"],
  ])("should detect %s", (featureMap, start, expected) => {
    expect(hasCircularDependency(start, featureMap)).toBe(expected)
  })
})

describe("validateFeatureCircularDependencies", () => {
  it("should return empty array when no circular dependencies exist", () => {
    const spec = makeSpec({
      features: [
        { id: "FE-0001", title: "F1", description: "", covers: ["BO-0001"], prerequisites: ["FE-0002"] },
        { id: "FE-0002", title: "F2", description: "", covers: ["BO-0001"], prerequisites: [] },
      ],
    })
    expect(validateFeatureCircularDependencies(spec)).toEqual([])
  })

  it("should detect features involved in circular dependencies", () => {
    const spec = makeSpec({
      features: [
        { id: "FE-0001", title: "F1", description: "", covers: ["BO-0001"], prerequisites: ["FE-0002"] },
        { id: "FE-0002", title: "F2", description: "", covers: ["BO-0001"], prerequisites: ["FE-0001"] },
      ],
    })
    expect(validateFeatureCircularDependencies(spec)).toEqual([
      { _tag: "circular_dep", id: "FE-0001" },
      { _tag: "circular_dep", id: "FE-0002" },
    ])
  })
})

describe("validateCoverage", () => {
  it.each([
    [
      [
        { id: "A", name: "Item A" },
        { id: "B", name: "Item B" },
        { id: "C", name: "Item C" },
      ],
      [{ covers: ["A"] }, { covers: ["B"] }],
      [{ _tag: "uncovered_item", id: "C", itemType: "FE" }],
      "uncovered items",
    ],
    [
      [
        { id: "BO-0001", name: "Business Objective 1" },
        { id: "BO-0002", name: "Business Objective 2" },
      ],
      [{ covers: ["BO-0001"] }],
      [{ _tag: "uncovered_item", id: "BO-0002", itemType: "BO" }],
      "business objectives",
    ],
    [
      [
        { id: "A", name: "Item A" },
        { id: "B", name: "Item B" },
      ],
      [{ covers: ["A", "B"] }],
      [],
      "all items covered",
    ],
  ])("should detect %s", (items, coveringItems, expected) => {
    expect(validateCoverage(items, coveringItems)).toEqual(expected)
  })
})

describe("validateReferenceExistence", () => {
  it.each([
    [
      [
        { id: "item1", refs: ["valid1", "invalid1"] },
        { id: "item2", refs: ["valid2", "invalid2"] },
      ],
      ["valid1", "valid2"],
      [
        { _tag: "invalid_prereq", id: "item1", referencedId: "invalid1" },
        { _tag: "invalid_prereq", id: "item2", referencedId: "invalid2" },
      ],
      "invalid references",
    ],
    [
      [
        { id: "item1", refs: ["valid1"] },
        { id: "item2", refs: ["valid2"] },
      ],
      ["valid1", "valid2"],
      [],
      "all references valid",
    ],
  ])("should detect %s", (items, validIds, expected) => {
    const getReferences = (item: (typeof items)[0]) => item.refs
    expect(validateRefExistence(items, getReferences, validIds, "invalid_prereq")).toEqual(expected)
  })
})

describe("validateBusinessObjectiveCoverage", () => {
  it("should detect uncovered business objectives", () => {
    const spec = makeSpec({
      businessObjectives: [
        { id: "BO-0001", description: "Covered" },
        { id: "BO-0002", description: "Uncovered" },
      ],
      features: [{ id: "FE-0001", title: "Feature", description: "Description", covers: ["BO-0001"], prerequisites: [] }],
    })
    expect(validateBusinessObjectiveCoverage(spec)).toEqual([{ _tag: "uncovered_item", id: "BO-0002", itemType: "BO" }])
  })
})

describe("validateFeatureCoverage", () => {
  it("should detect uncovered features", () => {
    const spec = makeSpec({
      features: [
        { id: "FE-0001", title: "Covered", description: "Description", covers: ["BO-0001"], prerequisites: [] },
        { id: "FE-0002", title: "Uncovered", description: "Description", covers: ["BO-0001"], prerequisites: [] },
      ],
      acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" }],
    })
    expect(validateFeatureCoverage(spec)).toEqual([{ _tag: "uncovered_item", id: "FE-0002", itemType: "FE" }])
  })
})

describe("validatePrerequisiteExistence", () => {
  it("should detect non-existent prerequisites", () => {
    const spec = makeSpec({
      features: [{ id: "FE-0001", title: "Feature", description: "Description", covers: ["BO-0001"], prerequisites: ["FE-9999"] }],
    })
    const result = validateRefExistence(
      spec.features,
      f => f.prerequisites,
      spec.features.map(f => f.id),
      "invalid_prereq",
    )
    expect(result).toEqual([{ _tag: "invalid_prereq", id: "FE-0001", referencedId: "FE-9999" }])
  })
})

describe("validateIdUniqueness", () => {
  it("should detect duplicate IDs", () => {
    const spec = makeSpec({
      businessObjectives: [
        { id: "BO-0001", description: "First" },
        { id: "BO-0001", description: "Second" },
      ],
    })
    expect(validateIdUniqueness(spec)).toEqual([{ _tag: "duplicate_id", id: "BO-0001" }])
  })
})

describe("validateConceptLabelUniqueness", () => {
  it("should detect duplicate concept labels", () => {
    const spec = makeSpec({
      concepts: [
        { id: "DUPLICATE", description: "First concept" },
        { id: "DUPLICATE", description: "Second concept" },
      ],
    })
    expect(validateConceptLabelUniqueness(spec)).toEqual([{ _tag: "duplicate_concept", label: "DUPLICATE" }])
  })
})

describe("validateConceptReferences", () => {
  it("should detect invalid concept references", () => {
    const spec = makeSpec({
      concepts: [{ id: "valid-concept", description: "Valid concept" }],
      features: [
        { id: "FE-0001", title: "Feature", description: "Uses [[valid-concept]] and [[invalid-concept]]", covers: ["BO-0001"], prerequisites: [] },
      ],
    })
    expect(validateConceptReferences(spec)).toEqual([{ _tag: "invalid_concept_ref", id: "FE-0001", conceptLabel: "invalid-concept" }])
  })
})

describe("validateUnusedConcepts", () => {
  it("should detect unused concepts", () => {
    const spec = makeSpec({
      concepts: [
        { id: "used-concept", description: "Used concept" },
        { id: "unused-concept", description: "Unused concept" },
      ],
      features: [{ id: "FE-0001", title: "Feature", description: "Uses [[used-concept]]", covers: ["BO-0001"], prerequisites: [] }],
    })
    expect(validateUnusedConcepts(spec)).toEqual([{ _tag: "unused_concept", label: "unused-concept" }])
  })
})

describe("validateInternalConsistency", () => {
  it("should pass when all validations pass", () => {
    expect(validateInternalConsistency(makeSpec())).toEqual([])
  })

  it("should collect all validation issues", () => {
    const invalidSpec = makeSpec({
      businessObjectives: [
        { id: "BO-0001", description: "Covered" },
        { id: "BO-0002", description: "Uncovered" },
      ],
      features: [{ id: "FE-0001", title: "Feature", description: "Description", covers: ["BO-0001"], prerequisites: ["FE-9999"] }],
    })
    const result = validateInternalConsistency(invalidSpec)
    expect(result).toContainEqual({ _tag: "uncovered_item", id: "BO-0002", itemType: "BO" })
    expect(result).toContainEqual({ _tag: "invalid_prereq", id: "FE-0001", referencedId: "FE-9999" })
  })
})
