import { Group, MultiSelect, MultiSelectProps, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconUsersGroup } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetGroupsQuery } from "@/features/group/queries/group-query.ts";
import { IGroup } from "@/features/group/types/group.types.ts";

interface MultiGroupSelectProps {
  description?: string;
  label?: string;
  mt?: string;
  onChange: (value: string[]) => void;
}

const renderMultiSelectOption: MultiSelectProps["renderOption"] = ({
  option,
}) => (
  <Group gap="sm">
    {<IconUsersGroup size={18} />}
    <div>
      <Text size="sm">{option.label}</Text>
    </div>
  </Group>
);

export function MultiGroupSelect({
  onChange,
  label,
  description,
  mt,
}: MultiGroupSelectProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchValue, 500);
  const { data: groups, isLoading } = useGetGroupsQuery({
    limit: 25,
    query: debouncedQuery,
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    if (groups) {
      const groupsData = groups?.items
        .filter((group: IGroup) => group.name.toLowerCase() !== "everyone")
        .map((group: IGroup) => ({
          label: group.name,
          value: group.id,
        }));

      // Filter out existing groups by their ids
      const filteredGroupData = groupsData.filter(
        (group) =>
          !data.find((existingGroup) => existingGroup.value === group.value)
      );

      // Combine existing data with new search data
      setData((prevData) => [...prevData, ...filteredGroupData]);
    }
  }, [groups]);

  return (
    <MultiSelect
      clearable
      data={data}
      description={description}
      hidePickedOptions
      label={label || t("Add groups")}
      maxDropdownHeight={300}
      maxValues={50}
      mt={mt}
      nothingFoundMessage={t("No group found")}
      onChange={onChange}
      onSearchChange={setSearchValue}
      placeholder={t("Search for groups")}
      renderOption={renderMultiSelectOption}
      searchable
      searchValue={searchValue}
      variant="filled"
    />
  );
}
