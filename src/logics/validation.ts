import type { S4, ValidationIssue } from "../types.ts"

/**
 * Validates the internal consistency of the spec
 * @param spec - The S4 spec to validate
 * @returns Array of internal consistency issues found
 */
export function validateInternalConsistency(spec: S4): ValidationIssue[] {
  const validators: Array<() => ValidationIssue[]> = [
    () => (spec.businessObjectives.length === 0 ? [{ _tag: "missing_section" as const, section: "businessObjectives" }] : []),
    () => validateBusinessObjectiveCoverage(spec),
    () => validateFeatureCoverage(spec),
    () =>
      validateRefExistence(
        spec.features,
        f => f.prerequisites,
        spec.features.map(f => f.id),
        "invalid_prereq",
      ),
    () =>
      validateRefExistence(
        spec.features,
        f => f.covers,
        spec.businessObjectives.map(bo => bo.id),
        "invalid_bo",
      ),
    () =>
      validateRefExistence(
        spec.acceptanceTests,
        at => [at.covers],
        spec.features.map(f => f.id),
        "invalid_fe",
      ),
    () => validateFeatureCircularDependencies(spec),
    () => validateConceptReferences(spec),
    () => validateIdUniqueness(spec),
    () => validateConceptLabelUniqueness(spec),
    () => validateUnusedConcepts(spec),
  ]

  return validators.flatMap(validator => validator())
}

/**
 * Validates that every business objective is covered by at least one feature
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for uncovered business objectives
 */
export function validateBusinessObjectiveCoverage(spec: S4): ValidationIssue[] {
  return validateCoverage(spec.businessObjectives, spec.features)
}

/**
 * Validates that every feature is covered by at least one acceptance test
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for uncovered features
 */
export function validateFeatureCoverage(spec: S4): ValidationIssue[] {
  return validateCoverage(
    spec.features,
    spec.acceptanceTests.map(at => ({ covers: [at.covers] })),
  )
}

/**
 * Validates that there are no circular dependencies between features
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for features with circular dependencies
 */
export function validateFeatureCircularDependencies(spec: S4): ValidationIssue[] {
  const featureMap = new Map(spec.features.map(f => [f.id, f.prerequisites]))

  return spec.features.filter(f => hasCircularDependency(f.id, featureMap)).map(f => ({ _tag: "circular_dep", id: f.id }))
}

/**
 * Validates that all concept references in item descriptions exist
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for invalid concept references
 */
export function validateConceptReferences(spec: S4): ValidationIssue[] {
  const conceptLabels = new Set(spec.concepts.map(c => c.id))
  const items = [...spec.concepts, ...spec.businessObjectives, ...spec.features, ...spec.acceptanceTests]

  return items.flatMap(item => {
    const refs = extractConceptReferences("description" in item ? item.description : `${item.given} ${item.when} ${item.then}`)
    return refs.filter(ref => !conceptLabels.has(ref)).map(ref => ({ _tag: "invalid_concept_ref" as const, id: item.id, conceptLabel: ref }))
  })
}

/**
 * Validates that all IDs across the spec are unique
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for duplicate IDs
 */
export function validateIdUniqueness(spec: S4): ValidationIssue[] {
  const ids = [...spec.businessObjectives, ...spec.features, ...spec.acceptanceTests].map(v => v.id)
  const duplicateIds = findDuplicates(ids)
  return duplicateIds.map(id => ({ _tag: "duplicate_id", id }))
}

/**
 * Validates that all concept labels are unique
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for duplicate concept labels
 */
export function validateConceptLabelUniqueness(spec: S4): ValidationIssue[] {
  const labels = spec.concepts.map(c => c.id)
  return findDuplicates(labels).map(label => ({ _tag: "duplicate_concept", label }))
}

/**
 * Validates that all concept labels are actually used in the spec
 * @param spec - The S4 spec to validate
 * @returns Array of validation issues for unused concepts
 */
export function validateUnusedConcepts(spec: S4): ValidationIssue[] {
  const conceptLabels = new Set(spec.concepts.map(c => c.id))
  const usedConcepts = new Set(
    [...spec.concepts, ...spec.businessObjectives, ...spec.features, ...spec.acceptanceTests].flatMap(item =>
      extractConceptReferences("description" in item ? item.description : `${item.given} ${item.when} ${item.then}`),
    ),
  )
  const unusedConcepts = [...conceptLabels].filter(label => !usedConcepts.has(label))

  return unusedConcepts.map(label => ({ _tag: "unused_concept" as const, label }))
}

/**
 * Finds duplicate items in an array
 * @param data - Array of items to check for duplicates
 * @returns Array of duplicate items found
 */
export function findDuplicates<T>(data: T[]): T[] {
  const seen = new Set<T>()
  const duplicates = new Set<T>()

  for (const item of data) {
    ;(seen.has(item) ? duplicates : seen).add(item)
  }

  return [...duplicates]
}

/**
 * Extracts concept references from a description string
 * @param description - Description text that may contain concept references in [[concept]] format
 * @returns Array of concept labels found in the description
 */
export function extractConceptReferences(description: string): string[] {
  const matches = description.match(/\[\[([^\]]+)\]\]/g)
  return matches ? matches.map(m => m.slice(2, -2)) : []
}

/**
 * Checks if a feature has circular dependencies using depth-first search
 * @param featureId - ID of the feature to check
 * @param featureMap - Map of feature IDs to their prerequisites
 * @param visited - Set of already visited features (used for optimization)
 * @param stack - Set of features in the current recursion stack (used to detect cycles)
 * @returns True if circular dependency is found, false otherwise
 */
export function hasCircularDependency(
  featureId: string,
  featureMap: Map<string, string[]>,
  visited: Set<string> = new Set(),
  stack: Set<string> = new Set(),
): boolean {
  if (stack.has(featureId)) return true
  if (visited.has(featureId)) return false

  visited.add(featureId)
  stack.add(featureId)

  const prerequisites = featureMap.get(featureId) ?? []
  const isCyclic = prerequisites.some(prereq => hasCircularDependency(prereq, featureMap, visited, stack))

  stack.delete(featureId)
  return isCyclic
}

/**
 * Validates that all items are covered by at least one covering item
 * @param items - Items that should be covered (business objectives or features)
 * @param coveringItems - Items that provide coverage (features or acceptance tests)
 * @returns Array of validation issues for uncovered items
 */
export function validateCoverage(items: { id: string }[], coveringItems: { covers: string[] }[]): ValidationIssue[] {
  const covered = new Set(coveringItems.flatMap(item => item.covers))
  const itemType = items[0]?.id.startsWith("BO-") ? "BO" : "FE"
  return items.filter(item => !covered.has(item.id)).map(item => ({ _tag: "uncovered_item" as const, id: item.id, itemType }))
}

/**
 * Validates that all references in items exist in the valid IDs list
 * @param items - Items to validate references for
 * @param getReferences - Function to extract references from an item
 * @param validIds - Array of valid reference IDs
 * @param issueTag - Tag to use for validation issues
 * @returns Array of validation issues for invalid references
 */
export function validateRefExistence<T extends { id: string }>(
  items: T[],
  getReferences: (item: T) => string[],
  validIds: string[],
  issueTag: "invalid_prereq" | "invalid_bo" | "invalid_fe",
): ValidationIssue[] {
  const validIdSet = new Set(validIds)
  return items.flatMap(item =>
    getReferences(item)
      .filter(ref => !validIdSet.has(ref))
      .map(ref => ({ _tag: issueTag, id: item.id, referencedId: ref })),
  )
}
