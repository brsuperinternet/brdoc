import { useEffect, useRef, useState } from "react";
import {
  formatNumber,
  parseNumberDraft,
  sanitizeNumberInput,
} from "@/ee/base/components/cells/cell-number";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { NumberTypeOptions } from "@/ee/base/types/base.types";
import { FieldProps, FieldShell } from "./detail-field";

const toDraft = (value: unknown) =>
  typeof value === "number" ? String(value) : "";

export function FieldNumber({
  property,
  value,
  readOnly,
  onChange,
  onEditingChange,
}: FieldProps) {
  const typeOptions = property.typeOptions as NumberTypeOptions | undefined;
  const numValue = typeof value === "number" ? value : null;
  const [draft, setDraft] = useState(toDraft(value));
  const [focused, setFocused] = useState(false);
  // Esc sets this; blur() then runs commit synchronously with the stale
  // draft, so the revert must be decided here, not via setDraft.
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!focused) {
      setDraft(toDraft(value));
    }
  }, [value, focused]);

  const formatted = formatNumber(numValue, typeOptions);

  if (readOnly) {
    return (
      <FieldShell>
        <span className={classes.fieldValueText}>{formatted}</span>
      </FieldShell>
    );
  }

  const commit = () => {
    setFocused(false);
    onEditingChange?.(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      setDraft(toDraft(value));
      return;
    }
    if (parseNumberDraft(draft) !== numValue) {
      onChange(parseNumberDraft(draft));
    }
  };

  return (
    <FieldShell cursor="text">
      <input
        aria-label={property.name}
        className={classes.fieldInput}
        inputMode="decimal"
        onBlur={commit}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || v === "-" || /^-?\d*\.?\d*$/.test(v)) {
            setDraft(v);
          }
        }}
        onFocus={() => {
          setDraft(toDraft(value));
          setFocused(true);
          onEditingChange?.(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            cancelRef.current = true;
            e.currentTarget.blur();
          }
        }}
        onPaste={(e) => {
          e.preventDefault();
          const el = e.currentTarget;
          const start = el.selectionStart ?? draft.length;
          const end = el.selectionEnd ?? draft.length;
          setDraft(
            draft.slice(0, start) +
              sanitizeNumberInput(e.clipboardData.getData("text")) +
              draft.slice(end)
          );
        }}
        type="text"
        value={focused ? draft : formatted}
      />
    </FieldShell>
  );
}
