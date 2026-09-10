import { registry } from "@docmost/base-formula/client";
import { Button, Divider, Group, Paper, Stack, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconMathFunction,
  IconPointFilled,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useFormulaParser } from "@/ee/base/hooks/use-formula-parser";
import classes from "@/ee/base/styles/formula.module.css";
import type { IBaseProperty } from "@/ee/base/types/base.types";
import { FormulaInput } from "./formula-input";
import { FunctionPalette } from "./function-palette";
import { PropertyChipRow } from "./property-chip-row";

type Props = {
  properties: IBaseProperty[];
  editingPropertyId: string | null;
  initialSource?: string;
  name?: string;
  disabled?: boolean;
  onSave: (
    source: string,
    ast: unknown,
    resultType: string,
    dependencies: string[]
  ) => void;
  onCancel: () => void;
};

export function FormulaEditor({
  properties,
  editingPropertyId,
  initialSource = "",
  name,
  disabled = false,
  onSave,
  onCancel,
}: Props) {
  const [source, setSource] = useState(initialSource);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursorRef = useRef<number | null>(null);
  const parseState = useFormulaParser(
    source,
    properties,
    editingPropertyId,
    registry
  );
  const canSave = parseState.state === "ok" && !disabled;

  // useEffect (not RAF) ensures the DOM update ran before restoring cursor.
  useEffect(() => {
    if (pendingCursorRef.current === null) {
      return;
    }
    const pos = pendingCursorRef.current;
    pendingCursorRef.current = null;
    const ta = textareaRef.current;
    if (!ta) {
      return;
    }
    ta.focus();
    ta.setSelectionRange(pos, pos);
  }, [source]);

  const insertAtCursor = (snippet: string, cursorOffsetFromEnd = 0) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? source.length;
    const end = ta?.selectionEnd ?? source.length;
    const before = source.slice(0, start);
    const after = source.slice(end);
    const prev = before.slice(-1);
    const needsSpace = prev !== "" && !/[\s(,]/.test(prev);
    const prefix = needsSpace ? " " : "";
    const next = before + prefix + snippet + after;
    pendingCursorRef.current =
      before.length + prefix.length + snippet.length - cursorOffsetFromEnd;
    setSource(next);
  };

  return (
    <Paper
      p={0}
      radius="md"
      shadow="sm"
      style={{ overflow: "hidden" }}
      withBorder
    >
      <Stack gap={0}>
        <Group
          className={classes.formulaHeaderRow}
          justify="space-between"
          px="md"
          py={12}
          wrap="nowrap"
        >
          <Group gap={10} style={{ minWidth: 0 }} wrap="nowrap">
            <div className={classes.formulaIconBadge}>
              <IconMathFunction size={14} />
            </div>
            <Text fw={600} size="sm">
              Formula
            </Text>
            {name && (
              <Text c="dimmed" size="sm" truncate>
                · {name}
              </Text>
            )}
          </Group>
          <Group gap={8} style={{ flexShrink: 0 }} wrap="nowrap">
            <Button onClick={onCancel} size="xs" variant="subtle">
              Cancel
            </Button>
            <Button
              disabled={!canSave}
              onClick={() => {
                if (parseState.state !== "ok") {
                  return;
                }
                onSave(
                  source,
                  parseState.ast,
                  parseState.resultType,
                  parseState.dependencies
                );
              }}
              size="xs"
            >
              Save
            </Button>
          </Group>
        </Group>

        <Stack gap={6} pb={8} pt={10} px={14}>
          <FormulaInput
            hasError={parseState.state === "error"}
            onChange={setSource}
            ref={textareaRef}
            value={source}
          />
          <Group gap={8} justify="space-between" mih={16}>
            {parseState.state === "error" ? (
              <Group c="red.7" gap={6}>
                <IconAlertTriangle size={12} />
                <Text size="xs">{parseState.message}</Text>
              </Group>
            ) : parseState.state === "ok" ? (
              <Group c="dimmed" gap={6}>
                <IconPointFilled
                  color="var(--mantine-color-teal-6)"
                  size={10}
                />
                <Text size="xs">
                  Returns{" "}
                  <Text c="gray.8" fw={600} span>
                    {parseState.resultType}
                  </Text>
                </Text>
              </Group>
            ) : (
              <Text c="dimmed" size="xs">
                Click a property or function below to insert.
              </Text>
            )}
          </Group>
        </Stack>

        <Divider />

        <Stack gap={8} pb={10} pt={10} px={14}>
          <PropertyChipRow
            onInsert={(name) => insertAtCursor(`prop("${name}")`)}
            properties={properties.filter((p) => p.id !== editingPropertyId)}
          />
        </Stack>

        <Divider />

        <Stack gap={6} pb={10} pt={10} px={14}>
          <Text c="gray.7" fw={600} size="xs">
            Functions
          </Text>
          <FunctionPalette
            onInsert={(name) => insertAtCursor(`${name}()`, 1)}
            registry={registry}
          />
        </Stack>
      </Stack>
    </Paper>
  );
}
