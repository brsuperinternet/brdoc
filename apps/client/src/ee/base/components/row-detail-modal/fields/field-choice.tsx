import { Popover } from "@mantine/core";
import { useCallback, useState } from "react";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { ChoicePicker } from "@/ee/base/components/cells/choice-picker";
import cellClasses from "@/ee/base/styles/cells.module.css";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { Choice, SelectTypeOptions } from "@/ee/base/types/base.types";
import { FieldProps, FieldShell } from "./detail-field";

export function FieldChoice({
  property,
  value,
  readOnly,
  onChange,
}: FieldProps) {
  const [opened, setOpened] = useState(false);
  const multiple = property.type === "multiSelect";
  const choices =
    (property.typeOptions as SelectTypeOptions | undefined)?.choices ?? [];

  const selectedIds = multiple
    ? Array.isArray(value)
      ? (value as string[])
      : []
    : typeof value === "string"
      ? [value]
      : [];
  const selectedChoices = choices.filter((c) => selectedIds.includes(c.id));

  const handleToggle = useCallback(
    (choice: Choice) => {
      if (multiple) {
        const next = selectedIds.includes(choice.id)
          ? selectedIds.filter((id) => id !== choice.id)
          : [...selectedIds, choice.id];
        onChange(next.length > 0 ? next : null);
      } else {
        onChange(choice.id === selectedIds[0] ? null : choice.id);
        setOpened(false);
      }
    },
    [multiple, selectedIds, onChange]
  );

  const chips = selectedChoices.map((choice) => (
    <span
      className={cellClasses.badge}
      key={choice.id}
      style={choiceColor(choice.color)}
    >
      {choice.name}
    </span>
  ));

  if (readOnly) {
    return (
      <FieldShell>
        <div className={classes.fieldChips}>{chips}</div>
      </FieldShell>
    );
  }

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape={false}
      hideDetached={false}
      onChange={setOpened}
      opened={opened}
      position="bottom-start"
      shadow="md"
      trapFocus
      width="target"
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
          <div className={classes.fieldChips}>{chips}</div>
        </FieldShell>
      </Popover.Target>
      <Popover.Dropdown p={4}>
        {opened && (
          <ChoicePicker
            allowCreate={property.type !== "status"}
            grouped={property.type === "status"}
            multiple={multiple}
            onEscape={() => setOpened(false)}
            onToggle={handleToggle}
            property={property}
            selectedIds={selectedIds}
          />
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
