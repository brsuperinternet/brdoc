import { Menu, Modal, Skeleton, Text, Tooltip } from "@mantine/core";
import { useWindowEvent } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconChevronDown,
  IconChevronUp,
  IconDotsVertical,
  IconLink,
  IconLock,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { propertyMenuCloseRequestAtomFamily } from "@/ee/base/atoms/base-atoms";
import { CreatePropertyPopover } from "@/ee/base/components/property/create-property-popover";
import { useBaseEditable } from "@/ee/base/context/base-editable";
import { getDescriptor } from "@/ee/base/property-types/property-type.registry";
import {
  useBaseRowQuery,
  useDeleteRowMutation,
  useUpdateRowMutation,
} from "@/ee/base/queries/base-row-query";
import classes from "@/ee/base/styles/row-detail-modal.module.css";
import { IBase, IBaseRow } from "@/ee/base/types/base.types";
import { useClipboard } from "@/hooks/use-clipboard";
import { PropertyRow } from "./property-row";
import { RowDetailTitle } from "./row-detail-title";

type RowDetailModalProps = {
  base: IBase;
  rows: IBaseRow[];
  openRowId: string | null;
  onClose: () => void;
  onNavigate: (rowId: string) => void;
};

export function RowDetailModal({
  base,
  rows,
  openRowId,
  onClose,
  onNavigate,
}: RowDetailModalProps) {
  const { t } = useTranslation();
  const canEdit = useBaseEditable();
  const updateRowMutation = useUpdateRowMutation();
  const deleteRowMutation = useDeleteRowMutation();
  const clipboard = useClipboard({ timeout: 500 });

  const rowIndex = useMemo(
    () => (openRowId ? rows.findIndex((r) => r.id === openRowId) : -1),
    [openRowId, rows]
  );
  const rowFromList = rowIndex >= 0 ? rows[rowIndex] : undefined;
  // Deep links (?row=) can target rows outside the loaded pages or filtered
  // out of the active view — fetch by id instead of closing. Close only
  // when the server confirms the row is gone.
  const rowQuery = useBaseRowQuery(base.id, openRowId ?? undefined, {
    enabled: !!openRowId && !rowFromList,
  });
  const row = rowFromList ?? rowQuery.data;
  const primaryProperty = useMemo(
    () => base.properties.find((p) => p.isPrimary),
    [base.properties]
  );

  const rowMissing = !!openRowId && !rowFromList && rowQuery.isError;
  useEffect(() => {
    if (rowMissing) {
      onClose();
    }
  }, [rowMissing, onClose]);

  const isSaving = updateRowMutation.isPending;
  const opened = !!openRowId;
  const [editingField, setEditingField] = useState(false);

  // One field menu open at a time, mirroring the grid header's semantics.
  // The shared closeRequest atom asks an open dirty PropertyMenuContent to
  // run its discard-confirm flow instead of being torn down mid-edit.
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newPropertyId, setNewPropertyId] = useState<string | null>(null);
  const clearNewProperty = useCallback(() => setNewPropertyId(null), []);
  const menuDirtyRef = useRef(false);
  const [closeRequest, setCloseRequest] = useAtom(
    propertyMenuCloseRequestAtomFamily(base.id)
  ) as unknown as [number, (val: number) => void];

  useEffect(() => {
    setOpenMenuId(null);
    menuDirtyRef.current = false;
    setEditingField(false);
  }, [openRowId]);

  const handleMenuDirtyChange = useCallback((dirty: boolean) => {
    menuDirtyRef.current = dirty;
  }, []);

  const requestMenuClose = useCallback(() => {
    if (menuDirtyRef.current) {
      setCloseRequest(closeRequest + 1);
    } else {
      setOpenMenuId(null);
    }
  }, [closeRequest, setCloseRequest]);

  const handleMenuOpenChange = useCallback(
    (propertyId: string, nextOpened: boolean) => {
      if (!nextOpened) {
        setOpenMenuId(null);
        menuDirtyRef.current = false;
        return;
      }
      if (openMenuId && openMenuId !== propertyId && menuDirtyRef.current) {
        setCloseRequest(closeRequest + 1);
        return;
      }
      setOpenMenuId(propertyId);
    },
    [openMenuId, closeRequest, setCloseRequest]
  );

  useEffect(() => {
    if (!openMenuId) {
      return;
    }
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-position]")) {
        return;
      }
      if (target.closest("[data-property-menu-target]")) {
        return;
      }
      requestMenuClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId, requestMenuClose]);

  const hasPrev = rowIndex > 0;
  const hasNext = rowIndex >= 0 && rowIndex < rows.length - 1;
  const navigate = useCallback(
    (delta: number) => {
      if (rowIndex === -1) {
        return;
      }
      const next = rows[rowIndex + delta];
      if (next) {
        onNavigate(next.id);
      }
    },
    [rows, rowIndex, onNavigate]
  );

  const handleCopyLink = useCallback(() => {
    clipboard.copy(window.location.href);
    notifications.show({ message: t("Link copied") });
  }, [clipboard, t]);

  const handleDeleteRecord = useCallback(() => {
    if (!row) {
      return;
    }
    const rowId = row.id;
    modals.openConfirmModal({
      centered: true,
      children: <Text size="sm">{t("This action cannot be undone.")}</Text>,
      confirmProps: { color: "red" },
      labels: { cancel: t("Cancel"), confirm: t("Delete") },
      onConfirm: () => {
        deleteRowMutation.mutate({ pageId: base.id, rowId });
        onClose();
      },
      title: t("Delete record?"),
    });
  }, [row, base.id, deleteRowMutation, onClose, t]);

  // Mantine's closeOnEscape runs a capture-phase window listener that fires
  // before inner popovers and inputs see the key, so we manage Esc ourselves
  // and yield to: nested dialogs (delete confirm), open popovers
  // ([data-position]) and editable elements. Arrows step records under the
  // same yield rules. Mantine puts role="dialog" and our content class on
  // the same element, which distinguishes this modal from nested ones.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const isEscape = event.key === "Escape";
      const isArrow = event.key === "ArrowUp" || event.key === "ArrowDown";
      if (!(isEscape || isArrow) || event.isComposing || !opened) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (target) {
        const dialog = target.closest('[role="dialog"]');
        if (dialog && !dialog.classList.contains(classes.modalContent)) {
          return;
        }
        if (
          target.closest("[data-position]") ||
          target.matches("input, textarea, select, [contenteditable='true']")
        ) {
          return;
        }
      }
      if (isEscape) {
        if (openMenuId) {
          requestMenuClose();
          return;
        }
        onClose();
        return;
      }
      if (openMenuId) {
        return;
      }
      event.preventDefault();
      navigate(event.key === "ArrowUp" ? -1 : 1);
    },
    [opened, openMenuId, requestMenuClose, onClose, navigate]
  );
  useWindowEvent("keydown", handleKeyDown, { capture: true });

  return (
    <Modal
      centered
      classNames={{ content: classes.modalContent }}
      closeOnClickOutside={!openMenuId}
      closeOnEscape={false}
      onClose={onClose}
      opened={opened}
      padding={0}
      radius="md"
      removeScrollProps={{ noIsolation: true }}
      size="lg"
      title={null}
      withCloseButton={false}
    >
      {row ? (
        <>
          <div className={classes.topBar}>
            <div className={classes.topBarGroup}>
              <Tooltip label={t("Previous record")} openDelay={400}>
                <button
                  aria-label={t("Previous record")}
                  className={classes.iconButton}
                  disabled={!hasPrev}
                  onClick={() => navigate(-1)}
                  type="button"
                >
                  <IconChevronUp size={16} />
                </button>
              </Tooltip>
              <Tooltip label={t("Next record")} openDelay={400}>
                <button
                  aria-label={t("Next record")}
                  className={classes.iconButton}
                  disabled={!hasNext}
                  onClick={() => navigate(1)}
                  type="button"
                >
                  <IconChevronDown size={16} />
                </button>
              </Tooltip>
            </div>
            <div className={classes.topBarGroup}>
              <Menu position="bottom-end" shadow="md" withinPortal>
                <Menu.Target>
                  <button
                    aria-label={t("Record actions")}
                    className={classes.iconButton}
                    type="button"
                  >
                    <IconDotsVertical size={16} />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconLink size={14} />}
                    onClick={handleCopyLink}
                  >
                    {t("Copy link")}
                  </Menu.Item>
                  {canEdit && (
                    <>
                      <Menu.Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={handleDeleteRecord}
                      >
                        {t("Delete record")}
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
              <button
                aria-label={t("Close")}
                className={classes.iconButton}
                onClick={onClose}
                type="button"
              >
                <IconX size={16} />
              </button>
            </div>
          </div>

          <RowDetailTitle
            canEdit={canEdit}
            onCommit={(value) => {
              if (!primaryProperty) {
                return;
              }
              updateRowMutation.mutate({
                cells: { [primaryProperty.id]: value },
                pageId: base.id,
                rowId: row.id,
              });
            }}
            onEditingChange={setEditingField}
            primaryProperty={primaryProperty}
            row={row}
          />

          <div className={classes.body}>
            <div className={classes.propertyList}>
              {base.properties
                .filter((p) => !p.isPrimary)
                .map((property) => (
                  <PropertyRow
                    autoFocusValue={property.id === newPropertyId}
                    key={property.id}
                    menuOpened={openMenuId === property.id}
                    onAutoFocused={clearNewProperty}
                    onEditingChange={setEditingField}
                    onMenuDirtyChange={handleMenuDirtyChange}
                    onMenuOpenChange={(nextOpened) =>
                      handleMenuOpenChange(property.id, nextOpened)
                    }
                    onUpdate={(propertyId, value) => {
                      updateRowMutation.mutate({
                        cells: { [propertyId]: value },
                        pageId: base.id,
                        rowId: row.id,
                      });
                    }}
                    pageId={base.id}
                    property={property}
                    row={row}
                  />
                ))}
            </div>
            {canEdit && (
              <CreatePropertyPopover
                onPropertyCreated={(p) => setNewPropertyId(p.id)}
                pageId={base.id}
                properties={base.properties}
                renderTarget={(open) => (
                  <button
                    className={classes.addPropertyRow}
                    onClick={open}
                    type="button"
                  >
                    <span className={classes.addPropertyLabel}>
                      <IconPlus size={15} />
                      {t("Add property")}
                    </span>
                  </button>
                )}
              />
            )}
          </div>

          <footer className={classes.footer}>
            <div className={classes.footerStatus}>
              {canEdit ? (
                isSaving ? (
                  <>
                    <span className={classes.savingDot} />
                    <span>{t("Saving…")}</span>
                  </>
                ) : null
              ) : (
                <span className={classes.lockedHint}>
                  <IconLock size={12} />
                  {t("Read-only")}
                </span>
              )}
            </div>
            <div className={classes.kbdHint}>
              {editingField ? (
                <>
                  <span className={classes.kbdGroup}>
                    <kbd className={classes.kbd}>Ctrl/Cmd</kbd>
                    <span className={classes.kbdPlus}>+</span>
                    <kbd className={classes.kbd}>Enter</kbd>
                    <span>{t("to save")}</span>
                  </span>

                  <span className={classes.kbdSeparator} />

                  <span className={classes.kbdGroup}>
                    <kbd className={classes.kbd}>Esc</kbd>
                    <span>{t("to reset")}</span>
                  </span>
                </>
              ) : (
                <>
                  {rowIndex >= 0 && rows.length > 1 && (
                    <>
                      <kbd className={classes.kbd}>↑</kbd>
                      <kbd className={classes.kbd}>↓</kbd>
                      <span>{t("to navigate")}</span>
                      <span className={classes.kbdSeparator} />
                    </>
                  )}
                  <>
                    <kbd className={classes.kbd}>Esc</kbd>
                    <span>{t("to close")}</span>
                  </>
                </>
              )}
            </div>
          </footer>
        </>
      ) : (
        <RowDetailSkeleton base={base} />
      )}
    </Modal>
  );
}

/** Hydration state for deep-linked rows: the schema is already loaded, so
 *  render the real labels and shimmer only the unknown values. Matching the
 *  final layout avoids a size jump when the row arrives. */
function RowDetailSkeleton({ base }: { base: IBase }) {
  return (
    <>
      <div className={classes.topBar}>
        <div className={classes.topBarGroup}>
          <Skeleton height={28} radius={6} width={28} />
          <Skeleton height={28} radius={6} width={28} />
        </div>
        <div className={classes.topBarGroup}>
          <Skeleton height={28} radius={6} width={28} />
          <Skeleton height={28} radius={6} width={28} />
        </div>
      </div>
      <header className={classes.header}>
        <Skeleton height={30} radius={8} width="45%" />
        <div className={classes.metaRow}>
          <Skeleton height={12} radius={4} width={150} />
        </div>
      </header>
      <div className={classes.body}>
        <div className={classes.propertyList}>
          {base.properties
            .filter((p) => !p.isPrimary)
            .map((property) => {
              const Icon = getDescriptor(property.type)?.icon;
              return (
                <div className={classes.propertyRow} key={property.id}>
                  <div className={classes.propertyLabel}>
                    {Icon && (
                      <Icon className={classes.propertyLabelIcon} size={15} />
                    )}
                    <span className={classes.propertyLabelText}>
                      {property.name}
                    </span>
                  </div>
                  <Skeleton
                    height={property.type === "longText" ? 82 : 34}
                    radius={7}
                    style={{ flex: 1 }}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
}
