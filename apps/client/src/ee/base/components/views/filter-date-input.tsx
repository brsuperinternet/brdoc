import { Input, InputBase, Popover, SegmentedControl } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconChevronDown } from "@tabler/icons-react";
import clsx from "clsx";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import cellClasses from "@/ee/base/styles/cells.module.css";
import type {
  DateFilterValue,
  FilterOperator,
} from "@/ee/base/types/base.types";
import {
  ANCHOR_VALUES,
  DATE_ANCHOR_PRESETS,
  DATE_RANGE_PRESETS,
  RANGE_VALUES,
} from "./relative-date-presets";

type FilterDateInputProps = {
  op: FilterOperator;
  value: unknown;
  onChange: (value: unknown) => void;
};

type Mode = "exact" | "relative";

const ANCHOR_LABEL: Record<string, string> = Object.fromEntries(
  DATE_ANCHOR_PRESETS.map((p) => [p.value, p.labelKey])
);
const RANGE_LABEL: Record<string, string> = Object.fromEntries(
  DATE_RANGE_PRESETS.map((p) => [p.value, p.labelKey])
);

function asDateValue(value: unknown): DateFilterValue | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as DateFilterValue;
}

function toISODate(d: string | null): string | null {
  if (!d) {
    return null;
  }
  // Already a date-only ISO string (Mantine v8 emits these) — pass through to
  // avoid a UTC-parse + local-getter round-trip that shifts the day west of UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return d;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) {
    return null;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FilterDateInput({ op, value, onChange }: FilterDateInputProps) {
  const { t } = useTranslation();
  const current = asDateValue(value);

  const [opened, setOpened] = useState(false);
  const [localMode, setLocalMode] = useState<Mode>("exact");

  const exactDate = current?.mode === "exact" ? toISODate(current.date) : null;
  const anchor =
    current?.mode === "relative" && ANCHOR_VALUES.has(current.preset)
      ? current.preset
      : null;
  const range =
    current?.mode === "range" && RANGE_VALUES.has(current.preset)
      ? current.preset
      : null;

  const valueMode: Mode | null =
    current?.mode === "relative"
      ? "relative"
      : current?.mode === "exact"
        ? "exact"
        : null;
  const mode: Mode = valueMode ?? localMode;

  let triggerLabel: string | null = null;
  if (op === "isWithin") {
    triggerLabel = range ? t(RANGE_LABEL[range]) : null;
  } else if (exactDate) {
    triggerLabel = exactDate;
  } else if (anchor) {
    triggerLabel = t(ANCHOR_LABEL[anchor]);
  }

  // Consume Escape locally so the outer filter popover (bubble handler) keeps
  // the panel open and only this picker closes.
  const handleEscape = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpened(false);
    }
  };

  const presetRow = (
    selected: boolean,
    label: string,
    onClick: () => void,
    key: string
  ) => (
    <div
      className={clsx(
        cellClasses.selectOption,
        selected && cellClasses.selectOptionActive
      )}
      key={key}
      onClick={onClick}
    >
      <span className={cellClasses.personOptionName}>{label}</span>
    </div>
  );

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape={false}
      onChange={setOpened}
      opened={opened}
      position="bottom-start"
      width={op === "isWithin" ? 200 : "auto"}
      withinPortal={false}
    >
      <Popover.Target>
        <InputBase
          component="button"
          onClick={() => setOpened((o) => !o)}
          onKeyDown={handleEscape}
          pointer
          rightSection={<IconChevronDown size={14} />}
          rightSectionPointerEvents="none"
          size="xs"
          type="button"
          w={170}
        >
          {triggerLabel ?? <Input.Placeholder>{t("Select")}</Input.Placeholder>}
        </InputBase>
      </Popover.Target>
      <Popover.Dropdown
        onKeyDown={handleEscape}
        p={op === "isWithin" ? 0 : "xs"}
      >
        {op === "isWithin" ? (
          <div className={cellClasses.selectDropdown}>
            {DATE_RANGE_PRESETS.map((p) =>
              presetRow(
                range === p.value,
                t(p.labelKey),
                () => {
                  onChange({ mode: "range", preset: p.value });
                  setOpened(false);
                },
                p.value
              )
            )}
          </div>
        ) : (
          <>
            <SegmentedControl
              data={[
                { label: t("Date"), value: "exact" },
                { label: t("Relative"), value: "relative" },
              ]}
              fullWidth
              mb="xs"
              onChange={(m) => {
                setLocalMode(m as Mode);
                onChange(undefined);
              }}
              size="xs"
              value={mode}
            />
            {mode === "exact" ? (
              <DatePicker
                onChange={(d) => {
                  const iso = toISODate(d);
                  onChange(iso ? { date: iso, mode: "exact" } : undefined);
                  setOpened(false);
                }}
                size="sm"
                value={exactDate}
              />
            ) : (
              <div className={cellClasses.selectDropdown}>
                {DATE_ANCHOR_PRESETS.map((p) =>
                  presetRow(
                    anchor === p.value,
                    t(p.labelKey),
                    () => {
                      onChange({ mode: "relative", preset: p.value });
                      setOpened(false);
                    },
                    p.value
                  )
                )}
              </div>
            )}
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
