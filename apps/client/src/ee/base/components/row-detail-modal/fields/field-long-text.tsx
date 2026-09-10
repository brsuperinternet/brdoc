import { Textarea } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { FieldProps, FieldShell } from "./detail-field";

const toText = (value: unknown) => (typeof value === "string" ? value : "");
const normalize = (s: string) => {
  const trimmed = s.trim();
  return trimmed.length ? trimmed : null;
};

export function FieldLongText({
  property,
  value,
  readOnly,
  onChange,
  onEditingChange,
}: FieldProps) {
  const text = toText(value);
  const [draft, setDraft] = useState(text);
  const [focused, setFocused] = useState(false);
  // Esc sets this; blur() then runs commit synchronously with the stale
  // draft, so the revert must be decided here, not via setDraft.
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!focused) {
      setDraft(text);
    }
  }, [text, focused]);

  const commit = () => {
    setFocused(false);
    onEditingChange?.(false);
    if (cancelRef.current) {
      cancelRef.current = false;
      setDraft(text);
      return;
    }
    if (normalize(draft) !== normalize(text)) {
      onChange(normalize(draft));
    }
  };

  if (readOnly) {
    return (
      <FieldShell alignTop>
        <span className={classes.fieldValueTextMultiline}>{text}</span>
      </FieldShell>
    );
  }

  return (
    <FieldShell alignTop cursor="text">
      <Textarea
        aria-label={property.name}
        autosize
        className={classes.fieldTextarea}
        classNames={{ input: classes.fieldTextareaInput }}
        maxLength={25_000}
        maxRows={16}
        minRows={3}
        onBlur={commit}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onFocus={() => {
          setFocused(true);
          onEditingChange?.(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            cancelRef.current = true;
            e.currentTarget.blur();
          } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        value={draft}
        variant="unstyled"
      />
    </FieldShell>
  );
}
