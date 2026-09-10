import { Checkbox } from "@mantine/core";
import { IconLock } from "@tabler/icons-react";
import clsx from "clsx";
import { forwardRef } from "react";
import { getDescriptor } from "@/ee/base/property-types/property-type.registry";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { IBaseProperty, IBaseRow } from "@/ee/base/types/base.types";
import { FieldCellAdapter } from "./field-cell-adapter";
import { FieldChoice } from "./field-choice";
import { FieldDate } from "./field-date";
import { FieldLongText } from "./field-long-text";
import { FieldNumber } from "./field-number";
import { FieldText } from "./field-text";

export type FieldProps = {
  property: IBaseProperty;
  value: unknown;
  rowId: string;
  readOnly: boolean;
  onChange: (value: unknown) => void;
  onEditingChange?: (editing: boolean) => void;
};

type FieldShellProps = {
  /** Visual + cursor treatment: text caret, pointer (opens a picker), or none. */
  cursor?: "text" | "pointer" | "default";
  /** Popover open — keeps the focus ring while focus is in the portal. */
  active?: boolean;
  locked?: boolean;
  alignTop?: boolean;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>;

// forwardRef is load-bearing: Popover.Target anchors its dropdown through a
// ref injected into this element; without it the picker renders at (0,0).
export const FieldShell = forwardRef<HTMLDivElement, FieldShellProps>(
  function FieldShell(
    {
      cursor = "default",
      active,
      locked,
      alignTop,
      className,
      children,
      ...rest
    },
    ref
  ) {
    return (
      <div
        className={clsx(
          classes.fieldShell,
          cursor === "text" && classes.fieldShellText,
          cursor === "pointer" && classes.fieldShellPointer,
          active && classes.fieldShellActive,
          locked && classes.fieldShellLocked,
          alignTop && classes.fieldShellTop,
          className
        )}
        ref={ref}
        {...rest}
      >
        {locked && <IconLock className={classes.fieldLockIcon} size={13} />}
        {children}
      </div>
    );
  }
);

function FieldCheckbox({ value, readOnly, onChange }: FieldProps) {
  const checked = value === true;
  return (
    <FieldShell>
      <Checkbox
        checked={checked}
        disabled={readOnly}
        onChange={() => onChange(!checked)}
        size="sm"
      />
    </FieldShell>
  );
}

function FieldReadonlyCell({ property, value, rowId }: FieldProps) {
  const CellComponent = getDescriptor(property.type)?.cellComponent;
  return (
    <FieldShell locked>
      <div className={classes.fieldCellDisplay}>
        {CellComponent && (
          <CellComponent
            isEditing={false}
            onCancel={() => {}}
            onCommit={() => {}}
            onValueChange={() => {}}
            property={property}
            readOnly
            rowId={rowId}
            value={value}
          />
        )}
      </div>
    </FieldShell>
  );
}

type DetailFieldProps = {
  property: IBaseProperty;
  row: IBaseRow;
  readOnly: boolean;
  onUpdate: (propertyId: string, value: unknown) => void;
  onEditingChange: (editing: boolean) => void;
};

export function DetailField({
  property,
  row,
  readOnly,
  onUpdate,
  onEditingChange,
}: DetailFieldProps) {
  const descriptor = getDescriptor(property.type);
  const value = descriptor?.systemAccessor
    ? descriptor.systemAccessor(row)
    : (row.cells ?? {})[property.id];
  const fieldProps: FieldProps = {
    onChange: (next: unknown) => onUpdate(property.id, next),
    onEditingChange,
    property,
    readOnly,
    rowId: row.id,
    value,
  };

  switch (property.type) {
    case "text":
    case "url":
    case "email":
      return <FieldText {...fieldProps} />;
    case "longText":
      return <FieldLongText {...fieldProps} />;
    case "number":
      return <FieldNumber {...fieldProps} />;
    case "checkbox":
      return <FieldCheckbox {...fieldProps} />;
    case "date":
      return <FieldDate {...fieldProps} />;
    case "select":
    case "status":
    case "multiSelect":
      return <FieldChoice {...fieldProps} />;
    case "person":
    case "file":
    case "page":
      return <FieldCellAdapter {...fieldProps} />;
    default:
      // createdAt, lastEditedAt, lastEditedBy, formula and future types.
      return <FieldReadonlyCell {...fieldProps} />;
  }
}
