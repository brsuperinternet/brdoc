import { Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { useState } from "react";
import { formatDateDisplay } from "@/ee/base/components/cells/cell-date";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { DateTypeOptions } from "@/ee/base/types/base.types";
import { FieldProps, FieldShell } from "./detail-field";

function toISODateString(dateStr: string | null): string | null {
  if (!dateStr) {
    return null;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function FieldDate({ property, value, readOnly, onChange }: FieldProps) {
  const [opened, setOpened] = useState(false);
  const typeOptions = property.typeOptions as DateTypeOptions | undefined;
  const dateStr = typeof value === "string" ? value : null;
  const display = formatDateDisplay(dateStr, typeOptions);

  if (readOnly) {
    return (
      <FieldShell>
        <span className={classes.fieldValueText}>{display}</span>
      </FieldShell>
    );
  }

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape
      hideDetached={false}
      onChange={setOpened}
      opened={opened}
      position="bottom-start"
      shadow="md"
      trapFocus
      width="auto"
      withinPortal
    >
      <Popover.Target>
        <FieldShell
          active={opened}
          aria-label={property.name}
          cursor="pointer"
          onClick={() => setOpened((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpened((o) => !o);
            }
          }}
          role="button"
          tabIndex={0}
        >
          <span className={classes.fieldValueText}>{display}</span>
        </FieldShell>
      </Popover.Target>
      <Popover.Dropdown p="xs">
        <DatePicker
          onChange={(selected) => {
            onChange(selected ? new Date(selected).toISOString() : null);
            setOpened(false);
          }}
          size="sm"
          value={toISODateString(dateStr)}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
