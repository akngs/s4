import { describe, expect, it } from "vitest"

describe("executeCommand()", () => {
  it("returns stdout/stderr with exitCode 0 on success", async () => {
    const { executeCommand } = await import("./exec.ts")
    const result = await executeCommand("echo ok")
    expect(result).toMatchObject({ exitCode: 0, stdout: "ok" })
  })

  it("returns stdout/stderr with non-zero exitCode on failure", async () => {
    const { executeCommand } = await import("./exec.ts")
    const cmd = "printf out; printf err 1>&2; exit 2"
    const result = await executeCommand(cmd)
    expect(result).toMatchObject({ exitCode: 2, stdout: "out", stderr: "err" })
  })
})
