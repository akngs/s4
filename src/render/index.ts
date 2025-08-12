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
  Tool,
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
  const toolsSection = renderTools(spec.tools, tools)
  const overallIssues = renderOverallIssues(issues, featureStats)
  const parts = [summary, toolsSection, `${chalk.blue.underline.bold("## Current Status")}\n\n${overallIssues}`]
  const rendered = parts.map(p => p.trim()).join("\n\n")
  return `${rendered}\n`
}

/**
 * Render tools execution summary
 * @param allTools - All available tools
 * @param results - Tool execution results
 * @returns Rendered tools section
 */
export function renderTools(allTools: Tool[], results: ToolRunResult[]): string {
  return render("tools", { allTools, results })
}

/**
 * Render detailed information for failing tool runs
 * @param failures - Tool run results with non-zero exit codes
 * @returns Rendered failing tools details
 */
export function renderFailingTools(failures: ToolRunResult[]): string {
  return render("failing-tools", { failures })
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
    return "Project is in good state. You don't need to run any other checks since I've already checked everything. You may consult your human colleagues to find out what to do next."
  }

  if (issues.length === 0 && failingFeatures.length > 0) {
    return renderFailingFeaturesMessage(failingFeatures)
  }

  return renderIssues(issues)
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
  const attempts: Array<(issues: Issue[]) => string | undefined> = [
    tryRenderFailingTests,
    tryRenderFailingTools,
    tryRenderValidationIssues,
    tryRenderMissingTests,
    tryRenderDanglingTests,
    tryRenderMismatchingTests,
  ]

  for (const attempt of attempts) {
    const rendered = attempt(issues)
    if (rendered !== undefined) return rendered
  }

  return `Unknown issues:\n\n${issues.map(i => i._tag).join("\n")}`
}

/**
 * Try to render failing tests issues
 * @param issues - Array of project issues
 * @returns Rendered failing tests or undefined if no failing tests
 */
function tryRenderFailingTests(issues: Issue[]): string | undefined {
  const failing = issues.find(e => e._tag === "failing_tests")
  return failing ? renderFailingTests(failing.testResults) : undefined
}

/**
 * Try to render failing tools issues
 * @param issues - Array of project issues
 * @returns Rendered failing tools or undefined if no failing tools
 */
function tryRenderFailingTools(issues: Issue[]): string | undefined {
  const failingTools = issues.find(e => e._tag === "failing_tools")
  if (!failingTools || !("failures" in failingTools)) return undefined
  return render("failing-tools", { failures: failingTools.failures })
}

/**
 * Try to render validation issues
 * @param issues - Array of project issues
 * @returns Rendered validation issues or undefined if no validation issues
 */
function tryRenderValidationIssues(issues: Issue[]): string | undefined {
  const validation = issues.filter(isValidationIssue)
  return validation.length > 0 ? renderValidationIssues(validation) : undefined
}

/**
 * Try to render missing tests issues
 * @param issues - Array of project issues
 * @returns Rendered missing tests or undefined if no missing tests
 */
function tryRenderMissingTests(issues: Issue[]): string | undefined {
  const missing = issues.filter(e => e._tag === "missing_at")
  return missing.length > 0 ? renderMissingTests(missing) : undefined
}

/**
 * Try to render dangling tests issues
 * @param issues - Array of project issues
 * @returns Rendered dangling tests or undefined if no dangling tests
 */
function tryRenderDanglingTests(issues: Issue[]): string | undefined {
  const dangling = issues.filter(e => e._tag === "dangling_at")
  return dangling.length > 0 ? renderDanglingTests(dangling) : undefined
}

/**
 * Try to render mismatching tests issues
 * @param issues - Array of project issues
 * @returns Rendered mismatching tests or undefined if no mismatching tests
 */
function tryRenderMismatchingTests(issues: Issue[]): string | undefined {
  const mismatching = issues.filter(e => e._tag === "mismatching_at")
  return mismatching.length > 0 ? renderMismatchingTests(mismatching) : undefined
}

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
    | { kind: "brief"; brief: string }
    | { kind: "section"; sectionText: string; examples: { kind: "scalar" | "block"; text: string }[] }
    | { kind: "unknown_section"; allowed: string[] },
): string {
  try {
    // Preserve exact brief text for tests and spec fidelity
    if (view.kind === "brief") return view.brief
    return render("guide", { view })
  } catch {
    // Fallback plain rendering when the templating pipeline fails (e.g., JSON.stringify is mocked to throw in tests)
    if (view.kind === "brief") return view.brief
    if (view.kind === "unknown_section") return `Unknown section. Allowed: ${view.allowed.join(", ")}`
    const examples = view.examples
      .map(ex => {
        if (ex.kind === "scalar") return `- ${ex.text}`
        // Render block scalars with a YAML block indicator
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
