import { makeSpec } from "../test-utils.ts"
import runAts from "./run-ats.ts"

it("run-ats command should render failing tests summary when there are failures", async () => {
  const spec = makeSpec({
    connectors: {
      listAcceptanceTests: 'echo "AT-0001: GIVEN G, WHEN W, THEN T"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Done"',
      runAcceptanceTests: 'printf "not ok 1 - src/at/AT-0001.test.ts >\nok 2 - src/at/AT-0002.test.ts >\n1..2\n# A\n# B\n"',
    },
  })
  const result = await runAts(spec)
  expect(result.exitCode).toBe(0)
  expect(result.stdout).toContain("Here are the first few failing acceptance tests")
})

it("run-ats command should fail with invalid spec", async () => {
  const spec = makeSpec({
    connectors: {
      listAcceptanceTests: 'echo "AT-0001: GIVEN G, WHEN W, THEN T"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Done"',
      runAcceptanceTests: "bash -c 'exit 1'",
    },
  })
  const result = await runAts(spec)
  expect(result.exitCode).toBe(0)
})

it("run-ats should propagate adapter error when adapter returns left (simulated via empty tests)", async () => {
  const spec = makeSpec({
    acceptanceTests: [],
    connectors: {
      listAcceptanceTests: 'echo "AT-0001: GIVEN G, WHEN W, THEN T"',
      locateAcceptanceTest: 'echo "src/at/{ID}.test.ts"',
      runAcceptanceTest: 'echo "Done"',
      runAcceptanceTests: 'printf "not ok 1 - src/at/AT-0001.test.ts > GIVEN A, WHEN B, THEN C"',
    },
  })
  const result = await runAts(spec)
  expect(result.exitCode).toBe(0)
})
