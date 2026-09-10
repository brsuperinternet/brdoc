import { sanitizeUrl } from "@docmost/editor-ext";
import { Tooltip } from "@mantine/core";
import { useEditableTextCell } from "@/ee/base/hooks/use-editable-text-cell";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBaseProperty } from "@/ee/base/types/base.types";

type CellUrlProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

const toDraft = (value: unknown) => (typeof value === "string" ? value : "");
const parse = (draft: string) => draft || null;

export function CellUrl({
  value,
  property,
  rowId,
  isEditing,
  onCommit,
  onCancel,
}: CellUrlProps) {
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
        placeholder="https://..."
        ref={inputRef}
        type="url"
        value={draft}
      />
    );
  }

  const displayValue = toDraft(value);
  if (!displayValue) {
    return <span className={cellClasses.emptyValue} />;
  }

  const safeHref = sanitizeUrl(displayValue);
  if (!safeHref) {
    return <span>{displayValue}</span>;
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
        className={cellClasses.urlLink}
        href={safeHref}
        onClick={(e) => e.stopPropagation()}
        rel="noopener noreferrer"
        target="_blank"
      >
        {displayValue}
      </a>
    </Tooltip>
  );
}
