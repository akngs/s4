import "vitest"

declare module "vitest" {
  interface Assertion<T = unknown> {
    toContainInOrder(expected: string[]): T
    toBeError(expectedType: string): T
  }
}
