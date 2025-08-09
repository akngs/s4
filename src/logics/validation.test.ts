import { ARCHETYPAL_SPEC } from "../test-utils.ts"
import type { S4 } from "../types.ts"
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
  it("should extract concept references from description", () => {
    const description = "This is a [[concept]] and another [[concept2]]"
    expect(extractConceptReferences(description)).toEqual(["concept", "concept2"])
  })

  it("should return empty array when no concept references", () => {
    const description = "This is a plain description without concepts"
    expect(extractConceptReferences(description)).toEqual([])
  })

  it("should handle empty string", () => {
    expect(extractConceptReferences("")).toEqual([])
  })

  it("should handle nested brackets", () => {
    const description = "This has [[concept]] and [[nested [brackets]]]"
    expect(extractConceptReferences(description)).toEqual(["concept", "nested [brackets"])
  })
})

describe("findDuplicates", () => {
  it("should find duplicate items", () => {
    const data = ["a", "b", "a", "c", "b"]
    expect(findDuplicates(data)).toEqual(["a", "b"])
  })

  it("should return empty array when no duplicates", () => {
    const data = ["a", "b", "c"]
    expect(findDuplicates(data)).toEqual([])
  })

  it("should handle empty array", () => {
    expect(findDuplicates([])).toEqual([])
  })

  it("should handle single item", () => {
    expect(findDuplicates(["a"])).toEqual([])
  })

  it("should work with numbers", () => {
    const data = [0, 1, 2, 1, 2]
    expect(findDuplicates(data)).toEqual([1, 2])
  })
})

describe("hasCircularDependency", () => {
  it("should detect circular dependency", () => {
    const featureMap = new Map([
      ["A", ["B"]],
      ["B", ["C"]],
      ["C", ["A"]],
    ])
    expect(hasCircularDependency("A", featureMap)).toBe(true)
  })

  it("should not detect circular dependency when none exists", () => {
    const featureMap = new Map([
      ["A", ["B"]],
      ["B", ["C"]],
      ["C", []],
    ])
    expect(hasCircularDependency("A", featureMap)).toBe(false)
  })

  it("should handle self-reference", () => {
    const featureMap = new Map([["A", ["A"]]])
    expect(hasCircularDependency("A", featureMap)).toBe(true)
  })

  it("should handle empty prerequisites", () => {
    const featureMap = new Map([["A", []]])
    expect(hasCircularDependency("A", featureMap)).toBe(false)
  })

  it("should handle unknown feature", () => {
    const featureMap = new Map([["A", ["B"]]])
    expect(hasCircularDependency("B", featureMap)).toBe(false)
  })
})

describe("validateFeatureCircularDependencies", () => {
  it("should return empty array when no circular dependencies exist", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      features: [
        { id: "FE-0001", title: "F1", description: "", covers: ["BO-0001"], prerequisites: ["FE-0002"] },
        { id: "FE-0002", title: "F2", description: "", covers: ["BO-0001"], prerequisites: [] },
      ],
    }
    expect(validateFeatureCircularDependencies(spec)).toEqual([])
  })

  it("should detect features involved in circular dependencies", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      features: [
        { id: "FE-0001", title: "F1", description: "", covers: ["BO-0001"], prerequisites: ["FE-0002"] },
        { id: "FE-0002", title: "F2", description: "", covers: ["BO-0001"], prerequisites: ["FE-0001"] },
      ],
    }
    expect(validateFeatureCircularDependencies(spec)).toEqual([
      { _tag: "circular_dep", id: "FE-0001" },
      { _tag: "circular_dep", id: "FE-0002" },
    ])
  })
})

describe("validateCoverage", () => {
  it("should detect uncovered items", () => {
    const items = [
      { id: "A", name: "Item A" },
      { id: "B", name: "Item B" },
      { id: "C", name: "Item C" },
    ]
    const coveringItems = [{ covers: ["A"] }, { covers: ["B"] }]
    const result = validateCoverage(items, coveringItems)
    expect(result).toEqual([{ _tag: "uncovered_item", id: "C", itemType: "FE" }])
  })

  it("should detect business objectives correctly", () => {
    const items = [
      { id: "BO-0001", name: "Business Objective 1" },
      { id: "BO-0002", name: "Business Objective 2" },
    ]
    const coveringItems = [{ covers: ["BO-0001"] }]
    const result = validateCoverage(items, coveringItems)
    expect(result).toEqual([{ _tag: "uncovered_item", id: "BO-0002", itemType: "BO" }])
  })

  it("should return empty array when all items are covered", () => {
    const items = [
      { id: "A", name: "Item A" },
      { id: "B", name: "Item B" },
    ]
    const coveringItems = [{ covers: ["A", "B"] }]
    const result = validateCoverage(items, coveringItems)
    expect(result).toEqual([])
  })
})

describe("validateReferenceExistence", () => {
  it("should detect invalid references", () => {
    const items = [
      { id: "item1", refs: ["valid1", "invalid1"] },
      { id: "item2", refs: ["valid2", "invalid2"] },
    ]
    const validIds = ["valid1", "valid2"]
    const getReferences = (item: (typeof items)[0]) => item.refs

    const result = validateRefExistence(items, getReferences, validIds, "invalid_prereq")
    expect(result).toEqual([
      { _tag: "invalid_prereq", id: "item1", referencedId: "invalid1" },
      { _tag: "invalid_prereq", id: "item2", referencedId: "invalid2" },
    ])
  })

  it("should return empty array when all references are valid", () => {
    const items = [
      { id: "item1", refs: ["valid1"] },
      { id: "item2", refs: ["valid2"] },
    ]
    const validIds = ["valid1", "valid2"]
    const getReferences = (item: (typeof items)[0]) => item.refs

    const result = validateRefExistence(items, getReferences, validIds, "invalid_prereq")
    expect(result).toEqual([])
  })
})

describe("validateBusinessObjectiveCoverage", () => {
  it("should detect uncovered business objectives", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      businessObjectives: [
        { id: "BO-0001", description: "Covered" },
        { id: "BO-0002", description: "Uncovered" },
      ],
      features: [{ id: "FE-0001", title: "Feature", description: "Description", covers: ["BO-0001"], prerequisites: [] }],
    }
    const result = validateBusinessObjectiveCoverage(spec)
    expect(result).toEqual([{ _tag: "uncovered_item", id: "BO-0002", itemType: "BO" }])
  })
})

describe("validateFeatureCoverage", () => {
  it("should detect uncovered features", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      features: [
        { id: "FE-0001", title: "Covered", description: "Description", covers: ["BO-0001"], prerequisites: [] },
        { id: "FE-0002", title: "Uncovered", description: "Description", covers: ["BO-0001"], prerequisites: [] },
      ],
      acceptanceTests: [{ id: "AT-0001", covers: "FE-0001", given: "G", when: "W", then: "T" }],
    }
    const result = validateFeatureCoverage(spec)
    expect(result).toEqual([{ _tag: "uncovered_item", id: "FE-0002", itemType: "FE" }])
  })
})

describe("validatePrerequisiteExistence", () => {
  it("should detect non-existent prerequisites", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      features: [{ id: "FE-0001", title: "Feature", description: "Description", covers: ["BO-0001"], prerequisites: ["FE-9999"] }],
    }
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
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      businessObjectives: [
        { id: "DUPLICATE", description: "First" },
        { id: "DUPLICATE", description: "Second" },
      ],
    }
    const result = validateIdUniqueness(spec)
    expect(result).toEqual([{ _tag: "duplicate_id", id: "DUPLICATE" }])
  })
})

describe("validateConceptLabelUniqueness", () => {
  it("should detect duplicate concept labels", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      concepts: [
        { id: "DUPLICATE", description: "First concept" },
        { id: "DUPLICATE", description: "Second concept" },
      ],
    }
    const result = validateConceptLabelUniqueness(spec)
    expect(result).toEqual([{ _tag: "duplicate_concept", label: "DUPLICATE" }])
  })
})

describe("validateConceptReferences", () => {
  it("should detect invalid concept references", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      concepts: [{ id: "valid-concept", description: "Valid concept" }],
      features: [
        { id: "FE-0001", title: "Feature", description: "Uses [[valid-concept]] and [[invalid-concept]]", covers: ["BO-0001"], prerequisites: [] },
      ],
    }
    const result = validateConceptReferences(spec)
    expect(result).toEqual([{ _tag: "invalid_concept_ref", id: "FE-0001", conceptLabel: "invalid-concept" }])
  })
})

describe("validateUnusedConcepts", () => {
  it("should detect unused concepts", () => {
    const spec: S4 = {
      ...ARCHETYPAL_SPEC,
      concepts: [
        { id: "used-concept", description: "Used concept" },
        { id: "unused-concept", description: "Unused concept" },
      ],
      features: [{ id: "FE-0001", title: "Feature", description: "Uses [[used-concept]]", covers: ["BO-0001"], prerequisites: [] }],
    }
    const result = validateUnusedConcepts(spec)
    expect(result).toEqual([{ _tag: "unused_concept", label: "unused-concept" }])
  })
})

describe("validateInternalConsistency", () => {
  it("should pass when all validations pass", () => {
    expect(validateInternalConsistency(ARCHETYPAL_SPEC)).toEqual([])
  })

  it("should collect all validation issues", () => {
    const invalidSpec: S4 = {
      ...ARCHETYPAL_SPEC,
      businessObjectives: [
        { id: "BO-0001", description: "Covered" },
        { id: "BO-0002", description: "Uncovered" },
      ],
      features: [{ id: "FE-0001", title: "Feature", description: "Description", covers: ["BO-0001"], prerequisites: ["FE-9999"] }],
    }
    const result = validateInternalConsistency(invalidSpec)
    expect(result).toContainEqual({ _tag: "uncovered_item", id: "BO-0002", itemType: "BO" })
    expect(result).toContainEqual({ _tag: "invalid_prereq", id: "FE-0001", referencedId: "FE-9999" })
  })
})
