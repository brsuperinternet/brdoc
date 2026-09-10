import { Group, MultiSelect, MultiSelectProps, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconGroupCircle } from "@/components/icons/icon-people-circle.tsx";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IGroup } from "@/features/group/types/group.types.ts";
import { useSearchSuggestionsQuery } from "@/features/search/queries/search-query.ts";
import { IUser } from "@/features/user/types/user.types.ts";

interface MultiMemberSelectProps {
  onChange: (value: string[]) => void;
  value?: string[];
}

const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({
  option,
}) => (
  <Group gap="sm" wrap="nowrap">
    {option["type"] === "user" && (
      <CustomAvatar
        avatarUrl={option["avatarUrl"]}
        name={option.label}
        size={20}
      />
    )}
    {option["type"] === "group" && <IconGroupCircle />}
    <div>
      <Text lineClamp={1} size="sm">
        {option.label}
      </Text>
      {option["type"] === "user" && option["email"] && (
        <Text c="dimmed" lineClamp={1} size="xs">
          {option["email"]}
        </Text>
      )}
    </div>
  </Group>
);

export function MultiMemberSelect({ value, onChange }: MultiMemberSelectProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchValue, 500);
  const { data: suggestion, isLoading } = useSearchSuggestionsQuery({
    includeGroups: true,
    includeUsers: true,
    query: debouncedQuery,
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    if (suggestion) {
      // Extract user and group items
      const userItems = suggestion?.users.map((user: IUser) => ({
        avatarUrl: user.avatarUrl,
        email: user.email,
        label: user.name,
        type: "user",
        value: `user-${user.id}`,
      }));

      const groupItems = suggestion?.groups.map((group: IGroup) => ({
        label: group.name,
        type: "group",
        value: `group-${group.id}`,
      }));

      // Create fresh data structure based on current search results
      const newData = [];

      if (userItems && userItems.length > 0) {
        newData.push({
          group: t("Select a user"),
          items: userItems,
        });
      }

      if (groupItems && groupItems.length > 0) {
        newData.push({
          group: t("Select a group"),
          items: groupItems,
        });
      }

      setData(newData);
    }
  }, [suggestion, t]);

  return (
    <MultiSelect
      clearable
      data={data}
      filter={({ options }) => options}
      hidePickedOptions
      label={t("Add members")}
      maxDropdownHeight={300}
      maxValues={50}
      onChange={onChange}
      onSearchChange={setSearchValue}
      placeholder={t("Search for users and groups")}
      renderOption={renderMultiSelectOption}
      searchable
      searchValue={searchValue}
      value={value}
      variant="filled"
    />
  );
}
