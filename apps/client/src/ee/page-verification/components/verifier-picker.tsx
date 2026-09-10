import { Select } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query";
import {
  renderUserSelectOption,
  toUserOptions,
  UserOptionItem,
} from "./user-option";

type VerifierPickerProps = {
  excludeIds: string[];
  disabled?: boolean;
  onSelect: (user: UserOptionItem) => void;
  placeholder?: string;
};

export function VerifierPicker({
  excludeIds,
  disabled,
  onSelect,
  placeholder,
}: VerifierPickerProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchValue, 300);

  const { data: suggestion } = useSearchSuggestionsQuery({
    includeGroups: false,
    includeUsers: true,
    preload: true,
    query: debouncedQuery,
  });

  const excludeSet = new Set(excludeIds);
  const options = toUserOptions(suggestion?.users).filter(
    (u) => !excludeSet.has(u.value)
  );

  const handleChange = (userId: string | null) => {
    if (!userId) {
      return;
    }
    const picked = options.find((u) => u.value === userId);
    if (!picked) {
      return;
    }
    onSelect(picked);
    setSearchValue("");
  };

  return (
    <Select
      data={options}
      disabled={disabled}
      filter={({ options }) => options}
      nothingFoundMessage={t("No user found")}
      onChange={handleChange}
      onSearchChange={setSearchValue}
      placeholder={placeholder ?? t("Add verifier")}
      renderOption={renderUserSelectOption}
      searchable
      searchValue={searchValue}
      value={null}
      variant="filled"
    />
  );
}
