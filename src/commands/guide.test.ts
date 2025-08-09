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
    expect(result.stderr).toBe("")
    expect(result.stdout).toBe(brief)
  })

  it("should return an io_error when the guideline file cannot be read", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("node:fs/promises", () => ({
      readFile: () => Promise.reject(new Error("boom")),
    }))

    const mod = await vi.importActual<typeof import("./guide.ts")>(modulePath)
    const result = await mod.default()
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe("io_error: Failed to read guideline.yaml: boom")

    vi.restoreAllMocks()
    vi.unmock("node:fs/promises")
  })

  it("should format non-Error thrown value in catch branch", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("yaml", () => ({
      parse: () => {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw "boom"
      },
    }))

    const mod = await vi.importActual<typeof import("./guide.ts")>(modulePath)
    const result = await mod.default()
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe("io_error: Failed to read guideline.yaml: boom")

    // cleanup mocks
    vi.restoreAllMocks()
    vi.unmock("yaml")
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

    const mod = await vi.importActual<typeof import("./guide.ts")>(modulePath)
    const result = await mod.default()
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^parse_error: /)

    vi.restoreAllMocks()
    vi.unmock("node:fs/promises")
    vi.unmock("yaml")
  })

  it("should return section content with examples when a valid section is provided", async () => {
    const result = await runGuide("feature")
    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe("")
    expect(result.stdout).toContain("Specify buildable units of capability identified as FE-####")
    expect(result.stdout).toContain("## Examples")
  })

  it("should return value_error when an unknown section is provided", async () => {
    const result = await runGuide("unknown-section")
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^value_error: Unknown section:/)
  })

  it("should include Error.message when io_error cause is an Error instance", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("../logics/index.ts", () => ({
      getGuidelineView: () =>
        Promise.resolve({
          _tag: "left",
          L: { _tag: "io_error", filePath: "guideline.yaml", cause: new Error("kaboom") },
        }),
    }))

    const mod = await vi.importActual<typeof import("./guide.ts")>(modulePath)
    const result = await mod.default()
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe("io_error: Failed to read guideline.yaml: kaboom")

    vi.restoreAllMocks()
    vi.unmock("../logics/index.ts")
  })

  it("should format unexpected system errors via default renderer branch", async () => {
    const modulePath = "./guide.ts"
    vi.resetModules()
    vi.doMock("../logics/index.ts", () => ({
      getGuidelineView: () =>
        Promise.resolve({
          _tag: "left",
          L: { _tag: "exec_error", command: "x", cause: "oops" },
        }),
    }))

    const mod = await vi.importActual<typeof import("./guide.ts")>(modulePath)
    const result = await mod.default()
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toBe("exec_error: oops")

    vi.restoreAllMocks()
    vi.unmock("../logics/index.ts")
  })

  it("should handle non-string section inputs when reporting unknown section", async () => {
    // Pass a number to exercise the non-string branch of renderUnknownSection
    const UNKNOWN_SECTION_NUM = 123
    const result = await runGuide(UNKNOWN_SECTION_NUM as unknown as string)
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toBe("")
    expect(result.stderr).toMatch(/^value_error: Unknown section: 123\./)
  })
})
