import { ARCHETYPAL_SPEC, makeSpec, withTempSpecFile } from "../test-utils.ts"
import tools from "./tools.ts"

it("should run all tools and render tools section when all succeed", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    tools: [
      { id: "t1", command: "echo 'one'", stopOnError: false, recommendedNextActions: "" },
      { id: "t2", command: "echo 'two'", stopOnError: false, recommendedNextActions: "" },
    ],
  })
  await withTempSpecFile(spec, async temp => {
    const result = await tools({ spec: temp, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("## Tools")
    expect(result.stdout).toContain("✔ t1")
    expect(result.stdout).toContain("✔ t2")
    expect(result.stderr).toBe("")
  })
})

it("should stop on error when a tool fails with stopOnError=true and render failures", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    tools: [
      { id: "ok", command: "echo 'success'", stopOnError: false, recommendedNextActions: "" },
      { id: "fail", command: "bash -c 'echo error >&2; exit 1'", stopOnError: true, recommendedNextActions: "Fix it" },
      { id: "never", command: "echo 'should not run'", stopOnError: false, recommendedNextActions: "" },
    ],
  })
  await withTempSpecFile(spec, async temp => {
    const result = await tools({ spec: temp, format: "yaml" })
    expect(result.exitCode).toBe(1)
    expect(result.stdout).toContain("## Tools")
    expect(result.stdout).toContain("✔ ok")
    expect(result.stdout).toContain("✘ fail")
    expect(result.stdout).toContain("⚠ never: skipped")
    // Failing tools details section
    expect(result.stdout).toContain("There are errors reported by tools.")
    expect(result.stdout).toContain("### fail (exit code: 1)")
    expect(result.stdout).toContain("Recommended Next Action:")
    expect(result.stderr).toBe("error\n")
  })
})

it("should continue after failure when stopOnError=false and reflect last exit code; render status", async () => {
  const spec = makeSpec({
    ...ARCHETYPAL_SPEC,
    tools: [
      { id: "fail", command: "bash -c 'exit 1'", stopOnError: false, recommendedNextActions: "" },
      { id: "ok", command: "echo 'done'", stopOnError: false, recommendedNextActions: "" },
    ],
  })
  await withTempSpecFile(spec, async temp => {
    const result = await tools({ spec: temp, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("## Tools")
    expect(result.stdout).toContain("✘ fail")
    expect(result.stdout).toContain("✔ ok")
    // Failing tools details should include section and the failing tool id
    expect(result.stdout).toContain("There are errors reported by tools.")
    expect(result.stdout).toContain("### fail (exit code: 1)")
    expect(result.stderr).toBe("")
  })
})

it("should handle empty tools array and still render tools header", async () => {
  const spec = makeSpec({ ...ARCHETYPAL_SPEC, tools: [] })
  await withTempSpecFile(spec, async temp => {
    const result = await tools({ spec: temp, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain("## Tools")
    expect(result.stderr).toBe("")
  })
})

it("should return io_error when spec file is not found", async () => {
  const result = await tools({ spec: "nonexistent.yaml", format: "yaml" })
  expect(result.exitCode).toBe(1)
  expect(result.stderr).toContain("io_error")
})
