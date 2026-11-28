import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const HELP_ONLY_SHARED = "Help buttons are the shared HelpTip of @nodestro/ui-core (import it from there; texts in lib/help.ts and the language files).";

/** Selectors of the studio's former help tooltip: a HelpTip from anywhere else, a HelpTip of its own, its class. */
export const HELP_GUARD = [
  { selector: "ImportDeclaration[source.value!='@nodestro/ui-core'] > ImportSpecifier[imported.name='HelpTip']", message: HELP_ONLY_SHARED },
  { selector: "ExportNamedDeclaration[source=null] > ExportSpecifier[local.name='HelpTip']", message: HELP_ONLY_SHARED },
  { selector: ":matches(FunctionDeclaration, ClassDeclaration, VariableDeclarator)[id.name='HelpTip']", message: HELP_ONLY_SHARED },
  { selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)help-tip(\\s|$|--)/]", message: HELP_ONLY_SHARED },
  { selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|\\s)help-tip(\\s|$|--)/]", message: HELP_ONLY_SHARED },
];

export default tseslint.config(
  { ignores: ["dist", "node_modules", "e2e"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // ST-068: every help button is the shared HelpTip of @nodestro/ui-core with the studio's help registry
    // (lib/platformHelp.tsx). The studio's own help tooltip is gone; this keeps it from coming back (tested in
    // src/lint/helpGuard.test.ts).
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...HELP_GUARD],
    },
  },
);
