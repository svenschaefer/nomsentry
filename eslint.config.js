import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "custom/sources/**",
      "dist/**",
      "data/**",
      "node_modules/**"
    ]
  },
  js.configs.recommended,
  {
    files: ["bin/**/*.js", "scripts/**/*.js", "src/**/*.js", "test/**/*.js", "*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node
      }
    },
    rules: {
      "no-console": "off",
      "no-control-regex": "off",
      "no-misleading-character-class": "off"
    }
  }
];
