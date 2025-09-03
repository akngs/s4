import { makeSpec } from "../test-utils.ts"
import runAt from "./run-at.ts"

it("run-at command should succeed with valid acceptance test ID", async () => {
  const spec = makeSpec()
  const result = await runAt(spec, "AT-0001")
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toBe("Done")
})
