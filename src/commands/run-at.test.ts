import { ARCHETYPAL_SPEC, createTempSpecFile } from "../test-utils.ts"
import runAt from "./run-at.ts"

const SPEC_WITH_CONNECTORS = {
  connectors: {
    ...ARCHETYPAL_SPEC.connectors,
    // ensure the command is deterministic and includes the id
    runAcceptanceTest: 'bash -c "echo {ID}: ok"',
  },
}

it("run-at command should succeed with valid acceptance test ID", async () => {
  const specFile = createTempSpecFile(SPEC_WITH_CONNECTORS)
  const result = await runAt({ id: "AT-0001", spec: specFile.path, format: "yaml" })
  expect(result).toMatchObject({ exitCode: 0, stdout: "AT-0001: ok" })
})

it("run-at should return value_error when id is missing", async () => {
  const specFile = createTempSpecFile(SPEC_WITH_CONNECTORS)
  const result = await runAt({ id: "", spec: specFile.path, format: "yaml" })
  expect(result).toBeError("value_error")
})
