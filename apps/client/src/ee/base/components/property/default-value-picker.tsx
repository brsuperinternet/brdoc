import type { ComboboxItem } from "@mantine/core";
import { Group, MultiSelect, Select, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { Choice } from "@/ee/base/types/base.types";

type DefaultValuePickerProps = {
  choices: Choice[];
  value: string | string[] | null;
  multiple?: boolean;
  onChange: (value: string | string[] | null) => void;
  dropdownPortalTarget?: HTMLElement | null;
};

export function DefaultValuePicker({
  choices,
  value,
  multiple,
  onChange,
  dropdownPortalTarget,
}: DefaultValuePickerProps) {
  const { t } = useTranslation();
  const data = choices.map((c) => ({ label: c.name, value: c.id }));
  const comboboxProps = {
    portalProps: { target: dropdownPortalTarget ?? undefined },
  };

  const renderOption = ({
    option,
    checked,
  }: {
    option: ComboboxItem;
    checked?: boolean;
  }) => {
    const choice = choices.find((c) => c.id === option.value);
    const colors = choice ? choiceColor(choice.color) : undefined;
    return (
      <Group gap={6} justify="space-between" style={{ flex: 1 }} wrap="nowrap">
        <Group gap={6} wrap="nowrap">
          {colors && (
            <span
              style={{
                backgroundColor: colors.backgroundColor as string,
                border: `2px solid ${colors.color as string}`,
                borderRadius: "50%",
                flexShrink: 0,
                height: 10,
                width: 10,
              }}
            />
          )}
          <Text size="xs">{option.label}</Text>
        </Group>
        {checked && <IconCheck color="var(--mantine-color-dimmed)" size={14} />}
      </Group>
    );
  };

  if (multiple) {
    const selected = (
      Array.isArray(value) ? value : value ? [value] : []
    ).filter((id) => choices.some((c) => c.id === id));
    return (
      <MultiSelect
        clearable
        comboboxProps={comboboxProps}
        data={data}
        label={t("Default value")}
        onChange={(vals) => onChange(vals.length ? vals : null)}
        placeholder={selected.length ? undefined : t("None")}
        renderOption={renderOption}
        size="xs"
        value={selected}
      />
    );
  }

  const single =
    typeof value === "string" && choices.some((c) => c.id === value)
      ? value
      : null;
  return (
    <Select
      clearable
      comboboxProps={comboboxProps}
      data={data}
      label={t("Default value")}
      onChange={(val) => onChange(val)}
      placeholder={t("None")}
      renderOption={renderOption}
      size="xs"
      value={single}
    />
  );
}
