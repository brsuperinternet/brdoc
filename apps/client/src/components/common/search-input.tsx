import { Group, TextInput } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconSearch } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export interface SearchInputProps {
  ariaLabel?: string;
  debounceDelay?: number;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  placeholder,
  ariaLabel,
  debounceDelay = 500,
  onSearch,
}: SearchInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebouncedValue(value, debounceDelay);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  return (
    <Group mb="sm">
      <TextInput
        aria-label={ariaLabel || placeholder || t("Search")}
        leftSection={<IconSearch size={16} />}
        onChange={(e) => setValue(e.currentTarget.value)}
        placeholder={placeholder || t("Search...")}
        size="sm"
        value={value}
      />
    </Group>
  );
}
