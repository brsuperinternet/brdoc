import { Tooltip } from "@mantine/core";
import { useEditableTextCell } from "@/ee/base/hooks/use-editable-text-cell";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBaseProperty } from "@/ee/base/types/base.types";

type CellEmailProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

const toDraft = (value: unknown) => (typeof value === "string" ? value : "");
const parse = (draft: string) => draft || null;

export function CellEmail({
  value,
  property,
  rowId,
  isEditing,
  onCommit,
  onCancel,
}: CellEmailProps) {
  const { draft, setDraft, inputRef, handleKeyDown, handleBlur } =
    useEditableTextCell({
      isEditing,
      onCancel,
      onCommit,
      parse,
      propertyId: property.id,
      rowId,
      toDraft,
      value,
    });

  if (isEditing) {
    return (
      <input
        className={cellClasses.cellInput}
        onBlur={handleBlur}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="email@example.com"
        ref={inputRef}
        type="email"
        value={draft}
      />
    );
  }

  const displayValue = toDraft(value);
  if (!displayValue) {
    return <span className={cellClasses.emptyValue} />;
  }
  return (
    <Tooltip
      label={displayValue}
      maw={420}
      multiline
      openDelay={400}
      withinPortal
    >
      <a
        className={cellClasses.emailLink}
        href={`mailto:${displayValue}`}
        onClick={(e) => e.stopPropagation()}
      >
        {displayValue}
      </a>
    </Tooltip>
  );
}
