import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import sonarjs from 'eslint-plugin-sonarjs';
import jsdoc from 'eslint-plugin-jsdoc';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  // global ignores
  { ignores: ["dist/**/*", "coverage/**/*"] },

  // eslint
  {
    ...eslint.configs.recommended,
    rules: {
      ...eslint.configs.recommended.rules,
      "max-params": ["error", { "max": 5 }],
      "max-statements": ["error", { "max": 20 }], // sonarjs/max-lines-per-function과 다름
    }
  },

  // jsdoc
  {
    ...jsdoc.configs['flat/recommended-error'],
    rules: {
      ...jsdoc.configs['flat/recommended-error'].rules,
      "jsdoc/require-jsdoc": ["error", { "publicOnly": true }],
      "jsdoc/require-param-type": "off",
      "jsdoc/require-returns-type": "off",
      "jsdoc/require-returns-check": "off",
    }
  },

  // import
  {
    ...importPlugin.flatConfigs.recommended,
    files: ["src/**/*.ts"],
    rules: {
      ...importPlugin.flatConfigs.recommended.rules,
      "import/max-dependencies": ["error", {
        "max": 8,
        "ignoreTypeImports": false,
      }],
    },
  },
  
  // typescript-eslint
  ...tseslint.configs.strictTypeChecked.map(config => ({
    ...config,
    files: ["src/**/*.ts"],
  })),

  // sonarjs
  {
    ...sonarjs.configs.recommended,
    files: ["src/**/*.ts"],
    languageOptions: { parserOptions: { projectService: true } },
    rules: {
      ...sonarjs.configs.recommended.rules,
      "sonarjs/todo-tag": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-os-command-from-path": "off",
      "sonarjs/prefer-regexp-exec": "off",
      "sonarjs/cognitive-complexity": ["error", 6],
      "sonarjs/max-lines-per-function": ["error", {maximum: 40}], // max-statements와 다름
      "sonarjs/max-lines": ["error", {maximum: 185}],
      'sonarjs/elseif-without-else': "error",
      "sonarjs/no-collapsible-if": "error",
      "sonarjs/no-inconsistent-returns": "error",
      "sonarjs/slow-regex": "off",
      "no-useless-escape": "off",
      "no-magic-numbers": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/no-magic-numbers": [
        "error", {
          ignore: [-2, -1, 0, 1, 2, 10, 16, 24, 32, 42, 60, 100, 255, 256, 512, 1024],
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        }
      ],
    }
  },

  // sonarjs for tests
  {
    files: ["src/**/*.test.ts"],
    rules: {
      "sonarjs/max-lines-per-function": ["error", {maximum: 150}],
      "sonarjs/cognitive-complexity": ["error", 3],
      "sonarjs/max-lines": ["error", {maximum: 500}],
    }
  }
);