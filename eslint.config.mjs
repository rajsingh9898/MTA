import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Allow explicit any for now
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused variables for now
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow img elements for now
      "@next/next/no-img-element": "warn",
      // Allow missing alt props for now
      "jsx-a11y/alt-text": "warn",
      // Allow all other potential issues as warnings
      "prefer-const": "warn",
      "no-var": "warn",
      "no-console": "warn",
      "no-debugger": "warn",
    }
  }
]);

export default eslintConfig;