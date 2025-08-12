import { z } from "zod/v4"

const ConceptSchema = z.object({
  id: z.string(),
  description: z.string(),
})

type BusinessObjective = z.infer<typeof BusinessObjectiveSchema>
const BusinessObjectiveSchema = z.object({
  id: z.string().regex(/^BO-\d{4}$/),
  description: z.string(),
})

type Feature = z.infer<typeof FeatureSchema>
const FeatureSchema = z.object({
  id: z.string().regex(/^FE-\d{4}$/),
  title: z.string(),
  description: z.string(),
  covers: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
})

export type AcceptanceTest = z.infer<typeof AcceptanceTestSchema>
const AcceptanceTestSchema = z.object({
  id: z.string().regex(/^AT-\d{4}$/),
  covers: z.string().regex(/^FE-\d{4}$/),
  given: z.string(),
  when: z.string(),
  then: z.string(),
})

export type Tool = z.infer<typeof ToolSchema>
const ToolSchema = z.object({
  id: z.string(),
  command: z.string(),
  stopOnError: z.boolean().default(true),
  recommendedNextActions: z.string().default("Fix the issue and run the tool again"),
})

const ConnectorsSchema = z.object({
  listAcceptanceTests: z.string(),
  locateAcceptanceTest: z.string(),
  runAcceptanceTest: z.string(),
  runAcceptanceTests: z.string(),
})

export type S4 = z.infer<typeof S4Schema>
export const S4Schema = z.object({
  title: z.string(),
  mission: z.string(),
  vision: z.string(),
  concepts: z.array(ConceptSchema).default([]),
  businessObjectives: z.array(BusinessObjectiveSchema).default([]),
  features: z.array(FeatureSchema).default([]),
  acceptanceTests: z.array(AcceptanceTestSchema).default([]),
  connectors: ConnectorsSchema.default({
    listAcceptanceTests: "echo",
    locateAcceptanceTest: "echo",
    runAcceptanceTest: "echo",
    runAcceptanceTests: "echo",
  }),
  tools: ToolSchema.array().default([]),
})

export type Guideline = z.infer<typeof GuidelineSchema>

const GuidelineSectionsSchema = z.object({
  title: z.string(),
  mission: z.string(),
  vision: z.string(),
  businessObjective: z.string(),
  feature: z.string(),
  acceptanceTest: z.string(),
  connectors: z.string(),
  tools: z.string(),
})

const GuidelineExampleSchema = z.object({
  title: z.string(),
  mission: z.string(),
  vision: z.string(),
  businessObjective: z.array(BusinessObjectiveSchema),
  feature: z.array(FeatureSchema),
  acceptanceTest: z.array(AcceptanceTestSchema),
  connectors: ConnectorsSchema,
  tools: ToolSchema.array(),
})

export const GuidelineSchema = z.object({
  brief: z.string(),
  sections: GuidelineSectionsSchema,
  examples: z.array(GuidelineExampleSchema),
})

export type CommandReturn = {
  stdout: string
  stderr: string
  exitCode: number
}

/** Result of running a single tool */
export type ToolRunResult = {
  id: string
  stdout: string
  stderr: string
  exitCode: number
  recommendedNextActions: string
}

/** Internal Consistency issues related to spec structure */
export type ValidationIssue =
  | { _tag: "missing_section"; section: "businessObjectives" }
  | { _tag: "uncovered_item"; id: string; itemType: "BO" | "FE" }
  | { _tag: "invalid_prereq"; id: string; referencedId: string }
  | { _tag: "invalid_bo"; id: string; referencedId: string }
  | { _tag: "invalid_fe"; id: string; referencedId: string }
  | { _tag: "circular_dep"; id: string }
  | { _tag: "invalid_concept_ref"; id: string; conceptLabel: string }
  | { _tag: "duplicate_id"; id: string }
  | { _tag: "duplicate_concept"; label: string }
  | { _tag: "unused_concept"; label: string }

/** Issues related to spec-code synchronization */
export type SyncIssue =
  | { _tag: "missing_at"; id: string; filePath: string }
  | { _tag: "dangling_at"; id: string; filePath: string }
  | { _tag: "mismatching_at"; id: string; expected: string; actual: string; filePath: string }

type ToolSetIssue = { _tag: "failing_tests"; testResults: TestResult[] } | { _tag: "failing_tools"; failures: ToolRunResult[] }

/**
 * Check if an issue is a validation issue
 * @param issue - The issue to check
 * @returns True if the issue is a validation issue, false otherwise
 */
export function isValidationIssue(issue: Issue): issue is ValidationIssue {
  return (
    issue._tag === "uncovered_item" ||
    issue._tag === "invalid_prereq" ||
    issue._tag === "invalid_bo" ||
    issue._tag === "invalid_fe" ||
    issue._tag === "circular_dep" ||
    issue._tag === "invalid_concept_ref" ||
    issue._tag === "duplicate_id" ||
    issue._tag === "duplicate_concept" ||
    issue._tag === "unused_concept" ||
    issue._tag === "missing_section"
  )
}

/**
 * Check if an issue is a sync issue
 * @param issue - The issue to check
 * @returns True if the issue is a sync issue, false otherwise
 */
export function isSyncIssue(issue: Issue): issue is SyncIssue {
  return issue._tag === "missing_at" || issue._tag === "dangling_at" || issue._tag === "mismatching_at"
}

/**
 * Check if an issue is a tool set issue
 * @param issue - The issue to check
 * @returns True if the issue is a tool set issue, false otherwise
 */
export function isToolSetIssue(issue: Issue): issue is ToolSetIssue {
  return issue._tag === "failing_tests" || issue._tag === "failing_tools"
}

// Unified issue type
export type Issue = ValidationIssue | SyncIssue | ToolSetIssue

export type ValueError = { _tag: "value_error"; value: unknown; message: string }

export type AdapterError = { _tag: "adapter_error"; adapter: string; cause: unknown }

/** System errors related to I/O, parsing, and tool execution */
export type SystemError =
  | { _tag: "exec_error"; command: string; cause: unknown }
  | { _tag: "io_error"; filePath: string; cause: unknown }
  | { _tag: "parse_error"; message: string; cause: unknown }
  | AdapterError

/** Test result type */
export type TestResult = { id: string; test: AcceptanceTest; passed: true } | { id: string; test: AcceptanceTest; passed: false; output?: string }

/** Feature completion stats for the next action result */
export type FeatureStats = Map<string, { passed: number; total: number }>

/** Detailed information about a feature */
export type FeatureDetail = {
  feature: Feature
  businessObjectives: BusinessObjective[]
  prerequisites: Pick<Feature, "id" | "title">[]
  dependentFeatures: Pick<Feature, "id" | "title">[]
  acceptanceTests: Pick<AcceptanceTest, "id" | "given" | "when" | "then">[]
}

/** Detailed information about an acceptance test */
export type AcceptanceTestDetail = {
  acceptanceTest: AcceptanceTest
  coveredFeature: Pick<Feature, "id" | "title" | "description">
  relatedBusinessObjectives: BusinessObjective[]
}

/** Result type for status command */
export type StatusReport = { issues: Issue[]; featureStats: FeatureStats; toolResults: ToolRunResult[] }

export type Either<LEFT, RIGHT> = { _tag: "left"; L: LEFT } | { _tag: "right"; R: RIGHT }

export type Left<LEFT> = { _tag: "left"; L: LEFT }

/**
 * Create a Left (issue/error) value
 * @param value - The left value to wrap
 * @returns An Either with the left value
 */
export function left<LEFT, RIGHT>(value: LEFT): Either<LEFT, RIGHT> {
  return { _tag: "left", L: value }
}

/**
 * Create a Right (success) value
 * @param value - The right value to wrap
 * @returns An Either with the right value
 */
export function right<LEFT, RIGHT>(value: RIGHT): Either<LEFT, RIGHT> {
  return { _tag: "right", R: value }
}

/**
 * Check if an Either is Left (issue/error)
 * @param either - The Either value to check
 * @returns True if the Either is Left, false otherwise
 */
export function isLeft<LEFT, RIGHT>(either: Either<LEFT, RIGHT>): either is { _tag: "left"; L: LEFT } {
  return either._tag === "left"
}

/**
 * Check if an Either is Right (success)
 * @param either - The Either value to check
 * @returns True if the Either is Right, false otherwise
 */
export function isRight<LEFT, RIGHT>(either: Either<LEFT, RIGHT>): either is { _tag: "right"; R: RIGHT } {
  return either._tag === "right"
}

/**
 * Map over the Right value, leaving Left unchanged
 * @param either - The Either value to map over
 * @param fn - The function to apply to the right value
 * @returns A new Either with the mapped right value or the original left value
 */
export function map<LEFT, RIGHT, RIGHT2>(either: Either<LEFT, RIGHT>, fn: (value: RIGHT) => RIGHT2): Either<LEFT, RIGHT2> {
  return isRight(either) ? right(fn(either.R)) : either
}

/**
 * Map over the Left value (issue/error), leaving Right unchanged
 * @param either - The Either value to map over
 * @param fn - The function to apply to the left value
 * @returns A new Either with the mapped left value or the original right value
 */
export function mapLeft<LEFT, RIGHT, LEFT2>(either: Either<LEFT, RIGHT>, fn: (issue: LEFT) => LEFT2): Either<LEFT2, RIGHT> {
  return isLeft(either) ? left(fn(either.L)) : either
}

/**
 * Assert that a value is never (exhaustiveness check)
 * @param _ - The value that should never be reached
 * @returns Never (throws an error)
 */
export function assertNever(_: never): never {
  throw new Error(`Unexpected value: ${_}`)
}
