import { describe, expect, it } from "vitest"

describe("executeCommand()", () => {
  it("returns stdout/stderr with exitCode 0 on success", async () => {
    const { executeCommand } = await import("./exec.ts")
    const result = await executeCommand("echo ok")
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe("ok")
    expect(result.stderr).toBe("")
  })

  it("returns stdout/stderr with non-zero exitCode on failure", async () => {
    const { executeCommand } = await import("./exec.ts")
    const cmd = "printf out; printf err 1>&2; exit 2"
    const result = await executeCommand(cmd)
    expect(result.exitCode).toBe(2)
    expect(result.stdout).toBe("out")
    expect(result.stderr).toBe("err")
  })
})
