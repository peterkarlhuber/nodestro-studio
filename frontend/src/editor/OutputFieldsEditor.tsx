import type { TFunction } from "i18next";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { OutputField, OutputFieldType } from "../api/types";
import { HelpTip, Tooltip } from "../components/Tooltip";
import { Button, IconButton, Select, TextInput } from "../components/ui";
import { helpEntry } from "../lib/help";
import { fieldNameProblem } from "../lib/validation";

const FIELD_TYPES: OutputFieldType[] = ["string", "number", "integer", "boolean", "string_list", "number_list"];

function options(t: TFunction, values: readonly string[]) {
  return values.map((value) => ({ value, label: t(`agent.options.fieldType.${value}`) }));
}

/** Named, typed fields of a structured result: an agent's output format or a workflow's output contract. */
export function OutputFieldsEditor({
  fields,
  onChange,
  idPrefix,
}: {
  fields: OutputField[];
  onChange: (fields: OutputField[]) => void;
  idPrefix: string;
}) {
  const { t } = useTranslation();
  const setField = (index: number, patch: Partial<OutputField>) =>
    onChange(fields.map((field, i) => (i === index ? { ...field, ...patch } : field)));
  const names = fields.map((field) => field.name);
  return (
    <>
      <div className="fields-editor">
        {fields.map((field, index) => {
          const problemKey = fieldNameProblem(field.name, names);
          const problem = problemKey ? t(problemKey) : null;
          const id = `${idPrefix}-${index}`;
          return (
            <div
              className="output-field"
              key={index}
              role="group"
              aria-label={t("agent.output.field", { name: field.name || index + 1 })}
            >
              <div className="output-field__name">
                <span className="output-field__label">
                  <label htmlFor={`${id}-name`}>{t("agent.output.fieldName")}</label>
                  {index === 0 ? <HelpTip id="agent.outputFieldName" label={t("agent.output.fieldName")} /> : null}
                </span>
                <TextInput
                  id={`${id}-name`}
                  value={field.name}
                  placeholder="field_name"
                  spellCheck={false}
                  autoComplete="off"
                  aria-invalid={problem ? true : undefined}
                  aria-describedby={problem ? `${id}-problem` : undefined}
                  onChange={(e) => setField(index, { name: e.target.value.replace(/[^A-Za-z0-9_]/g, "_") })}
                />
                {problem ? (
                  <span id={`${id}-problem`} className="output-field__error">
                    {problem}
                  </span>
                ) : null}
              </div>
              <div className="output-field__type">
                <span className="output-field__label">
                  <label htmlFor={`${id}-type`}>{t("agent.output.fieldType")}</label>
                  {index === 0 ? <HelpTip id="agent.outputFieldType" label={t("agent.output.fieldType")} /> : null}
                </span>
                <Select
                  id={`${id}-type`}
                  value={field.type}
                  options={options(t, FIELD_TYPES)}
                  onChange={(type) => setField(index, { type: type as OutputFieldType })}
                />
              </div>
              <div className="output-field__remove">
                <IconButton
                  icon={Trash2}
                  label={t("agent.output.removeField", { name: field.name || index + 1 })}
                  onClick={() => onChange(fields.filter((_, i) => i !== index))}
                />
              </div>
              <div className="output-field__description">
                <span className="output-field__label">
                  <label htmlFor={`${id}-description`}>{t("common.description")}</label>
                  {index === 0 ? <HelpTip id="agent.outputFieldDescription" label={t("common.description")} /> : null}
                </span>
                <TextInput
                  id={`${id}-description`}
                  value={field.description}
                  placeholder={t("agent.output.fieldDescriptionPlaceholder")}
                  onChange={(e) => setField(index, { description: e.target.value })}
                />
              </div>
              <Tooltip content={helpEntry(t, "agent.outputFieldRequired").text}>
                <label className="checkbox output-field__required">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => setField(index, { required: e.target.checked })}
                  />
                  {t("agent.output.required")}
                </label>
              </Tooltip>
            </div>
          );
        })}
      </div>
      <Button
        size="sm"
        icon={Plus}
        onClick={() =>
          onChange([...fields, { name: `field_${fields.length + 1}`, type: "string", description: "", required: true }])
        }
      >
        {t("agent.output.addField")}
      </Button>
    </>
  );
}
