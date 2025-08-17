import js from "@eslint/js"
import { globalIgnores } from "eslint/config"
import importPlugin from "eslint-plugin-import"
import jsdoc from "eslint-plugin-jsdoc"
import sonarjs from "eslint-plugin-sonarjs"
import ts from "typescript-eslint"

// eslint.defineConfig() has a types incompatibility issue
export default ts.config([
  // global ignores
  globalIgnores([".cursor/", ".github/", "dist/", "coverage/", ".dependency-cruiser.cjs", "eslint.config.js"]),

  // check for typescript files
  { name: "s4/ts", files: ["src/**/*.ts"] },

  // js/recommended with custom rules
  {
    name: "s4/js-recomm-mod",
    extends: [js.configs.recommended],
    rules: {
      "no-undef": "off",
      "max-params": ["error", { max: 5 }],
      "max-statements": ["error", { max: 15 }],
    },
  },

  // jsdoc
  {
    name: "s4/jsdoc-recomm-mod",
    extends: [jsdoc.configs["flat/recommended-error"]],
    rules: {
      "jsdoc/require-jsdoc": ["error", { publicOnly: true }],
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/require-returns-check": "error",
    },
  },

  // import
  {
    name: "s4/import-recomm-mod",
    extends: [importPlugin.flatConfigs.recommended],
    ignores: ["eslint.config.js"],
    rules: {
      "import/max-dependencies": ["error", { max: 8, ignoreTypeImports: false }],
    },
  },

  // typescript-eslint
  {
    name: "s4/ts-strict-type-checked-mod",
    extends: [ts.configs.strictTypeChecked],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [-2, -1, 0, 1, 2, 10, 16, 24, 32, 42, 60, 100, 255, 256, 512, 1024],
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },

  // sonarjs
  {
    name: "s4/sonarjs-recomm-mod",
    extends: [sonarjs.configs.recommended],
    rules: {
      "sonarjs/todo-tag": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-os-command-from-path": "off",
      "sonarjs/prefer-regexp-exec": "off",
      "sonarjs/cognitive-complexity": ["error", 6],
      "sonarjs/max-lines": ["error", { maximum: 200 }],
      "sonarjs/elseif-without-else": "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-inconsistent-returns": "error",
      "sonarjs/slow-regex": "off",
      "no-useless-escape": "off",
      "no-magic-numbers": "off",
    },
  },

  // tests (overrides previous rules)
  {
    name: "s4/test",
    files: ["src/**/*.test.ts"],
    rules: {
      "max-statements": ["error", { max: 20 }],
      "sonarjs/cognitive-complexity": ["error", 3],
      "sonarjs/max-lines": ["error", { maximum: 300 }],
    },
  },
])
