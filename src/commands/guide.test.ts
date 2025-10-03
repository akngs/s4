import { readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { vi } from "vitest"
import { parse as parseYaml } from "yaml"
import { GuidelineSchema } from "../types.ts"
import runGuide from "./guide.ts"

const GUIDELINE_PATH = join(dirname(fileURLToPath(import.meta.url)), "../logics/guideline.yaml")

describe("guide command", () => {
  it("should read and return the brief from guideline.yaml when file exists", async () => {
    const raw = await readFile(GUIDELINE_PATH, "utf-8")
    const obj = parseYaml(raw) as unknown
    const { brief } = GuidelineSchema.parse(obj)
    expect(brief.length).toBeGreaterThan(10)

    const result = await runGuide()
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe(brief)
  })

  it("should return an io_error when the guideline file cannot be read", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("node:fs/promises", () => ({
      readFile: () => Promise.reject(new Error("boom")),
    }))

    const mod = await vi.importActual(modulePath)
    const result = await (mod as { default: () => Promise<unknown> }).default()
    expect(result).toBeError("io_error")

    vi.restoreAllMocks()
    vi.unmock("node:fs/promises")
  })

  it("should return parse_error when guideline.yaml content is invalid", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("node:fs/promises", () => ({
      readFile: () => Promise.resolve("brief: Good brief\n"),
    }))
    vi.doMock("yaml", () => ({
      parse: () => ({ brief: "Good brief" }),
    }))

    const mod = await vi.importActual(modulePath)
    const result = await (mod as { default: () => Promise<unknown> }).default()
    expect(result).toBeError("parse_error")

    vi.restoreAllMocks()
    vi.unmock("node:fs/promises")
    vi.unmock("yaml")
  })

  it("should return section content with examples when a valid section is provided", async () => {
    const result = await runGuide("feature")
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContainInOrder(["Specify buildable units of capability identified as FE-####", "## Examples"])
  })

  it("should handle parse_error with message property", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("../logics/guide.ts", () => ({
      getGuidelineView: () =>
        Promise.resolve({
          _tag: "Left",
          left: { _tag: "parse_error", message: "Invalid YAML format", cause: "test" },
        }),
    }))

    const mod = await vi.importActual(modulePath)
    const result = await (mod as { default: () => Promise<unknown> }).default()
    expect(result).toBeError("parse_error")

    vi.restoreAllMocks()
    vi.unmock("../logics/guide.ts")
  })

  it("should handle unknown error types", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("../logics/guide.ts", () => ({
      getGuidelineView: () =>
        Promise.resolve({
          _tag: "Left",
          left: { _tag: "unknown_error", cause: "Something went wrong" },
        }),
    }))

    const mod = await vi.importActual(modulePath)
    const result = await (mod as { default: () => Promise<unknown> }).default()
    expect(result).toBeError("unknown_error")

    vi.restoreAllMocks()
    vi.unmock("../logics/guide.ts")
  })

  it("should handle unknown error types without cause", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("../logics/guide.ts", () => ({
      getGuidelineView: () =>
        Promise.resolve({
          _tag: "Left",
          left: { _tag: "unknown_error" },
        }),
    }))

    const mod = await vi.importActual(modulePath)
    const result = await (mod as { default: () => Promise<unknown> }).default()
    expect(result).toBeError("unknown_error")

    vi.restoreAllMocks()
    vi.unmock("../logics/guide.ts")
  })
})
