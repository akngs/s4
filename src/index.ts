#!/usr/bin/env node

import { Command, Option } from "@commander-js/extra-typings"
import { isLeft } from "fp-ts/lib/Either.js"
import { errToCommandReturn, loadSpec } from "./commands/_base.ts"
import { runAllTools, runAt, runAts, runGuide, runInfo, runLocateAt, runStatus, runTool, runValidate } from "./commands/index.ts"
import type { CommandReturn, S4 } from "./types.ts"

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
  .action(async opts => {
    await withSpec(opts.spec, opts.format, runStatus)
  })

cli
  .command("validate")
  .alias("v")
  .description("Validate a spec from file")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async opts => {
    await withSpec(opts.spec, opts.format, runValidate)
  })

cli
  .command("locate-at")
  .description("Locate an acceptance test file by ID")
  .argument("<id>", "Acceptance test ID (e.g., AT-0001)")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (id: string, opts) => {
    await withSpec(opts.spec, opts.format, spec => runLocateAt(spec, id))
  })

cli
  .command("run-at")
  .description("Run an acceptance test by ID")
  .argument("<id>", "Acceptance test ID (e.g., AT-0001)")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (id: string, opts) => {
    await withSpec(opts.spec, opts.format, spec => runAt(spec, id))
  })

cli
  .command("run-ats")
  .description("Run all acceptance tests")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async opts => {
    await withSpec(opts.spec, opts.format, runAts)
  })

cli
  .command("info")
  .alias("i")
  .description("Display detailed information about a feature or acceptance test")
  .argument("<id>", "Feature ID (e.g., FE-0001) or Acceptance Test ID (e.g., AT-0001)")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (id: string, opts) => {
    await withSpec(opts.spec, opts.format, spec => runInfo(spec, id))
  })

cli
  .command("tool")
  .description("Run a tool defined in spec")
  .argument("<toolId>", "tool id as defined in spec.tools")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async (toolId: string, opts) => {
    await withSpec(opts.spec, opts.format, spec => runTool(spec, toolId))
  })

cli
  .command("tools")
  .description("Run all tools in defined order")
  .addOption(specOption)
  .addOption(formatOption)
  .action(async opts => {
    await withSpec(opts.spec, opts.format, runAllTools)
  })

cli
  .command("guide")
  .description("Display the spec authoring guide or a specific section with examples")
  .argument(
    "[section]",
    "Optional section to display (e.g., title, mission, vision, concepts, businessObjective, feature, acceptanceTest, connectors, tools)",
  )
  .action(async (section?: string) => {
    handleResult(await runGuide(section))
  })

async function withSpec(specPath: string, format: "json" | "yaml", commandFn: (spec: S4) => CommandReturn | Promise<CommandReturn>): Promise<void> {
  const specOrErr = await loadSpec(specPath, format)
  if (isLeft(specOrErr)) {
    handleResult(errToCommandReturn(specOrErr))
    return
  }
  const result = await commandFn(specOrErr.right)
  handleResult(result)
}

function handleResult(result: CommandReturn): void {
  if (result.stdout) console.log(result.stdout)
  if (result.stderr) console.error(result.stderr)
  process.exit(result.exitCode)
}

cli.parse()
