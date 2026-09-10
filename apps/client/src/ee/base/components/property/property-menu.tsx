import {
  ActionIcon,
  Button,
  Divider,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconChevronRight,
  IconMathFunction,
  IconPencil,
  IconSettings,
  IconTrash,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { propertyMenuCloseRequestAtomFamily } from "@/ee/base/atoms/base-atoms";
import {
  defaultTypeOptionsFor,
  isSystemPropertyType,
  propertyTypes,
} from "@/ee/base/property-types/property-type.registry";
import {
  useDeletePropertyMutation,
  useUpdatePropertyMutation,
} from "@/ee/base/queries/base-property-query";
import cellClasses from "@/ee/base/styles/cells.module.css";
import classes from "@/ee/base/styles/property.module.css";
import {
  BasePropertyType,
  IBaseProperty,
  SelectTypeOptions,
  TypeOptions,
} from "@/ee/base/types/base.types";
import {
  conversionWarning,
  isLossyConversion,
  NON_USER_TARGET_TYPES,
} from "./conversion-warning";
import { PropertyOptions } from "./property-options";
import { PropertyTypePicker } from "./property-type-picker";

type PropertyMenuContentProps = {
  property: IBaseProperty;
  opened: boolean;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onEditFormula?: () => void;
  pageId: string;
  initialPanel?: "main" | "options";
};

type MenuPanel =
  | "main"
  | "rename"
  | "options"
  | "changeType"
  | "confirmTypeChange"
  | "confirmDelete"
  | "confirmDiscard";

const CHOICE_TYPES = new Set<BasePropertyType>([
  "select",
  "multiSelect",
  "status",
]);

function typeOptionsForConversion(
  source: IBaseProperty,
  target: BasePropertyType
): TypeOptions {
  if (!(CHOICE_TYPES.has(source.type) && CHOICE_TYPES.has(target))) {
    return defaultTypeOptionsFor(target);
  }
  const opts = source.typeOptions as SelectTypeOptions | undefined;
  const choices = opts?.choices ?? [];
  const choiceOrder = opts?.choiceOrder?.length
    ? opts.choiceOrder
    : choices.map((c) => c.id);
  const carried: SelectTypeOptions = { choiceOrder, choices };
  if (target === "status") {
    carried.defaultValue = choices[0]?.id ?? null;
  }
  return carried;
}

export function PropertyMenuContent({
  property,
  opened,
  onClose,
  onDirtyChange,
  onEditFormula,
  pageId,
  initialPanel,
}: PropertyMenuContentProps) {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<MenuPanel>(initialPanel ?? "main");
  const [renameValue, setRenameValue] = useState(property.name);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [optionsDirty, setOptionsDirty] = useState(false);
  // Portal target for nested Select dropdowns to avoid triggering closeOnClickOutside.
  const [optionsAnchor, setOptionsAnchor] = useState<HTMLDivElement | null>(
    null
  );
  const [pendingTargetType, setPendingTargetType] =
    useState<BasePropertyType | null>(null);
  const pendingActionRef = useRef<"back" | "close" | null>(null);
  const sourcePanelRef = useRef<"rename" | "options" | null>(null);
  const [closeRequest] = useAtom(
    propertyMenuCloseRequestAtomFamily(pageId)
  ) as unknown as [number];
  const closeRequestRef = useRef(closeRequest);

  const renameDirty = renameValue !== property.name;

  const updatePropertyMutation = useUpdatePropertyMutation();
  const deletePropertyMutation = useDeletePropertyMutation();

  useEffect(() => {
    if (opened) {
      setPanel(initialPanel ?? "main");
      setRenameValue(property.name);
      setOptionsDirty(false);
      setPendingTargetType(null);
    }
  }, [opened, property.name, initialPanel]);

  useEffect(() => {
    if (panel === "rename") {
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  }, [panel]);

  const handleOptionsDirtyChange = useCallback((dirty: boolean) => {
    setOptionsDirty(dirty);
  }, []);

  useEffect(() => {
    const dirty =
      (panel === "rename" && renameDirty) ||
      (panel === "options" && optionsDirty);
    onDirtyChange?.(dirty);
  }, [panel, renameDirty, optionsDirty, onDirtyChange]);

  const commitRename = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== property.name) {
      updatePropertyMutation.mutate({
        name: trimmed,
        pageId: property.pageId,
        propertyId: property.id,
      });
    }
  }, [renameValue, property, updatePropertyMutation]);

  const handleRenameAndClose = useCallback(() => {
    commitRename();
    onClose();
  }, [commitRename, onClose]);

  const requestClose = useCallback(() => {
    if (panel === "rename" && renameDirty) {
      sourcePanelRef.current = "rename";
      pendingActionRef.current = "close";
      setPanel("confirmDiscard");
    } else if (panel === "options" && optionsDirty) {
      sourcePanelRef.current = "options";
      pendingActionRef.current = "close";
      setPanel("confirmDiscard");
    } else {
      onClose();
    }
  }, [panel, renameDirty, optionsDirty, onClose]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        e.preventDefault();
        handleRenameAndClose();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    },
    [handleRenameAndClose, requestClose]
  );

  const handleOptionsUpdate = useCallback(
    (typeOptions: Record<string, unknown>) => {
      updatePropertyMutation.mutate({
        pageId: property.pageId,
        propertyId: property.id,
        typeOptions,
      });
      setOptionsDirty(false);
    },
    [property, updatePropertyMutation]
  );

  const handleTypeSelect = useCallback(
    (type: BasePropertyType) => {
      if (type === property.type) {
        onClose();
        return;
      }
      setPendingTargetType(type);
      setPanel("confirmTypeChange");
    },
    [property.type, onClose]
  );

  const handleApplyTypeChange = useCallback(() => {
    if (!pendingTargetType) {
      return;
    }
    updatePropertyMutation.mutate({
      pageId: property.pageId,
      propertyId: property.id,
      type: pendingTargetType,
      typeOptions: typeOptionsForConversion(property, pendingTargetType),
    });
    onClose();
  }, [pendingTargetType, property, updatePropertyMutation, onClose]);

  const handleDelete = useCallback(() => {
    deletePropertyMutation.mutate({
      pageId: property.pageId,
      propertyId: property.id,
    });
    onClose();
  }, [property, deletePropertyMutation, onClose]);

  const handleOptionsBack = useCallback(() => {
    if (optionsDirty) {
      sourcePanelRef.current = "options";
      pendingActionRef.current = "back";
      setPanel("confirmDiscard");
    } else {
      setPanel("main");
    }
  }, [optionsDirty]);

  useEffect(() => {
    if (closeRequest !== closeRequestRef.current) {
      closeRequestRef.current = closeRequest;
      if (opened) {
        requestClose();
      }
    }
  }, [closeRequest, opened, requestClose]);

  const handleConfirmDiscard = useCallback(() => {
    setOptionsDirty(false);
    setRenameValue(property.name);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    sourcePanelRef.current = null;
    if (action === "back") {
      setPanel("main");
    } else {
      onClose();
    }
  }, [property.name, onClose]);

  const handleCancelDiscard = useCallback(() => {
    const source = sourcePanelRef.current ?? "options";
    pendingActionRef.current = null;
    sourcePanelRef.current = null;
    setPanel(source);
  }, []);

  return (
    <>
      {panel === "main" && (
        <MainPanel
          onChangeType={() => setPanel("changeType")}
          onDelete={() => setPanel("confirmDelete")}
          onEditFormula={onEditFormula}
          onOptions={() => setPanel("options")}
          onRename={() => setPanel("rename")}
          property={property}
        />
      )}
      {panel === "rename" && (
        <Stack gap="xs" p="sm">
          <Text c="dimmed" fw={600} size="xs">
            {t("Rename property")}
          </Text>
          <TextInput
            onChange={(e) => setRenameValue(e.currentTarget.value)}
            onKeyDown={handleRenameKeyDown}
            ref={renameInputRef}
            size="xs"
            value={renameValue}
          />
          <Divider />
          <Group gap="xs" justify="flex-end">
            <Button onClick={requestClose} size="xs" variant="default">
              {t("Cancel")}
            </Button>
            <Button
              disabled={
                !renameValue.trim() || renameValue.trim() === property.name
              }
              onClick={handleRenameAndClose}
              size="xs"
            >
              {t("Save")}
            </Button>
          </Group>
        </Stack>
      )}
      {panel === "changeType" && (
        <Stack gap={0} p={4}>
          <Group gap="xs" px="sm" py={6}>
            <ActionIcon
              color="gray"
              onClick={() => setPanel("main")}
              size="xs"
              variant="subtle"
            >
              <IconChevronRight className={classes.chevronBack} size={14} />
            </ActionIcon>
            <Text c="dimmed" fw={600} size="xs">
              {t("Change type")}
            </Text>
          </Group>
          <ScrollArea.Autosize mah={300} offsetScrollbars scrollbarSize={6}>
            <PropertyTypePicker
              currentType={property.type}
              excludeTypes={NON_USER_TARGET_TYPES}
              onSelect={handleTypeSelect}
              showSearch
            />
          </ScrollArea.Autosize>
        </Stack>
      )}
      {panel === "confirmTypeChange" && pendingTargetType && (
        <Stack gap="xs" p="sm">
          <Text fw={600} size="sm">
            {t("Change type to {{label}}?", {
              label: t(
                propertyTypes.find((pt) => pt.type === pendingTargetType)
                  ?.labelKey ?? pendingTargetType
              ),
            })}
          </Text>
          <Text c="dimmed" size="xs">
            {t(conversionWarning(property.type, pendingTargetType))}
          </Text>
          <Group gap="xs" justify="flex-end">
            <Button
              onClick={() => setPanel("main")}
              size="xs"
              variant="default"
            >
              {t("Cancel")}
            </Button>
            <Button
              color={
                isLossyConversion(property.type, pendingTargetType)
                  ? "red"
                  : undefined
              }
              onClick={handleApplyTypeChange}
              size="xs"
            >
              {t("Apply")}
            </Button>
          </Group>
        </Stack>
      )}
      {(panel === "options" || panel === "confirmDiscard") && (
        <Stack
          gap="xs"
          p="sm"
          ref={setOptionsAnchor}
          style={panel === "confirmDiscard" ? { display: "none" } : undefined}
        >
          <Group gap="xs">
            <ActionIcon
              color="gray"
              onClick={handleOptionsBack}
              size="xs"
              variant="subtle"
            >
              <IconChevronRight className={classes.chevronBack} size={14} />
            </ActionIcon>
            <Text c="dimmed" fw={600} size="xs">
              {t("Property options")}
            </Text>
          </Group>
          <ScrollArea.Autosize mah={400} offsetScrollbars scrollbarSize={6}>
            <PropertyOptions
              dropdownPortalTarget={optionsAnchor}
              onClose={onClose}
              onDirtyChange={handleOptionsDirtyChange}
              onUpdate={handleOptionsUpdate}
              property={property}
            />
          </ScrollArea.Autosize>
        </Stack>
      )}
      {panel === "confirmDelete" && (
        <Stack gap="xs" p="sm">
          <Text fw={600} size="sm">
            {t("Delete property")}
          </Text>
          <Text c="dimmed" size="xs">
            {t("Are you sure you want to delete")} <b>{property.name}</b>?{" "}
            {t("All data in this column will be lost.")}
          </Text>
          <Group gap="xs" justify="flex-end">
            <Button
              onClick={() => setPanel("main")}
              size="xs"
              variant="default"
            >
              {t("Cancel")}
            </Button>
            <Button color="red" onClick={handleDelete} size="xs">
              {t("Delete")}
            </Button>
          </Group>
        </Stack>
      )}
      {panel === "confirmDiscard" && (
        <Stack gap="xs" p="sm">
          <Text fw={600} size="sm">
            {t("Unsaved changes")}
          </Text>
          <Text c="dimmed" size="xs">
            {t("You have unsaved changes. Do you want to discard them?")}
          </Text>
          <Group gap="xs" justify="flex-end">
            <Button onClick={handleCancelDiscard} size="xs" variant="default">
              {t("Keep editing")}
            </Button>
            <Button color="red" onClick={handleConfirmDiscard} size="xs">
              {t("Discard")}
            </Button>
          </Group>
        </Stack>
      )}
    </>
  );
}

PropertyMenuContent.displayName = "PropertyMenuContent";

export function MenuItem({
  icon,
  label,
  rightIcon,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  rightIcon?: React.ReactNode;
  color?: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      className={cellClasses.menuItem}
      onClick={onClick}
      style={{ color: color ? `var(--mantine-color-${color}-6)` : undefined }}
    >
      <Group gap={8} style={{ flex: 1 }} wrap="nowrap">
        {icon}
        <Text size="sm">{label}</Text>
      </Group>
      {rightIcon}
    </UnstyledButton>
  );
}

function MainPanel({
  property,
  onRename,
  onChangeType,
  onOptions,
  onDelete,
  onEditFormula,
}: {
  property: IBaseProperty;
  onRename: () => void;
  onChangeType: () => void;
  onOptions: () => void;
  onDelete: () => void;
  onEditFormula?: () => void;
}) {
  const { t } = useTranslation();

  const isSystem = isSystemPropertyType(property.type);
  const isPending = property.pendingType != null;

  const hasOptions =
    !(isSystem || isPending) &&
    (property.type === "select" ||
      property.type === "multiSelect" ||
      property.type === "status" ||
      property.type === "number" ||
      property.type === "date" ||
      property.type === "text" ||
      property.type === "longText" ||
      property.type === "checkbox" ||
      property.type === "url" ||
      property.type === "email");

  const typeDef = propertyTypes.find((pt) => pt.type === property.type);
  const TypeIcon = typeDef?.icon;

  return (
    <Stack gap={0} p={4}>
      <MenuItem
        icon={<IconPencil size={14} />}
        label={t("Rename")}
        onClick={onRename}
      />
      {property.type === "formula" && !isPending && onEditFormula && (
        <MenuItem
          icon={<IconMathFunction size={14} />}
          label={t("Edit formula")}
          onClick={onEditFormula}
        />
      )}
      {isPending && (
        <Group gap={8} px="sm" py={8}>
          <Loader size={12} />
          <Text c="dimmed" size="sm">
            {t("Converting…")}
          </Text>
        </Group>
      )}
      {!(isSystem || isPending || property.isPrimary) && (
        <UnstyledButton className={cellClasses.menuItem} onClick={onChangeType}>
          <Group gap={8} style={{ flex: 1 }} wrap="nowrap">
            {TypeIcon ? <TypeIcon size={14} /> : null}
            <Text size="sm">
              {typeDef ? t(typeDef.labelKey) : property.type}
            </Text>
          </Group>
          <IconChevronRight size={14} />
        </UnstyledButton>
      )}
      {hasOptions && (
        <MenuItem
          icon={<IconSettings size={14} />}
          label={t("Options")}
          onClick={onOptions}
          rightIcon={<IconChevronRight size={14} />}
        />
      )}
      {!(property.isPrimary || isPending) && (
        <>
          <Divider my={4} />
          <MenuItem
            color="red"
            icon={<IconTrash size={14} />}
            label={t("Delete property")}
            onClick={onDelete}
          />
        </>
      )}
    </Stack>
  );
}
