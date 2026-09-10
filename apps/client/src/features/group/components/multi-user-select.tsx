import { Group, MultiSelect, MultiSelectProps, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { IUser } from "@/features/user/types/user.types.ts";
import { useWorkspaceMembersQuery } from "@/features/workspace/queries/workspace-query.ts";

interface MultiUserSelectProps {
  label?: string;
  onChange: (value: string[]) => void;
}

const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({
  option,
}) => (
  <Group gap="sm" wrap="nowrap">
    <CustomAvatar
      avatarUrl={option?.["avatarUrl"]}
      name={option.label}
      size={36}
    />
    <div>
      <Text lineClamp={1} size="sm">
        {option.label}
      </Text>
      <Text opacity={0.5} size="xs">
        {option?.["email"]}
      </Text>
    </div>
  </Group>
);

export function MultiUserSelect({ onChange, label }: MultiUserSelectProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchValue, 500);
  const { data: users, isLoading } = useWorkspaceMembersQuery({
    limit: 50,
    query: debouncedQuery,
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    if (users) {
      const usersData = users?.items.map((user: IUser) => ({
        avatarUrl: user.avatarUrl,
        email: user.email,
        label: user.name,
        value: user.id,
      }));

      // Filter out existing users by their ids
      const filteredUsersData = usersData.filter(
        (user) =>
          !data.find((existingUser) => existingUser.value === user.value)
      );

      // Combine existing data with new search data
      setData((prevData) => [...prevData, ...filteredUsersData]);
    }
  }, [users]);

  return (
    <MultiSelect
      clearable
      data={data}
      hidePickedOptions
      label={label || t("Add members")}
      maxDropdownHeight={300}
      maxValues={50}
      nothingFoundMessage={t("No user found")}
      onChange={onChange}
      onSearchChange={setSearchValue}
      placeholder={t("Search for users")}
      renderOption={renderMultiSelectOption}
      searchable
      searchValue={searchValue}
      variant="filled"
    />
  );
}
