#!/usr/bin/env node

import { Command, Option } from "@commander-js/extra-typings"
import runGuide from "./commands/guide.ts"
import runInfo from "./commands/info.ts"
import runLocateAt from "./commands/locate-at.ts"
import runAt from "./commands/run-at.ts"
import runAts from "./commands/run-ats.ts"
import runStatus from "./commands/status.ts"
import runTool from "./commands/tool.ts"
import runAllTools from "./commands/tools.ts"
import runValidate from "./commands/validate.ts"
import type { CommandReturn } from "./types.ts"

// Default to running "s4 status" if no arguments are provided
if (process.argv.length === 2) process.argv.push("status")

const cli = new Command()

cli.name("s4").description("S4 is a CLI tool supporting Agentic Coding based on Semi-Structured Software Specification.").version("1.0.0")

const specOption = new Option("--spec <file>", "Spec file path").default("s4.yaml")
const formatOption = new Option("-f, --format <format>", "Input format").default("yaml").choices(["json", "yaml"])

cli
  .command("status")
  .alias("s")
  .description("Get the status of the project and the next action to take")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async options => {
    handleResult(await runStatus(options))
  })

cli
  .command("validate")
  .alias("v")
  .description("Validate a spec from file")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async options => {
    handleResult(await runValidate(options))
  })

cli
  .command("locate-at")
  .description("Locate an acceptance test file by ID")
  .argument("<id>", "Acceptance test ID (e.g., AT-0001)")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (id: string, options) => {
    handleResult(await runLocateAt({ ...options, id }))
  })

cli
  .command("run-at")
  .description("Run an acceptance test by ID")
  .argument("<id>", "Acceptance test ID (e.g., AT-0001)")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (id: string, options) => {
    handleResult(await runAt({ ...options, id }))
  })

cli
  .command("run-ats")
  .description("Run all acceptance tests")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async options => {
    handleResult(await runAts(options))
  })

cli
  .command("info")
  .alias("i")
  .description("Display detailed information about a feature or acceptance test")
  .argument("<id>", "Feature ID (e.g., FE-0001) or Acceptance Test ID (e.g., AT-0001)")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (id: string, options) => {
    handleResult(await runInfo({ ...options, id }))
  })

cli
  .command("tool")
  .description("Run a tool defined in spec")
  .argument("<toolId>", "tool id as defined in spec.tools")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (toolId: string, options) => {
    handleResult(await runTool({ ...options, toolId }))
  })

cli
  .command("tools")
  .description("Run all tools in defined order")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async options => {
    handleResult(await runAllTools(options))
  })

cli
  .command("guide")
  .description("Display the spec authoring guide or a specific section with examples")
  .argument("[section]", "Optional section to display (e.g., title, mission, vision, businessObjective, feature, acceptanceTest, connectors, tools)")
  .action(async (section?: string) => {
    handleResult(await runGuide(section))
  })

/**
 * Handle command result by outputting to console and exiting with appropriate code
 * @param result - The command result to handle
 */
function handleResult(result: CommandReturn): void {
  if (result.stdout) console.log(result.stdout)
  if (result.stderr) console.error(result.stderr)
  process.exit(result.exitCode)
}

cli.parse()
