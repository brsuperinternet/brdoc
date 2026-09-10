import {
  Button,
  Divider,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FilterPersonInput } from "@/ee/base/components/views/filter-person-input";
import {
  CURRENCIES,
  DEFAULT_CURRENCY_CODE,
} from "@/ee/base/constants/currencies";
import {
  Choice,
  DateTypeOptions,
  IBaseProperty,
  NumberTypeOptions,
  PersonTypeOptions,
  SelectTypeOptions,
} from "@/ee/base/types/base.types";
import { ChoiceEditor } from "./choice-editor";

type PropertyOptionsProps = {
  property: IBaseProperty;
  onUpdate: (typeOptions: Record<string, unknown>) => void;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  hideButtons?: boolean;
  // Portal target for nested Select dropdowns; must be inside the host popover, outside ScrollArea.
  dropdownPortalTarget?: HTMLElement | null;
};

export function PropertyOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
  dropdownPortalTarget,
}: PropertyOptionsProps) {
  const { t } = useTranslation();

  switch (property.type) {
    case "select":
    case "multiSelect":
      return (
        <SelectOptions
          dropdownPortalTarget={dropdownPortalTarget}
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    case "status":
      return (
        <StatusOptions
          dropdownPortalTarget={dropdownPortalTarget}
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    case "number":
      return (
        <NumberOptions
          dropdownPortalTarget={dropdownPortalTarget}
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    case "date":
      return (
        <DateOptions
          dropdownPortalTarget={dropdownPortalTarget}
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    case "person":
      return (
        <PersonOptions
          dropdownPortalTarget={dropdownPortalTarget}
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    case "text":
    case "longText":
    case "url":
    case "email":
      return (
        <TextDefaultOptions
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    case "checkbox":
      return (
        <CheckboxOptions
          hideButtons={hideButtons}
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onUpdate={onUpdate}
          property={property}
        />
      );
    default:
      return (
        <Text c="dimmed" size="xs">
          {t("No options for this property type")}
        </Text>
      );
  }
}

type OptionEditorProps = {
  property: IBaseProperty;
  onUpdate: (typeOptions: Record<string, unknown>) => void;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  hideButtons?: boolean;
  dropdownPortalTarget?: HTMLElement | null;
};

const EMPTY_OPTIONS: Record<string, unknown> = {};

function optionsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key];
    const bv = b[key];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (av.length !== bv.length || av.some((v, i) => v !== bv[i])) {
        return false;
      }
    } else if (av !== bv) {
      return false;
    }
  }
  return true;
}

// Draft hook for non-choice option editors: live in create flow, staged in edit menu.
function useEditableTypeOptions(
  initialRaw: Record<string, unknown> | undefined,
  {
    onUpdate,
    onClose,
    onDirtyChange,
    hideButtons,
  }: {
    onUpdate: (opts: Record<string, unknown>) => void;
    onClose: () => void;
    onDirtyChange?: (dirty: boolean) => void;
    hideButtons?: boolean;
  }
) {
  const initial = initialRaw ?? EMPTY_OPTIONS;
  const [draft, setDraft] = useState<Record<string, unknown>>(initial);

  useEffect(() => {
    if (!hideButtons) {
      setDraft(initial);
    }
  }, [initial, hideButtons]);

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  useEffect(() => {
    if (hideButtons) {
      onUpdateRef.current(draft);
    }
  }, [hideButtons, draft]);

  const isDirty = useMemo(
    () => !optionsEqual(draft, initial),
    [draft, initial]
  );
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const update = useCallback(
    (patch: Record<string, unknown>) =>
      setDraft((prev) => ({ ...prev, ...patch })),
    []
  );
  const save = useCallback(() => {
    onUpdate(draft);
    onClose();
  }, [draft, onUpdate, onClose]);
  const cancel = useCallback(() => {
    setDraft(initial);
    onDirtyChange?.(false);
    onClose();
  }, [initial, onClose, onDirtyChange]);

  return { cancel, draft, isDirty, save, update };
}

function OptionsFooter({
  isDirty,
  onCancel,
  onSave,
}: {
  isDirty: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Divider />
      <Group gap="xs" justify="flex-end">
        <Button onClick={onCancel} size="xs" variant="default">
          {t("Cancel")}
        </Button>
        <Button disabled={!isDirty} onClick={onSave} size="xs">
          {t("Save")}
        </Button>
      </Group>
    </>
  );
}

function SelectOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
  dropdownPortalTarget,
}: OptionEditorProps) {
  const options = property.typeOptions as SelectTypeOptions | undefined;
  const choices = useMemo(() => options?.choices ?? [], [options?.choices]);

  const handleSave = useCallback(
    (newChoices: Choice[], defaultValue: string | string[] | null) => {
      onUpdate({
        ...property.typeOptions,
        choiceOrder: newChoices.map((c) => c.id),
        choices: newChoices,
        defaultValue,
      });
    },
    [property.typeOptions, onUpdate]
  );

  return (
    <ChoiceEditor
      dropdownPortalTarget={dropdownPortalTarget}
      hideButtons={hideButtons}
      initialChoices={choices}
      initialDefaultValue={options?.defaultValue ?? null}
      multiDefault={property.type === "multiSelect"}
      onClose={onClose}
      onDirtyChange={onDirtyChange}
      onSave={handleSave}
      showCategories={false}
    />
  );
}

function StatusOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
  dropdownPortalTarget,
}: OptionEditorProps) {
  const options = property.typeOptions as SelectTypeOptions | undefined;
  const choices = useMemo(() => options?.choices ?? [], [options?.choices]);

  const handleSave = useCallback(
    (newChoices: Choice[], defaultValue: string | string[] | null) => {
      onUpdate({
        ...property.typeOptions,
        choiceOrder: newChoices.map((c) => c.id),
        choices: newChoices,
        defaultValue,
      });
    },
    [property.typeOptions, onUpdate]
  );

  return (
    <ChoiceEditor
      dropdownPortalTarget={dropdownPortalTarget}
      hideButtons={hideButtons}
      initialChoices={choices}
      initialDefaultValue={options?.defaultValue ?? null}
      onClose={onClose}
      onDirtyChange={onDirtyChange}
      onSave={handleSave}
      showCategories
    />
  );
}

function NumberOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
  dropdownPortalTarget,
}: OptionEditorProps) {
  const { t } = useTranslation();
  const { draft, update, isDirty, save, cancel } = useEditableTypeOptions(
    property.typeOptions as Record<string, unknown> | undefined,
    { hideButtons, onClose, onDirtyChange, onUpdate }
  );
  const options = draft as NumberTypeOptions;

  return (
    <Stack gap="xs">
      <Select
        allowDeselect={false}
        checkIconPosition="right"
        comboboxProps={{
          portalProps: { target: dropdownPortalTarget ?? undefined },
        }}
        data={[
          { label: t("Number"), value: "plain" },
          { label: t("Currency"), value: "currency" },
          { label: t("Percent"), value: "percent" },
          { label: t("Progress"), value: "progress" },
        ]}
        label={t("Format")}
        onChange={(val) => update({ format: val ?? "plain" })}
        size="xs"
        value={options.format ?? "plain"}
      />
      {options.format === "currency" && (
        <Select
          allowDeselect={false}
          checkIconPosition="right"
          comboboxProps={{
            portalProps: { target: dropdownPortalTarget ?? undefined },
          }}
          data={CURRENCIES.map((c) => ({
            label: `${c.name} (${c.code})`,
            value: c.code,
          }))}
          label={t("Currency")}
          onChange={(val) =>
            update({ currencyCode: val ?? DEFAULT_CURRENCY_CODE })
          }
          size="xs"
          value={options.currencyCode ?? DEFAULT_CURRENCY_CODE}
        />
      )}
      <Select
        allowDeselect={false}
        checkIconPosition="right"
        comboboxProps={{
          portalProps: { target: dropdownPortalTarget ?? undefined },
        }}
        data={[
          { label: t("None"), value: "none" },
          { label: t("Local"), value: "local" },
          { label: t("Comma, period"), value: "comma_period" },
          { label: t("Period, comma"), value: "period_comma" },
          { label: t("Space, comma"), value: "space_comma" },
          { label: t("Space, period"), value: "space_period" },
        ]}
        label={t("Thousands and decimal separators")}
        onChange={(val) => update({ separators: val ?? "none" })}
        size="xs"
        value={options.separators ?? "none"}
      />
      <Select
        allowDeselect={false}
        checkIconPosition="right"
        comboboxProps={{
          portalProps: { target: dropdownPortalTarget ?? undefined },
        }}
        data={[
          { label: t("Default"), value: "default" },
          ...Array.from({ length: 9 }, (_, i) => ({
            label: String(i),
            value: String(i),
          })),
        ]}
        label={t("Decimal places")}
        onChange={(val) =>
          update({
            precision:
              val == null || val === "default" ? undefined : Number(val),
          })
        }
        size="xs"
        value={
          options.precision == null ? "default" : String(options.precision)
        }
      />
      <NumberInput
        label={t("Default value")}
        onChange={(val) =>
          update({ defaultValue: typeof val === "number" ? val : undefined })
        }
        placeholder={t("None")}
        size="xs"
        value={
          typeof options.defaultValue === "number" ? options.defaultValue : ""
        }
      />
      {!hideButtons && (
        <OptionsFooter isDirty={isDirty} onCancel={cancel} onSave={save} />
      )}
    </Stack>
  );
}

function DateOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
  dropdownPortalTarget,
}: OptionEditorProps) {
  const { t } = useTranslation();
  const { draft, update, isDirty, save, cancel } = useEditableTypeOptions(
    property.typeOptions as Record<string, unknown> | undefined,
    { hideButtons, onClose, onDirtyChange, onUpdate }
  );
  const options = draft as DateTypeOptions;

  return (
    <Stack gap="xs">
      <Switch
        checked={options.includeTime ?? false}
        label={t("Include time")}
        onChange={(e) => update({ includeTime: e.currentTarget.checked })}
        size="xs"
      />
      {options.includeTime && (
        <Select
          allowDeselect={false}
          checkIconPosition="right"
          comboboxProps={{
            portalProps: { target: dropdownPortalTarget ?? undefined },
          }}
          data={[
            { label: "12-hour", value: "12h" },
            { label: "24-hour", value: "24h" },
          ]}
          label={t("Time format")}
          onChange={(val) => update({ timeFormat: val ?? "12h" })}
          size="xs"
          value={options.timeFormat ?? "12h"}
        />
      )}
      {!hideButtons && (
        <OptionsFooter isDirty={isDirty} onCancel={cancel} onSave={save} />
      )}
    </Stack>
  );
}

function PersonOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
  dropdownPortalTarget,
}: OptionEditorProps) {
  const { t } = useTranslation();
  const { draft, update, isDirty, save, cancel } = useEditableTypeOptions(
    property.typeOptions as Record<string, unknown> | undefined,
    { hideButtons, onClose, onDirtyChange, onUpdate }
  );
  const options = draft as PersonTypeOptions;
  const allowMultiple = options.allowMultiple === true;

  const handleAllowMultipleChange = (toMulti: boolean) => {
    const dv = options.defaultValue;
    const ids = Array.isArray(dv) ? dv : dv ? [dv] : [];
    update({
      allowMultiple: toMulti,
      defaultValue: toMulti ? (ids.length ? ids : undefined) : ids[0],
    });
  };

  return (
    <Stack gap="xs">
      <Switch
        checked={allowMultiple}
        label={t("Allow multiple people")}
        onChange={(e) => handleAllowMultipleChange(e.currentTarget.checked)}
        size="xs"
      />
      <FilterPersonInput
        label={t("Default value")}
        multiple={allowMultiple}
        onChange={(value) =>
          update({ defaultValue: value as string | string[] | undefined })
        }
        pageId={property.pageId}
        placeholder={t("None")}
        portalTarget={dropdownPortalTarget}
        value={options.defaultValue ?? null}
        w="100%"
      />
      {!hideButtons && (
        <OptionsFooter isDirty={isDirty} onCancel={cancel} onSave={save} />
      )}
    </Stack>
  );
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TextDefaultOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
}: OptionEditorProps) {
  const { t } = useTranslation();
  const { draft, update, isDirty, save, cancel } = useEditableTypeOptions(
    property.typeOptions as Record<string, unknown> | undefined,
    { hideButtons, onClose, onDirtyChange, onUpdate }
  );
  const defaultValue =
    typeof draft.defaultValue === "string" ? draft.defaultValue : "";
  const defaultValueError =
    defaultValue && property.type === "url" && !URL.canParse(defaultValue)
      ? t("Please enter a valid url")
      : defaultValue &&
          property.type === "email" &&
          !EMAIL_FORMAT.test(defaultValue)
        ? t("Please enter a valid email")
        : null;

  return (
    <Stack gap="xs">
      {property.type === "longText" ? (
        <Textarea
          autosize
          label={t("Default value")}
          maxRows={6}
          minRows={2}
          onChange={(e) =>
            update({
              defaultValue: e.currentTarget.value.trim()
                ? e.currentTarget.value
                : undefined,
            })
          }
          placeholder={t("None")}
          size="xs"
          value={defaultValue}
        />
      ) : (
        <TextInput
          error={defaultValueError}
          label={t("Default value")}
          onChange={(e) =>
            update({
              defaultValue: e.currentTarget.value.trim()
                ? e.currentTarget.value
                : undefined,
            })
          }
          placeholder={
            property.type === "url"
              ? "https://example.com"
              : property.type === "email"
                ? "name@example.com"
                : t("None")
          }
          size="xs"
          value={defaultValue}
        />
      )}
      {!hideButtons && (
        <OptionsFooter
          isDirty={isDirty && !defaultValueError}
          onCancel={cancel}
          onSave={save}
        />
      )}
    </Stack>
  );
}

function CheckboxOptions({
  property,
  onUpdate,
  onClose,
  onDirtyChange,
  hideButtons,
}: OptionEditorProps) {
  const { t } = useTranslation();
  const { draft, update, isDirty, save, cancel } = useEditableTypeOptions(
    property.typeOptions as Record<string, unknown> | undefined,
    { hideButtons, onClose, onDirtyChange, onUpdate }
  );

  return (
    <Stack gap="xs">
      <Switch
        checked={draft.defaultValue === true}
        label={t("Checked by default")}
        onChange={(e) =>
          update({ defaultValue: e.currentTarget.checked ? true : undefined })
        }
        size="xs"
      />
      {!hideButtons && (
        <OptionsFooter isDirty={isDirty} onCancel={cancel} onSave={save} />
      )}
    </Stack>
  );
}
