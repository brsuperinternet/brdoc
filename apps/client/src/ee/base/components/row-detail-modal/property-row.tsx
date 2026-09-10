import { Popover } from "@mantine/core";
import { IconChevronDown } from "@tabler/icons-react";
import clsx from "clsx";
import { useCallback, useEffect, useRef } from "react";
import { PropertyMenuContent } from "@/ee/base/components/property/property-menu";
import { useBaseEditable } from "@/ee/base/context/base-editable";
import { getDescriptor } from "@/ee/base/property-types/property-type.registry";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { IBaseProperty, IBaseRow } from "@/ee/base/types/base.types";
import { DetailField } from "./fields/detail-field";

type PropertyRowProps = {
  property: IBaseProperty;
  row: IBaseRow;
  pageId: string;
  menuOpened: boolean;
  onMenuOpenChange: (opened: boolean) => void;
  onMenuDirtyChange: (dirty: boolean) => void;
  onUpdate: (propertyId: string, value: unknown) => void;
  onEditingChange?: (editing: boolean) => void;
  autoFocusValue?: boolean;
  onAutoFocused?: () => void;
};

export function PropertyRow({
  property,
  row,
  pageId,
  menuOpened,
  onMenuOpenChange,
  onMenuDirtyChange,
  onUpdate,
  onEditingChange,
  autoFocusValue,
  onAutoFocused,
}: PropertyRowProps) {
  const canEdit = useBaseEditable();
  const rowRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!autoFocusValue || focusedRef.current) {
      return;
    }
    focusedRef.current = true;
    const el = rowRef.current;
    if (el) {
      el.scrollIntoView({ block: "nearest" });
      el.querySelector<HTMLElement>("input, textarea")?.focus();
    }
    onAutoFocused?.();
  }, [autoFocusValue, onAutoFocused]);

  const handleLabelClick = useCallback(() => {
    onMenuOpenChange(!menuOpened);
  }, [menuOpened, onMenuOpenChange]);

  const handleMenuClose = useCallback(() => {
    onMenuOpenChange(false);
  }, [onMenuOpenChange]);

  const Icon = getDescriptor(property.type)?.icon;

  const label = (
    <>
      {Icon && <Icon className={classes.propertyLabelIcon} size={15} />}
      <span className={classes.propertyLabelText}>{property.name}</span>
    </>
  );

  return (
    <div className={classes.propertyRow} ref={rowRef}>
      {canEdit ? (
        <Popover
          closeOnClickOutside={false}
          closeOnEscape={false}
          hideDetached={false}
          opened={menuOpened}
          position="bottom-start"
          shadow="md"
          width={260}
          withinPortal
        >
          <Popover.Target>
            <button
              className={clsx(
                classes.propertyLabel,
                classes.propertyLabelButton,
                {
                  [classes.propertyLabelActive]: menuOpened,
                }
              )}
              data-property-menu-target
              onClick={handleLabelClick}
              type="button"
            >
              {label}
              <IconChevronDown
                className={classes.propertyLabelChevron}
                size={13}
              />
            </button>
          </Popover.Target>
          <Popover.Dropdown
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            p={0}
          >
            <PropertyMenuContent
              onClose={handleMenuClose}
              onDirtyChange={onMenuDirtyChange}
              opened={menuOpened}
              pageId={pageId}
              property={property}
            />
          </Popover.Dropdown>
        </Popover>
      ) : (
        <div className={classes.propertyLabel}>{label}</div>
      )}
      <DetailField
        onEditingChange={onEditingChange}
        onUpdate={onUpdate}
        property={property}
        readOnly={!canEdit}
        row={row}
      />
    </div>
  );
}
