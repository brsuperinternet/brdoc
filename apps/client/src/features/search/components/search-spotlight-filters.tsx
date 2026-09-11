import { Button, Group, getDefaultZIndex, Menu, Text } from "@mantine/core";
import {
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconFileDescription,
  IconLetterCase,
  IconPlus,
  IconTag,
  IconUser,
} from "@tabler/icons-react";
import cx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RadioMenuItem } from "@/components/ui/radio-menu-item";

import { CreatorFilterMenu } from "@/features/search/components/creator-filter-menu";
import { SpaceFilterMenu } from "@/features/space/components/space-filter-menu";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import { LabelFilterMenu } from "./label-filter-menu";
import classes from "./search-spotlight-filters.module.css";

interface SearchSpotlightFiltersProps {
  onFiltersChange?: (filters: any) => void;
  spaceId?: string;
}

export function SearchSpotlightFilters({
  onFiltersChange,
  spaceId,
}: SearchSpotlightFiltersProps) {
  const { t } = useTranslation();

  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(
    spaceId || null
  );
  const [contentType, setContentType] = useState<string | null>("page");
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(
    null
  );
  const [selectedCreatorName, setSelectedCreatorName] = useState<string | null>(
    null
  );
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [titleOnly, setTitleOnly] = useState(false);
  const [openedFilter, setOpenedFilter] = useState<string | null>(null);
  const [visibleFilters, setVisibleFilters] = useState<string[]>([]);

  const { data: spacesData } = useGetSpacesQuery({ limit: 100 });
  const selectedSpaceData = selectedSpaceId
    ? spacesData?.items.find((space) => space.id === selectedSpaceId)
    : null;

  const contentTypeOptions = [{ label: t("Pages"), value: "page" }];

  useEffect(() => {
    onFiltersChange?.({
      contentType,
      creatorId: selectedCreatorId,
      labelIds: selectedLabelIds,
      spaceId: selectedSpaceId,
      titleOnly,
    });
  }, [
    selectedSpaceId,
    contentType,
    selectedCreatorId,
    selectedLabelIds,
    titleOnly,
    onFiltersChange,
  ]);

  const handleSpaceSelect = (spaceId: string | null) => {
    setSelectedSpaceId(spaceId);
  };

  const handleCreatorSelect = (user: { id: string; name: string } | null) => {
    setSelectedCreatorId(user?.id ?? null);
    setSelectedCreatorName(user?.name ?? null);
  };

  const handleLabelsSelect = (labelIds: string[]) => {
    setSelectedLabelIds(labelIds);
  };

  const handleChangeContentType = (value: string) => {
    setContentType(value);

    if (value === "attachment") {
      setSelectedLabelIds([]);
    }
  };

  const onDemandFilters = [
    { available: true, icon: IconUser, key: "creator", label: t("Created by") },
    {
      available: contentType !== "attachment",
      icon: IconTag,
      key: "labels",
      label: t("Labels"),
    },
  ];

  const isFilterVisible = (key: string) => {
    if (openedFilter === key) {
      return true;
    }
    if (key === "creator") {
      return !!selectedCreatorId;
    }
    if (key === "labels") {
      return contentType !== "attachment" && selectedLabelIds.length > 0;
    }
    return false;
  };

  const orderedVisibleFilters = visibleFilters.filter(isFilterVisible);
  const addableFilters = onDemandFilters.filter(
    (filter) => filter.available && !isFilterVisible(filter.key)
  );

  const revealFilter = (key: string) => {
    setVisibleFilters((prev) => [...prev.filter((k) => k !== key), key]);
    setOpenedFilter(key);
  };

  return (
    <div className={classes.filtersContainer}>
      <SpaceFilterMenu
        onChange={handleSpaceSelect}
        position="bottom-start"
        value={selectedSpaceId}
        width={250}
        zIndex={getDefaultZIndex("max")}
      >
        <Button
          className={classes.filterButton}
          color="gray"
          fw={500}
          leftSection={<IconBuilding size={16} />}
          rightSection={<IconChevronDown size={14} />}
          size="sm"
          variant="subtle"
        >
          {selectedSpaceId
            ? `${t("Space")}: ${selectedSpaceData?.name || t("Unknown")}`
            : `${t("Space")}: ${t("All spaces")}`}
        </Button>
      </SpaceFilterMenu>

      <Menu
        position="bottom-start"
        shadow="md"
        width={220}
        zIndex={getDefaultZIndex("max")}
      >
        <Menu.Target>
          <Button
            className={classes.filterButton}
            color="gray"
            fw={500}
            leftSection={<IconFileDescription size={16} />}
            rightSection={<IconChevronDown size={14} />}
            size="sm"
            variant="subtle"
          >
            {contentType
              ? `${t("Type")}: ${contentTypeOptions.find((opt) => opt.value === contentType)?.label || t(contentType === "page" ? "Pages" : "Attachments")}`
              : t("Type")}
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {contentTypeOptions.map((option) => (
            <Menu.Item
              aria-checked={contentType === option.value}
              component={RadioMenuItem}
              key={option.value}
              onClick={() =>
                contentType !== option.value &&
                handleChangeContentType(option.value)
              }
            >
              <Group flex="1" gap="xs">
                <div>
                  <Text size="sm">{option.label}</Text>
                </div>
                {contentType === option.value && (
                  <IconCheck aria-hidden size={20} />
                )}
              </Group>
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>

      <Button
        aria-pressed={titleOnly}
        className={cx(
          classes.filterButton,
          titleOnly && classes.filterButtonActive
        )}
        color={titleOnly ? "blue" : "gray"}
        fw={500}
        leftSection={<IconLetterCase size={16} />}
        onClick={() => setTitleOnly(!titleOnly)}
        radius="xl"
        size="sm"
        variant={titleOnly ? "light" : "subtle"}
      >
        {t("Title only")}
      </Button>

      {orderedVisibleFilters.map((filterKey) => {
        if (filterKey === "creator") {
          return (
            <CreatorFilterMenu
              key="creator"
              onChange={handleCreatorSelect}
              onOpenChange={(opened) =>
                setOpenedFilter(opened ? "creator" : null)
              }
              opened={openedFilter === "creator"}
              position="bottom-start"
              value={selectedCreatorId}
              width={250}
              zIndex={getDefaultZIndex("max")}
            >
              <Button
                className={classes.filterButton}
                color="gray"
                fw={500}
                leftSection={<IconUser size={16} />}
                rightSection={<IconChevronDown size={14} />}
                size="sm"
                variant="subtle"
              >
                {selectedCreatorId
                  ? `${t("Created by")}: ${selectedCreatorName || t("Unknown")}`
                  : `${t("Created by")}: ${t("Anyone")}`}
              </Button>
            </CreatorFilterMenu>
          );
        }

        if (filterKey === "labels") {
          return (
            <LabelFilterMenu
              key="labels"
              onChange={handleLabelsSelect}
              onOpenChange={(opened) =>
                setOpenedFilter(opened ? "labels" : null)
              }
              opened={openedFilter === "labels"}
              position="bottom-start"
              value={selectedLabelIds}
              width={250}
              zIndex={getDefaultZIndex("max")}
            >
              <Button
                className={classes.filterButton}
                color="gray"
                fw={500}
                leftSection={<IconTag size={16} />}
                rightSection={<IconChevronDown size={14} />}
                size="sm"
                variant="subtle"
              >
                {selectedLabelIds.length > 0
                  ? `${t("Labels")} (${selectedLabelIds.length})`
                  : t("Labels")}
              </Button>
            </LabelFilterMenu>
          );
        }

        return null;
      })}

      {addableFilters.length > 0 && (
        <Menu
          position="bottom-end"
          shadow="md"
          width={200}
          zIndex={getDefaultZIndex("max")}
        >
          <Menu.Target>
            <Button
              className={classes.filterButton}
              color="gray"
              fw={500}
              leftSection={<IconPlus size={16} />}
              size="sm"
              style={{ marginLeft: "auto" }}
              variant="subtle"
            >
              {t("Filter")}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {addableFilters.map((filter) => (
              <Menu.Item
                key={filter.key}
                leftSection={<filter.icon size={16} />}
                onClick={() => revealFilter(filter.key)}
              >
                {filter.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
    </div>
  );
}
