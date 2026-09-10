import {
  ActionIcon,
  Button,
  Group,
  MultiSelect,
  Popover,
  Select,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEscapeClose } from "@/ee/base/hooks/use-escape-close";
import {
  DEFAULT_FILTER_OPERATORS,
  getDescriptor,
} from "@/ee/base/property-types/property-type.registry";
import viewClasses from "@/ee/base/styles/views.module.css";
import {
  FilterCondition,
  FilterOperator,
  IBaseProperty,
  SelectTypeOptions,
} from "@/ee/base/types/base.types";
import { FilterDateInput } from "./filter-date-input";
import { FilterPersonInput } from "./filter-person-input";

const OPERATORS: { value: FilterOperator; labelKey: string }[] = [
  { labelKey: "Is", value: "eq" },
  { labelKey: "Is not", value: "neq" },
  { labelKey: "Contains", value: "contains" },
  { labelKey: "Doesn't contain", value: "ncontains" },
  { labelKey: "Is any of", value: "any" },
  { labelKey: "Is none of", value: "none" },
  { labelKey: "Is before", value: "before" },
  { labelKey: "Is after", value: "after" },
  { labelKey: "Is on or before", value: "onOrBefore" },
  { labelKey: "Is on or after", value: "onOrAfter" },
  { labelKey: "Is within", value: "isWithin" },
  { labelKey: "Greater than", value: "gt" },
  { labelKey: "Less than", value: "lt" },
  { labelKey: "Is empty", value: "isEmpty" },
  { labelKey: "Is not empty", value: "isNotEmpty" },
];

const NO_VALUE_OPERATORS: FilterOperator[] = ["isEmpty", "isNotEmpty"];

// Two operators share a value control only if they share a value class.
// Switching across classes (e.g. eq→any, exact-date→isWithin) must reset the
// stored value so a stale shape isn't sent to the engine.
function valueClass(op: FilterOperator, inputKind: string): string {
  if (NO_VALUE_OPERATORS.includes(op)) {
    return "none";
  }
  if (inputKind === "choices") {
    return op === "any" || op === "none" ? "choicesMulti" : "choicesSingle";
  }
  if (inputKind === "person") {
    return op === "any" || op === "none" ? "personMulti" : "personSingle";
  }
  if (inputKind === "date") {
    return op === "isWithin" ? "dateRange" : "dateInstant";
  }
  return "scalar";
}

function inputKindForProperty(property: IBaseProperty | undefined): string {
  return getDescriptor(property?.type ?? "")?.filterInput ?? "text";
}

function getOperatorsForType(type: string): FilterOperator[] {
  return (getDescriptor(type)?.filterOperators ??
    DEFAULT_FILTER_OPERATORS) as FilterOperator[];
}

function isMultiChoice(op: FilterCondition["op"]): boolean {
  return op === "any" || op === "none";
}

function FilterValueInput({
  condition,
  property,
  onChange,
  t,
}: {
  condition: FilterCondition;
  property: IBaseProperty | undefined;
  onChange: (value: unknown) => void;
  t: (key: string) => string;
}) {
  if (!property) {
    return (
      <TextInput
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={t("Value")}
        size="xs"
        value={(condition.value as string) ?? ""}
        w={100}
      />
    );
  }

  const kind = getDescriptor(property.type)?.filterInput ?? "text";

  if (kind === "person") {
    return (
      <FilterPersonInput
        multiple={condition.op === "any" || condition.op === "none"}
        onChange={onChange}
        pageId={property.pageId}
        placeholder={t("Select")}
        value={condition.value}
      />
    );
  }

  if (kind === "date") {
    return (
      <FilterDateInput
        onChange={onChange}
        op={condition.op}
        value={condition.value}
      />
    );
  }

  if (kind === "choices") {
    const typeOptions = property.typeOptions as SelectTypeOptions | undefined;
    const choices = typeOptions?.choices ?? [];
    const choiceOptions = choices.map((c) => ({ label: c.name, value: c.id }));

    if (isMultiChoice(condition.op)) {
      const { value } = condition;
      const selected = (
        Array.isArray(value) ? value : value ? [value] : []
      ).filter((id) => choices.some((c) => c.id === id));

      return (
        <MultiSelect
          comboboxProps={{ withinPortal: false }}
          data={choiceOptions}
          maxDropdownHeight={220}
          onChange={(values) => onChange(values)}
          size="xs"
          styles={{
            pillsList: {
              maxHeight: 70,
              overflowY: "auto",
            },
          }}
          value={selected}
          w={160}
        />
      );
    }

    return (
      <Select
        comboboxProps={{ withinPortal: false }}
        data={choiceOptions}
        onChange={(val) => onChange(val ?? "")}
        placeholder={t("Select")}
        size="xs"
        value={(condition.value as string) ?? null}
        w={120}
      />
    );
  }

  if (kind === "number") {
    return (
      <TextInput
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder={t("Value")}
        size="xs"
        type="number"
        value={(condition.value as string) ?? ""}
        w={100}
      />
    );
  }

  if (kind === "boolean") {
    return (
      <Select
        comboboxProps={{ withinPortal: false }}
        data={[
          { label: t("True"), value: "true" },
          { label: t("False"), value: "false" },
        ]}
        onChange={(val) => onChange(val ?? "")}
        size="xs"
        value={(condition.value as string) ?? null}
        w={100}
      />
    );
  }

  return (
    <TextInput
      onChange={(e) => onChange(e.currentTarget.value)}
      placeholder={t("Value")}
      size="xs"
      value={(condition.value as string) ?? ""}
      w={100}
    />
  );
}

type ViewFilterConfigProps = {
  opened: boolean;
  onClose: () => void;
  conditions: FilterCondition[];
  properties: IBaseProperty[];
  onChange: (conditions: FilterCondition[]) => void;
  children: React.ReactNode;
};

export function ViewFilterConfigPopover({
  opened,
  onClose,
  conditions,
  properties,
  onChange,
  children,
}: ViewFilterConfigProps) {
  const { t } = useTranslation();
  useEscapeClose(opened, onClose);

  const propertyOptions = properties.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  const [unSaved, setUnSaved] = useState(false);
  const [draft, setDraft] = useState<FilterCondition | null>(null);
  const [draftConditions, setDraftConditions] =
    useState<FilterCondition[]>(conditions);

  useEffect(() => {
    if (opened) {
      setDraftConditions(conditions);
      setDraft(null);
      setUnSaved(false);
    }
  }, [opened, conditions]);

  const handleStartDraft = useCallback(() => {
    const firstProperty = properties[0];
    if (!firstProperty) {
      return;
    }
    const validOperators = getOperatorsForType(firstProperty.type);
    const defaultOperator = validOperators.includes("contains")
      ? ("contains" as FilterOperator)
      : validOperators[0];
    setDraft({ op: defaultOperator, propertyId: firstProperty.id });
  }, [properties]);

  const handleSaveDraft = useCallback(() => {
    const nextConditions = draft
      ? [...draftConditions, draft]
      : draftConditions;

    onChange(nextConditions);
    setDraft(null);
    setUnSaved(false);
  }, [draft, draftConditions, onChange]);

  const handleCancelDraft = useCallback(() => {
    setDraftConditions(conditions);
    setDraft(null);
    setUnSaved(false);
  }, [conditions]);

  const handleDraftPropertyChange = useCallback(
    (propertyId: string | null) => {
      if (!(propertyId && draft)) {
        return;
      }
      const newProperty = properties.find((p) => p.id === propertyId);
      if (!newProperty) {
        setDraft({ ...draft, propertyId });
        return;
      }
      const validOperators = getOperatorsForType(newProperty.type);
      const currentOperatorValid = validOperators.includes(draft.op);
      const sameKind =
        inputKindForProperty(
          properties.find((p) => p.id === draft.propertyId)
        ) === inputKindForProperty(newProperty);
      setDraft({
        ...draft,
        op: currentOperatorValid ? draft.op : validOperators[0],
        propertyId,
        value: currentOperatorValid && sameKind ? draft.value : undefined,
      });
    },
    [draft, properties]
  );

  const handleDraftOperatorChange = useCallback(
    (operator: string | null) => {
      if (!(operator && draft)) {
        return;
      }
      const op = operator as FilterOperator;
      const kind = inputKindForProperty(
        properties.find((p) => p.id === draft.propertyId)
      );
      const keep = valueClass(draft.op, kind) === valueClass(op, kind);
      setDraft({ ...draft, op, value: keep ? draft.value : undefined });
    },
    [draft, properties]
  );

  const handleDraftValueChange = useCallback(
    (value: unknown) => {
      if (!draft) {
        return;
      }
      setDraft({ ...draft, value });
    },
    [draft]
  );

  const handleRemove = useCallback((index: number) => {
    setUnSaved(true);
    setDraftConditions((current) => current.filter((_, i) => i !== index));
  }, []);

  const handlePropertyChange = useCallback(
    (index: number, propertyId: string | null) => {
      if (!propertyId) {
        return;
      }
      const newProperty = properties.find((p) => p.id === propertyId);
      setUnSaved(true);
      setDraftConditions((current) =>
        current.map((f, i) => {
          if (i !== index) {
            return f;
          }
          if (newProperty) {
            const validOperators = getOperatorsForType(newProperty.type);
            const currentOperatorValid = validOperators.includes(f.op);
            const sameKind =
              inputKindForProperty(
                properties.find((p) => p.id === f.propertyId)
              ) === inputKindForProperty(newProperty);
            return {
              ...f,
              op: currentOperatorValid ? f.op : validOperators[0],
              propertyId,
              value: currentOperatorValid && sameKind ? f.value : undefined,
            };
          }
          return { ...f, propertyId };
        })
      );
    },
    [properties]
  );

  const handleOperatorChange = useCallback(
    (index: number, operator: string | null) => {
      if (!operator) {
        return;
      }
      const op = operator as FilterOperator;
      setUnSaved(true);
      setDraftConditions((current) =>
        current.map((f, i) => {
          if (i !== index) {
            return f;
          }
          const kind = inputKindForProperty(
            properties.find((p) => p.id === f.propertyId)
          );
          const keep = valueClass(f.op, kind) === valueClass(op, kind);
          return { ...f, op, value: keep ? f.value : undefined };
        })
      );
    },
    [properties]
  );

  const handleValueChange = useCallback((index: number, value: unknown) => {
    setUnSaved(true);
    setDraftConditions((current) =>
      current.map((f, i) => (i === index ? { ...f, value } : f))
    );
  }, []);

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape={false}
      onChange={(o) => {
        if (!o) {
          onClose();
        }
      }}
      onClose={onClose}
      opened={opened}
      position="bottom-end"
      shadow="md"
      trapFocus
      width={520}
      withinPortal
    >
      <Popover.Target>{children}</Popover.Target>
      <Popover.Dropdown
        onKeyDown={(e) => {
          // Mantine's built-in closeOnEscape uses a capture-phase handler that
          // would fire before a nested picker can consume Escape, closing the
          // whole panel. Handle it on bubble instead so an open inner picker
          // (which preventDefaults Escape) keeps the panel open.
          if (e.key === "Escape" && !e.defaultPrevented) {
            onClose();
          }
        }}
      >
        <Stack gap="xs">
          <Text c="dimmed" fw={600} size="xs">
            {t("Filter by")}
          </Text>

          {draftConditions.length === 0 && !draft && (
            <Text c="dimmed" size="xs">
              {t("No filters applied")}
            </Text>
          )}

          {draftConditions.map((condition, index) => {
            const needsValue = !NO_VALUE_OPERATORS.includes(condition.op);
            const property = properties.find(
              (p) => p.id === condition.propertyId
            );
            const validOperators = property
              ? getOperatorsForType(property.type)
              : OPERATORS.map((op) => op.value);
            const operatorOptions = OPERATORS.filter((op) =>
              validOperators.includes(op.value)
            ).map((op) => ({
              label: t(op.labelKey),
              value: op.value,
            }));

            return (
              <Group gap="xs" key={index} wrap="nowrap">
                <Select
                  comboboxProps={{ withinPortal: false }}
                  data={propertyOptions}
                  nothingFoundMessage={t("No match")}
                  onChange={(val) => handlePropertyChange(index, val)}
                  openOnFocus={false}
                  searchable
                  size="xs"
                  style={{ flex: 1 }}
                  value={condition.propertyId}
                />
                <Select
                  comboboxProps={{ withinPortal: false }}
                  data={operatorOptions}
                  nothingFoundMessage={t("No match")}
                  onChange={(val) => handleOperatorChange(index, val)}
                  openOnFocus={false}
                  searchable
                  size="xs"
                  value={condition.op}
                  w={130}
                />
                {needsValue && (
                  <FilterValueInput
                    condition={condition}
                    onChange={(val) => handleValueChange(index, val)}
                    property={property}
                    t={t}
                  />
                )}
                <ActionIcon
                  color="gray"
                  onClick={() => handleRemove(index)}
                  size="sm"
                  variant="subtle"
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            );
          })}

          {draft &&
            (() => {
              const needsValue = !NO_VALUE_OPERATORS.includes(draft.op);
              const property = properties.find(
                (p) => p.id === draft.propertyId
              );
              const validOperators = property
                ? getOperatorsForType(property.type)
                : OPERATORS.map((op) => op.value);
              const operatorOptions = OPERATORS.filter((op) =>
                validOperators.includes(op.value)
              ).map((op) => ({ label: t(op.labelKey), value: op.value }));

              return (
                <Stack gap={6}>
                  <Group gap="xs" wrap="nowrap">
                    <Select
                      comboboxProps={{ withinPortal: false }}
                      data={propertyOptions}
                      nothingFoundMessage={t("No match")}
                      onChange={handleDraftPropertyChange}
                      openOnFocus={false}
                      searchable
                      size="xs"
                      style={{ flex: 1 }}
                      value={draft.propertyId}
                    />
                    <Select
                      comboboxProps={{ withinPortal: false }}
                      data={operatorOptions}
                      nothingFoundMessage={t("No match")}
                      onChange={handleDraftOperatorChange}
                      openOnFocus={false}
                      searchable
                      size="xs"
                      value={draft.op}
                      w={130}
                    />
                    {needsValue && (
                      <FilterValueInput
                        condition={draft}
                        onChange={handleDraftValueChange}
                        property={property}
                        t={t}
                      />
                    )}
                  </Group>
                </Stack>
              );
            })()}

          {!draft && (
            <UnstyledButton
              className={viewClasses.addActionButton}
              onClick={handleStartDraft}
            >
              <IconPlus size={14} />
              {t("Add filter")}
            </UnstyledButton>
          )}
          <Group gap="xs" justify="flex-end">
            <Button
              disabled={!(draft || unSaved)}
              onClick={handleCancelDraft}
              size="xs"
              variant="default"
            >
              {t("Cancel")}
            </Button>

            <Button
              disabled={!(draft || unSaved)}
              onClick={handleSaveDraft}
              size="xs"
            >
              {t("Save")}
            </Button>
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
