import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { ValueWarning } from "../api/types";
import { type Language, setLanguage } from "../i18n";
import { ValueWarnings } from "./ValueWarnings";

const WARNINGS: ValueWarning[] = [
  { field: "margin", value: 12.5, reason: "not_from_tool" },
  { field: "total", value: null, reason: "missing" },
  { field: "share", value: 0.42, reason: "table_incomplete", rows_passed: 3, rows_in_input: 5 },
  { field: "sum", value: 1200, reason: "table_changed" },
  { field: "growth", value: 7, reason: "a_newer_reason" },
];

beforeEach(async () => {
  await setLanguage("en", false);
});

afterEach(() => cleanup());

describe("value warnings of an agent test", () => {
  it("shows nothing without warnings, also for an API that does not send the field", () => {
    const { container, rerender } = render(<ValueWarnings warnings={undefined} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<ValueWarnings warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names every field with its value and the reason, in a labelled group", () => {
    render(<ValueWarnings warnings={WARNINGS} />);
    const group = screen.getByRole("group", { name: "5 key figures were not computed with a tool" });
    const items = within(group).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual([
      "margin = 12.5 is not the result of a tool call in this test.",
      "total: the value is missing.",
      "share = 0.42: the table passed to the tool has fewer rows than the input (passed: 3, input: 5).",
      "sum = 1,200: the table passed to the tool is not the table of the input (rows were added or changed).",
      "growth = 7 is not backed by a tool call in this test.",
    ]);
    expect(items[2]).toHaveAttribute("data-reason", "table_incomplete");
    expect(group).toHaveTextContent("the step would fail if it does not");
  });

  it("counts a single warning in the singular", () => {
    render(<ValueWarnings warnings={[WARNINGS[0]]} />);
    expect(screen.getByRole("group", { name: "1 key figure was not computed with a tool" })).toBeInTheDocument();
  });

  it("shows texts and numbers in every language", async () => {
    const expected: Record<string, [string, string]> = {
      de: ["5 Kennzahlen wurden nicht mit einem Tool berechnet", "margin = 12,5 ist in diesem Test nicht das Ergebnis eines Tool-Aufrufs."],
      es: ["5 cifras clave no se calcularon con una herramienta", "margin = 12,5 no es el resultado de una llamada a una herramienta en esta prueba."],
      fr: ["5 indicateurs clés n’ont pas été calculés avec un outil", "margin = 12,5 n’est pas le résultat d’un appel d’outil dans ce test."],
      it: ["5 indicatori chiave non sono stati calcolati con uno strumento", "margin = 12,5 non è il risultato di una chiamata a uno strumento in questo test."],
      "pt-BR": ["5 indicadores-chave não foram calculados com uma ferramenta", "margin = 12,5 não é o resultado de uma chamada de ferramenta neste teste."],
    };
    for (const [language, [title, first]] of Object.entries(expected)) {
      await setLanguage(language as Language, false);
      const view = render(<ValueWarnings warnings={WARNINGS} />);
      const group = screen.getByRole("group", { name: title });
      expect(within(group).getAllByRole("listitem")[0].textContent).toBe(first);
      view.unmount();
    }
  });
});
