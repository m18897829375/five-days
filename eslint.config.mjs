import tseslint from "typescript-eslint"
import eslint from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import react from "eslint-plugin-react"

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
      react,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
  {
    ignores: ["node_modules/", ".next/", "scripts/"],
  },
)
