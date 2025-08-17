// eslint-disable-next-line import/no-unresolved
import { coverageConfigDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    forceRerunTriggers: ["**/*.eta"],
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/at/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "acceptance",
          include: ["src/at/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      exclude: [...coverageConfigDefaults.exclude, "src/test-utils.ts", "src/index.ts"],
    },
  },
})
