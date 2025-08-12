expect.extend({
  toContainInOrder(received: unknown, parts: ReadonlyArray<string>) {
    if (typeof received !== "string") {
      return {
        pass: false,
        message: () => `toContainInOrder: expected a string but received ${typeof received}`,
      }
    }

    const indices = parts.map(p => received.indexOf(p))

    // 1. Ensure all parts exist
    const missingAt = indices.findIndex(i => i === -1)
    if (missingAt !== -1) {
      const missingPart = parts[missingAt]
      return {
        pass: false,
        message: () => `toContainInOrder: missing substring at position ${missingAt}: ${missingPart}`,
      }
    }

    // 2. Ensure order is non-decreasing
    for (let i = 1; i < indices.length; i += 1) {
      const prev = indices[i - 1] as number
      const cur = indices[i] as number
      if (cur < prev) {
        const report = parts.map((p, j) => `[${j}]@${indices[j]}: ${p}`).join("\n")
        return {
          pass: false,
          message: () => `toContainInOrder: substrings out of order at index ${i}. Expected non-decreasing indices.\n${report}`,
        }
      }
    }

    // 3. Success
    return {
      pass: true,
      message: () => "toContainInOrder: expected substrings not to appear in order",
    }
  },
  toBeError(received: { exitCode: number; stderr: string }, expectedType: string) {
    const pass = received.exitCode === 1 && typeof received.stderr === "string" && received.stderr.includes(expectedType)
    return {
      pass,
      message: () =>
        `toError: expected exitCode=1 and stderr to contain "${expectedType}" but got exitCode=${received.exitCode}, stderr=${JSON.stringify(
          received.stderr,
        )}`,
    }
  },
})
