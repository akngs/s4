import { ARCHETYPAL_SPEC, cleanupTempFile, makeTempFile } from "../test-utils.ts"
import runAt from "./run-at.ts"

const SPEC_WITH_CONNECTORS = {
  ...ARCHETYPAL_SPEC,
  connectors: {
    ...ARCHETYPAL_SPEC.connectors,
    // ensure the command is deterministic and includes the id
    runAcceptanceTest: 'bash -c "echo {ID}: ok"',
  },
}

it("run-at command should succeed with valid acceptance test ID", async () => {
  const tempFile = makeTempFile(SPEC_WITH_CONNECTORS)
  try {
    const result = await runAt({ id: "AT-0001", spec: tempFile, format: "yaml" })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toBe("AT-0001: ok")
  } finally {
    cleanupTempFile(tempFile)
  }
})

it("run-at should return value_error when id is missing", async () => {
  const tempFile = makeTempFile(SPEC_WITH_CONNECTORS)
  try {
    const result = await runAt({ id: "", spec: tempFile, format: "yaml" })
    expect(result).toBeError("value_error")
  } finally {
    cleanupTempFile(tempFile)
  }
})
