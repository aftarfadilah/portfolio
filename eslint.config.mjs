import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

// Same rule families eslint-config-next ships (React, hooks, a11y, TypeScript),
// configured directly so we don't depend on @next/eslint-plugin-next, which
// pulls in the unpatched fast-glob -> micromatch -> braces chain.
const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  {
    plugins: { "jsx-a11y": jsxA11y },
    rules: Object.fromEntries(
      ["alt-text", "aria-props", "aria-proptypes", "aria-unsupported-elements", "role-has-required-aria-props", "role-supports-aria-props"].map((r) => [`jsx-a11y/${r}`, "warn"]),
    ),
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
      "react/no-unknown-property": "off", // React Three Fiber props
      "react/display-name": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
