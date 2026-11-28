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

const TOOLTIP_ONLY_SHARED =
  "Tooltips are the shared Tooltip of @nodestro/ui-core (import it from there; help texts by id: <Tooltip help=\"<id>\">).";

/**
 * Selectors of the studio's former tooltips (components/Tooltip.tsx and Hint in components/ui.tsx): a Tooltip from
 * anywhere else, a Tooltip or Hint of its own (also as a re-export), the module, the bubble's class.
 */
export const TOOLTIP_GUARD = [
  { selector: "ImportDeclaration[source.value!='@nodestro/ui-core'] > ImportSpecifier[imported.name=/^(Tooltip|Hint)$/]", message: TOOLTIP_ONLY_SHARED },
  { selector: "ImportDeclaration[source.value=/(^|\\/)components\\/Tooltip$|^\\.\\/Tooltip$/]", message: TOOLTIP_ONLY_SHARED },
  { selector: "ExportNamedDeclaration[source=null] > ExportSpecifier[local.name=/^(Tooltip|Hint)$/]", message: TOOLTIP_ONLY_SHARED },
  { selector: ":matches(FunctionDeclaration, ClassDeclaration, VariableDeclarator)[id.name=/^(Tooltip|Hint)$/]", message: TOOLTIP_ONLY_SHARED },
  { selector: "JSXAttribute[name.name='className'] Literal[value=/(^|\\s)tooltip(\\s|$|__|--)/]", message: TOOLTIP_ONLY_SHARED },
  { selector: "JSXAttribute[name.name='className'] TemplateElement[value.raw=/(^|\\s)tooltip(\\s|$|__|--)/]", message: TOOLTIP_ONLY_SHARED },
];

const AI_ONLY_SHARED =
  "Approval cards and their remember options are the shared ApprovalCard and RememberOptions of @nodestro/ui-ai (the studio keeps the data and the decision; its wording through lib/uiTexts.tsx).";

const OLD_CARD_CLASS = "/(^|\\s)(approval-card|budget-card)(\\s|$|--)|(^|\\s)approval-card__(head|actions)/";

/** Selectors of the studio's former approval cards (ST-068 step 2): one of its own, or the shared one from elsewhere. */
export const APPROVAL_GUARD = [
  { selector: "ImportDeclaration[source.value!='@nodestro/ui-ai'] > ImportSpecifier[imported.name=/^(ApprovalCard|RememberOptions)$/]", message: AI_ONLY_SHARED },
  { selector: "ExportNamedDeclaration[source=null] > ExportSpecifier[local.name=/^(ApprovalCard|RememberOptions)$/]", message: AI_ONLY_SHARED },
  { selector: ":matches(FunctionDeclaration, ClassDeclaration, VariableDeclarator)[id.name=/^(ApprovalCard|RememberOptions|RememberDecision)$/]", message: AI_ONLY_SHARED },
  // The former card frame (step 3: the budget card was the last one); its own parts (__note, __count) stay.
  { selector: `JSXAttribute[name.name='className'] Literal[value=${OLD_CARD_CLASS}]`, message: AI_ONLY_SHARED },
  { selector: `JSXAttribute[name.name='className'] TemplateElement[value.raw=${OLD_CARD_CLASS}]`, message: AI_ONLY_SHARED },
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
    // ST-068: every help button is the shared HelpTip and every tooltip the shared Tooltip of @nodestro/ui-core,
    // with the studio's help registry (lib/platformHelp.tsx); the step, tool and budget approval cards are the
    // shared ApprovalCard of @nodestro/ui-ai, also the budget card. The studio's own versions are gone; this keeps them from coming back (tested in
    // src/lint/helpGuard.test.ts).
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": ["error", ...HELP_GUARD, ...TOOLTIP_GUARD, ...APPROVAL_GUARD],
    },
  },
);
