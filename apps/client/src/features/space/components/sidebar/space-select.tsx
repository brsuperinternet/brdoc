import { Group, Select, SelectProps, Text } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { useGetSpacesQuery } from "@/features/space/queries/space-query.ts";
import { ISpace } from "../../types/space.types";

interface SpaceSelectProps {
  clearable?: boolean;
  label?: string;
  onChange: (value: ISpace) => void;
  opened?: boolean;
  value?: string;
  width?: number;
  withinPortal?: boolean;
}

const renderSelectOption: SelectProps["renderOption"] = ({ option }) => (
  <Group gap="sm" wrap="nowrap">
    <CustomAvatar
      avatarUrl={option?.["icon"]}
      color="initials"
      name={option.label}
      size={20}
      type={AvatarIconType.SPACE_ICON}
      variant="filled"
    />
    <div>
      <Text lineClamp={1} size="sm">
        {option.label}
      </Text>
    </div>
  </Group>
);

export function SpaceSelect({
  onChange,
  label,
  value,
  width,
  opened,
  clearable,
  withinPortal = true,
}: SpaceSelectProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedQuery] = useDebouncedValue(searchValue, 500);
  const { data: spaces, isLoading } = useGetSpacesQuery({
    limit: 50,
    query: debouncedQuery,
  });
  const [data, setData] = useState([]);
  const fetchedSpaces = useRef(new Map<string, ISpace>());

  useEffect(() => {
    if (spaces) {
      spaces.items.forEach((space: ISpace) =>
        fetchedSpaces.current.set(space.slug, space)
      );
      const spaceData = spaces?.items
        .filter((space: ISpace) => space.slug !== value)
        .map((space: ISpace) => ({
          icon: space.logo,
          label: space.name,
          value: space.slug,
        }));

      const filteredSpaceData = spaceData.filter(
        (space) =>
          !data.find((existingSpace) => existingSpace.value === space.value)
      );
      setData((prevData) => [...prevData, ...filteredSpaceData]);
    }
  }, [spaces]);

  return (
    <Select
      checkIconPosition="right"
      clearable={clearable}
      comboboxProps={{
        dropdownPadding: 0,
        keepMounted: false,
        position: "bottom",
        width,
        withinPortal,
      }}
      data={data}
      dropdownOpened={opened}
      limit={50}
      maxDropdownHeight={300}
      nothingFoundMessage={t("No space found")}
      onChange={(slug) => {
        // options accumulate across fetches; resolve against everything
        // fetched, not just the latest query result
        const space = slug && fetchedSpaces.current.get(slug);
        if (space) {
          onChange(space);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      onSearchChange={setSearchValue}
      //label={label || 'Select space'}
      placeholder={t("Search for spaces")}
      renderOption={renderSelectOption}
      searchable
      searchValue={searchValue}
      variant="filled"
    />
  );
}
