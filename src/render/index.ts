import path from "node:path"
import chalk from "chalk"
import { Eta } from "eta"
import type {
  AcceptanceTestDetail,
  FeatureDetail,
  FeatureStats,
  Issue,
  S4,
  SystemError,
  TestResult,
  ToolRunResult,
  ValidationIssue,
  ValueError,
} from "../types.ts"
import { isValidationIssue } from "../types.ts"

const eta = new Eta({ views: path.join(path.dirname(new URL(import.meta.url).pathname), "templates") })
eta.configure({
  rmWhitespace: false,
  autoEscape: false,
  useWith: true,
})

/**
 * Render the status of the project
 * @param spec - The S4 specification
 * @param featureStats - Feature completion statistics
 * @param issues - Array of project issues
 * @param tools - Tool execution results
 * @returns Rendered project status
 */
export function renderStatus(spec: S4, featureStats: FeatureStats, issues: Issue[], tools: ToolRunResult[]): string {
  const features = spec.features.map(f => ({ ...f, ...(featureStats.get(f.id) ?? {}) }))
  const summary = render("project-summary", { spec, features })
  const toolsSection = render("tools", { allTools: spec.tools, results: tools })
  const overallIssues = renderOverallIssues(issues, featureStats)
  const parts = [summary, toolsSection, `${chalk.blue.underline.bold("## Current Status")}\n\n${overallIssues}`]
  const rendered = parts.map(p => p.trim()).join("\n\n")
  return `${rendered}\n`
}

/**
 * Render tools section
 * @param spec - The S4 specification
 * @param results - Array of tool results
 * @returns Rendered tools section
 */
export function renderTools(spec: S4, results: ToolRunResult[]): string {
  return render("tools", { allTools: spec.tools, results })
}

/**
 * Render overall status check issues
 * @param issues - Array of project issues
 * @param featureStats - Feature completion statistics
 * @returns Rendered issues summary
 */
function renderOverallIssues(issues: Issue[], featureStats: FeatureStats): string {
  const failingFeatures = getFailingFeatures(featureStats)

  if (issues.length === 0 && failingFeatures.length === 0) {
    return `No structural issues found. Consider verifying semantic consistency in your specifications.

${chalk.blue.underline.bold("Recommended Next Actions:")}\n> s4 info FE-xxxx         # Check semantic consistency across BO-FE-AT for a specific feature
> s4 locate-at AT-nnnn    # Verify that implemented test cases correctly reflect the specification`
  }

  return issues.length === 0 ? renderFailingFeaturesMessage(failingFeatures) : renderIssues(issues)
}

/**
 * Get failing features from feature stats
 * @param featureStats - Feature completion statistics
 * @returns Array of failing feature entries
 */
function getFailingFeatures(featureStats: FeatureStats): Array<[string, { passed: number; total: number }]> {
  return Array.from(featureStats.entries()).filter(([, stats]) => stats.passed < stats.total)
}

/**
 * Render message for failing features
 * @param failingFeatures - Array of failing feature entries
 * @returns Rendered failing features message
 */
function renderFailingFeaturesMessage(failingFeatures: Array<[string, { passed: number; total: number }]>): string {
  const failingFeatureIds = failingFeatures.map(([id]) => id).join(", ")
  return `✘ There are ${failingFeatures.length} failing features: ${failingFeatureIds}\n\n${chalk.blue.underline.bold("Recommended Next Action:\n")}\n> s4 run-ats  # Run all acceptance tests to see which tests are failing`
}

/**
 * Render issues using available renderers
 * @param issues - Array of project issues
 * @returns Rendered issues summary
 */
function renderIssues(issues: Issue[]): string {
  for (const renderer of issueRenderers) {
    const rendered = renderer.render(issues)
    if (rendered !== undefined) return rendered
  }

  return `Unknown issues:\n\n${issues.map(i => i._tag).join("\n")}`
}

const issueRenderers: Array<{
  tag: string
  render: (issues: Issue[]) => string | undefined
}> = [
  {
    tag: "failing_tests",
    render: issues => {
      const failing = issues.find(e => e._tag === "failing_tests")
      return failing ? renderFailingTests(failing.testResults) : undefined
    },
  },
  {
    tag: "failing_tools",
    render: issues => {
      const failingTools = issues.find(e => e._tag === "failing_tools")
      return failingTools && "failures" in failingTools ? render("failing-tools", { failures: failingTools.failures }) : undefined
    },
  },
  {
    tag: "validation",
    render: issues => {
      const validation = issues.filter(isValidationIssue)
      return validation.length > 0 ? renderValidationIssues(validation) : undefined
    },
  },
  {
    tag: "missing_at",
    render: issues => {
      const missing = issues.filter(e => e._tag === "missing_at")
      return missing.length > 0 ? renderMissingTests(missing) : undefined
    },
  },
  {
    tag: "dangling_at",
    render: issues => {
      const dangling = issues.filter(e => e._tag === "dangling_at")
      return dangling.length > 0 ? renderDanglingTests(dangling) : undefined
    },
  },
  {
    tag: "mismatching_at",
    render: issues => {
      const mismatching = issues.filter(e => e._tag === "mismatching_at")
      return mismatching.length > 0 ? renderMismatchingTests(mismatching) : undefined
    },
  },
]

/**
 * Render failing tests action details
 * @param testResults - Array of test results
 * @returns Rendered failing tests information
 */
export function renderFailingTests(testResults: TestResult[]): string {
  const maxToShow = 3
  const failingTests = testResults.filter(test => !test.passed)
  return render("failing-ats", { tests: failingTests.slice(0, maxToShow), count: failingTests.length })
}

/**
 * Render validation issues action details with new issue rendering
 * @param validationIssues - Array of validation issues
 * @returns Rendered validation issues information
 */
export function renderValidationIssues(validationIssues: ValidationIssue[]): string {
  return render("validation-issues", { issues: validationIssues, count: validationIssues.length })
}

/**
 * Render missing tests action details
 * @param missingTests - Array of missing test issues
 * @returns Rendered missing tests information
 */
export function renderMissingTests(missingTests: Array<{ _tag: "missing_at"; id: string; filePath: string }>): string {
  return render("missing-ats", { test: missingTests[0], count: missingTests.length })
}

/**
 * Render dangling tests action details
 * @param danglingTests - Array of dangling test issues
 * @returns Rendered dangling tests information
 */
export function renderDanglingTests(danglingTests: Array<{ _tag: "dangling_at"; id: string; filePath: string }>): string {
  return render("dangling-ats", { tests: danglingTests, count: danglingTests.length })
}

/**
 * Render title mismatch action details
 * @param mismatchingTests - Array of mismatching test issues
 * @returns Rendered mismatching tests information
 */
function renderMismatchingTests(
  mismatchingTests: {
    _tag: "mismatching_at"
    id: string
    filePath: string
    expected: string
    actual: string
  }[],
): string {
  return render("mismatching-ats", { tests: mismatchingTests, count: mismatchingTests.length })
}

/**
 * Render detailed feature information
 * @param data - Feature detail data
 * @returns Rendered feature detail information
 */
export function renderFeatureDetail(data: FeatureDetail): string {
  return render("feature-detail", data)
}

/**
 * Render detailed acceptance test information
 * @param data - Acceptance test detail data
 * @returns Rendered acceptance test detail information
 */
export function renderAcceptanceTestDetail(data: AcceptanceTestDetail): string {
  return render("acceptance-test-detail", data)
}

/**
 * Render error messages from value errors
 * @param error - Value error to render
 * @returns Rendered value error message
 */
export function renderValueError(error: ValueError): string {
  return `Invalid value: ${error.value} - ${error.message}`
}

/**
 * Render error messages from system errors
 * @param error - System error to render
 * @returns Rendered system error message
 */
export function renderSystemError(error: SystemError): string {
  const isDefaultSpec = error._tag === "io_error" && path.basename(error.filePath) === "s4.yaml"
  const causeText = "cause" in error ? String(error.cause) : ""
  return render("system-error", { error, isDefaultSpec, causeText })
}

/**
 * Render a template with the given data
 * @param templateId - ID of the template to render
 * @param data - Data to pass to the template
 * @returns Rendered template string
 */
function render(templateId: string, data: Record<string, unknown>): string {
  return eta.render(templateId, { ...data, chalk }) + chalk.reset("")
}

/**
 * Render guideline view (brief or a section with examples)
 * @param view - The guideline view model returned from core logic
 * @returns Rendered guideline text
 */
export function renderGuide(
  view:
    | { _tag: "brief"; brief: string }
    | { _tag: "section"; sectionText: string; examples: { _tag: "scalar" | "block"; text: string }[] }
    | { _tag: "unknown_section"; allowed: string[] },
): string {
  try {
    return view._tag === "brief" ? view.brief : render("guide", { view })
  } catch {
    if (view._tag === "brief") return view.brief
    if (view._tag === "unknown_section") return `Unknown section. Allowed: ${view.allowed.join(", ")}`
    const examples = view.examples
      .map(ex => {
        if (ex._tag === "scalar") return `- ${ex.text}`
        const indented = ex.text
          .split("\n")
          .map(line => `  ${line}`)
          .join("\n")
        return `- |\n${indented}`
      })
      .join("\n")
    return `${view.sectionText}\n\nExamples:\n\n${examples}`
  }
}
