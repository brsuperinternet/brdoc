import { Group, Text, TextInput, UnstyledButton } from "@mantine/core";
import { IconCheck, IconSearch } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { propertyTypes } from "@/ee/base/property-types/property-type.registry";
import classes from "@/ee/base/styles/cells.module.css";
import { BasePropertyType } from "@/ee/base/types/base.types";

type PropertyTypePickerProps = {
  onSelect: (type: BasePropertyType) => void;
  currentType?: BasePropertyType;
  excludeTypes?: Set<BasePropertyType>;
  showSearch?: boolean;
};

export function PropertyTypePicker({
  onSelect,
  currentType,
  excludeTypes,
  showSearch,
}: PropertyTypePickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [showSearch]);

  const types = propertyTypes
    .filter(({ type }) => !excludeTypes?.has(type))
    .filter(
      ({ labelKey }) =>
        !search || t(labelKey).toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      {showSearch && (
        <TextInput
          leftSection={<IconSearch size={14} />}
          mb={4}
          mt="sm"
          mx="sm"
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder={t("Find a property type")}
          ref={searchRef}
          size="xs"
          value={search}
        />
      )}
      {types.map(({ type, icon: Icon, labelKey }) => (
        <UnstyledButton
          className={classes.menuItem}
          key={type}
          onClick={() => onSelect(type)}
          style={{
            fontWeight: type === currentType ? 600 : 400,
          }}
        >
          <Group gap={8} style={{ flex: 1 }} wrap="nowrap">
            <Icon size={14} />
            <Text size="sm">{t(labelKey)}</Text>
          </Group>
          {type === currentType && <IconCheck size={14} />}
        </UnstyledButton>
      ))}
    </>
  );
}
