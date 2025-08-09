import { runS4 } from "../test-utils.ts"

it('GIVEN a non-existent spec file, WHEN the user runs "s4 validate --spec nonexistent.yaml", THEN the command fails with an error message indicating the file does not exist', () => {
  // Given a non-existent spec file
  const nonExistentFile = "nonexistent.yaml"

  // When the user runs the validate command with the non-existent file
  const result = runS4(`validate --spec ${nonExistentFile}`)

  // Then the command fails with an appropriate error message
  expect(result.status).toBe(1)
  expect(result.stderr).toContain(`io_error: Failed to read spec file: ${nonExistentFile}`)
})
