import "vitest"

declare module "vitest" {
  interface Assertion<T = unknown> {
    toContainInOrder(expected: ReadonlyArray<string>): T
    toBeError(expectedType: string): T
  }
}
