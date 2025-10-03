import type { Either } from "fp-ts/lib/Either.js"
import { left, right } from "fp-ts/lib/Either.js"
import type { AcceptanceTestDetail, FeatureDetail, S4, ValueError } from "../types.ts"

/**
 * Gets detailed information about a specific feature including its relationships
 * @param spec - The S4 spec containing features, business objectives, and acceptance tests
 * @param featureId - ID of the feature to get information for
 * @returns Either a value error or detailed feature information including related business objectives, prerequisites, dependents, and acceptance tests
 */
export function getFeatureDetail(spec: S4, featureId: string): Either<ValueError, FeatureDetail> {
  const feature = spec.features.find(f => f.id === featureId)
  if (feature === undefined) return left({ _tag: "value_error", value: featureId, message: `Feature "${featureId}" not found in spec` })

  const businessObjectives = spec.businessObjectives.filter(bo => feature.covers.includes(bo.id))
  const prerequisites = spec.features.filter(f => feature.prerequisites.includes(f.id))
  const dependentFeatures = spec.features.filter(f => f.prerequisites.includes(featureId))
  const acceptanceTests = spec.acceptanceTests.filter(at => at.covers === featureId)

  return right({ feature, businessObjectives, prerequisites, dependentFeatures, acceptanceTests })
}

/**
 * Gets detailed information about a specific acceptance test including its relationships
 * @param spec - The S4 spec containing acceptance tests, features, and business objectives
 * @param acceptanceTestId - ID of the acceptance test to get information for
 * @returns Either a value error or detailed acceptance test information including the covered feature and related business objectives
 */
export function getAcceptanceTestDetail(spec: S4, acceptanceTestId: string): Either<ValueError, AcceptanceTestDetail> {
  const acceptanceTest = spec.acceptanceTests.find(at => at.id === acceptanceTestId)
  if (acceptanceTest === undefined) {
    return left({ _tag: "value_error", value: acceptanceTestId, message: `Acceptance test "${acceptanceTestId}" not found in spec` })
  }

  const coveredFeature = spec.features.find(f => f.id === acceptanceTest.covers)
  if (coveredFeature === undefined) {
    return left({ _tag: "value_error", value: acceptanceTest.covers, message: `Feature "${acceptanceTest.covers}" not found in spec` })
  }

  const relatedBusinessObjectives = spec.businessObjectives.filter(bo => coveredFeature.covers.includes(bo.id))

  return right({ acceptanceTest, coveredFeature, relatedBusinessObjectives })
}
