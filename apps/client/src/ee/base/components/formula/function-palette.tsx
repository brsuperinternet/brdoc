import type { FormulaFn } from "@docmost/base-formula/client";
import { Accordion, Group, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { useState } from "react";
import classes from "@/ee/base/styles/formula.module.css";

const CATEGORIES = ["logic", "math", "string", "date", "coercion"] as const;

export function FunctionPalette({
  registry,
  onInsert,
}: {
  registry: ReadonlyMap<string, FormulaFn>;
  onInsert: (name: string) => void;
}) {
  const [open, setOpen] = useState<string | null>("logic");

  const byCat = new Map<string, FormulaFn[]>();
  for (const fn of registry.values()) {
    if (!byCat.has(fn.category)) {
      byCat.set(fn.category, []);
    }
    byCat.get(fn.category)!.push(fn);
  }

  return (
    <Accordion
      chevronSize={14}
      onChange={setOpen}
      radius="md"
      styles={{
        content: { padding: "6px 10px 10px" },
        control: { minHeight: 0, padding: "7px 12px" },
        item: { borderColor: "var(--mantine-color-gray-2)" },
        label: {
          fontSize: 13,
          fontWeight: 600,
          padding: 0,
          textTransform: "capitalize",
        },
        panel: { background: "var(--mantine-color-gray-0)" },
      }}
      value={open}
      variant="contained"
    >
      {CATEGORIES.map((cat) => {
        const fns = byCat.get(cat) ?? [];
        return (
          <Accordion.Item key={cat} value={cat}>
            <Accordion.Control>
              <Group gap={8}>
                <span>{cat}</span>
                <Text c="dimmed" ff="monospace" size="xs">
                  {fns.length}
                </Text>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Group gap={6}>
                {fns.map((fn) => (
                  <Tooltip key={fn.name} label={fn.doc} withArrow>
                    <UnstyledButton
                      className={classes.fnChip}
                      onClick={() => onInsert(fn.name)}
                    >
                      {fn.name}
                      <span className={classes.fnChipParens}>()</span>
                    </UnstyledButton>
                  </Tooltip>
                ))}
              </Group>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}
