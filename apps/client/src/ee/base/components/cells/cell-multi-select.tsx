import { Popover, TextInput } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BadgeOverflowList } from "@/ee/base/components/cells/badge-overflow";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { useListKeyboardNav } from "@/ee/base/hooks/use-list-keyboard-nav";
import { useUpdatePropertyMutation } from "@/ee/base/queries/base-property-query";
import cellClasses from "@/ee/base/styles/cells.module.css";
import {
  Choice,
  IBaseProperty,
  SelectTypeOptions,
} from "@/ee/base/types/base.types";
import { generateBaseChoiceId } from "@/ee/base/utils/generate-base-id";

const CHOICE_COLORS = [
  "gray",
  "red",
  "pink",
  "grape",
  "violet",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
];

type NavItem = { kind: "choice"; choice: Choice } | { kind: "add" };

type CellMultiSelectProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onValueChange: (value: unknown) => void;
  onCancel: () => void;
};

export function CellMultiSelect({
  value,
  property,
  isEditing,
  onValueChange,
  onCancel,
}: CellMultiSelectProps) {
  const typeOptions = property.typeOptions as SelectTypeOptions | undefined;
  const choices = typeOptions?.choices ?? [];
  const selectedIds = Array.isArray(value) ? (value as string[]) : [];
  const selectedSet = new Set(selectedIds);

  const selectedChoices = choices.filter((c) => selectedSet.has(c.id));

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setSearch("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [isEditing]);

  const filteredChoices = (
    search
      ? choices.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        )
      : choices
  ).filter((c) => !selectedSet.has(c.id));

  const handleToggle = useCallback(
    (choice: Choice) => {
      const newIds = selectedSet.has(choice.id)
        ? selectedIds.filter((id) => id !== choice.id)
        : [...selectedIds, choice.id];
      onValueChange(newIds);
    },
    [selectedIds, selectedSet, onValueChange]
  );

  const updatePropertyMutation = useUpdatePropertyMutation();

  const trimmedSearch = search.trim();
  const hasExactMatch = useMemo(
    () =>
      trimmedSearch.length > 0 &&
      choices.some((c) => c.name.toLowerCase() === trimmedSearch.toLowerCase()),
    [choices, trimmedSearch]
  );
  const showAddOption = trimmedSearch.length > 0 && !hasExactMatch;

  const addOptionColor = useMemo(
    () => CHOICE_COLORS[choices.length % CHOICE_COLORS.length],
    [choices.length]
  );

  const navItems = useMemo<NavItem[]>(
    () => [
      ...filteredChoices.map((c) => ({ choice: c, kind: "choice" as const })),
      ...(showAddOption ? [{ kind: "add" as const }] : []),
    ],
    [filteredChoices, showAddOption]
  );

  const { activeIndex, setActiveIndex, handleNavKey, setOptionRef } =
    useListKeyboardNav(navItems.length, [search, isEditing, showAddOption]);

  const handleAddOption = useCallback(() => {
    if (!trimmedSearch) {
      return;
    }
    const newChoice: Choice = {
      color: addOptionColor,
      id: generateBaseChoiceId(),
      name: trimmedSearch,
    };
    const newChoices = [...choices, newChoice];
    updatePropertyMutation.mutate({
      pageId: property.pageId,
      propertyId: property.id,
      typeOptions: {
        ...typeOptions,
        choiceOrder: newChoices.map((c) => c.id),
        choices: newChoices,
      },
    });
    onValueChange([...selectedIds, newChoice.id]);
    setSearch("");
  }, [
    trimmedSearch,
    addOptionColor,
    choices,
    typeOptions,
    property,
    updatePropertyMutation,
    selectedIds,
    onValueChange,
  ]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (handleNavKey(e)) {
        return;
      }
      if (e.key === "Enter") {
        if (activeIndex >= 0 && activeIndex < navItems.length) {
          e.preventDefault();
          const item = navItems[activeIndex];
          if (item.kind === "choice") {
            handleToggle(item.choice);
          } else {
            handleAddOption();
          }
          return;
        }
        if (showAddOption) {
          e.preventDefault();
          handleAddOption();
        }
      }
    },
    [
      onCancel,
      handleNavKey,
      activeIndex,
      navItems,
      handleToggle,
      handleAddOption,
      showAddOption,
    ]
  );

  if (isEditing) {
    const addOptionIdx = filteredChoices.length;
    return (
      <Popover
        closeOnClickOutside
        closeOnEscape
        onChange={(o) => {
          if (!o) {
            onCancel();
          }
        }}
        onClose={onCancel}
        opened
        position="bottom-start"
        trapFocus
        width={220}
      >
        <Popover.Target>
          <div className={cellClasses.popoverTarget}>
            <BadgeList choices={selectedChoices} />
          </div>
        </Popover.Target>
        <Popover.Dropdown p={4}>
          {selectedChoices.length > 0 && (
            <div className={cellClasses.personTagArea}>
              {selectedChoices.map((choice) => (
                <span
                  className={cellClasses.badge}
                  key={choice.id}
                  style={choiceColor(choice.color)}
                >
                  {choice.name}
                  <button
                    className={`${cellClasses.personTagRemove} ${cellClasses.badgeRemoveBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(choice);
                    }}
                    type="button"
                  >
                    <IconX size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <TextInput
            data-autofocus
            mb={4}
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            ref={searchRef}
            size="xs"
            value={search}
          />
          <div className={cellClasses.selectDropdown}>
            {filteredChoices.map((choice, idx) => (
              <div
                className={clsx(
                  cellClasses.selectOption,
                  idx === activeIndex && cellClasses.selectOptionKeyboardActive
                )}
                key={choice.id}
                onClick={() => handleToggle(choice)}
                onMouseEnter={() => setActiveIndex(idx)}
                ref={setOptionRef(idx)}
              >
                <span
                  className={cellClasses.badge}
                  style={choiceColor(choice.color)}
                >
                  {choice.name}
                </span>
              </div>
            ))}
            {showAddOption && (
              <div
                className={clsx(
                  cellClasses.addOptionRow,
                  addOptionIdx === activeIndex &&
                    cellClasses.selectOptionKeyboardActive
                )}
                onClick={handleAddOption}
                onMouseEnter={() => setActiveIndex(addOptionIdx)}
                ref={setOptionRef(addOptionIdx)}
              >
                <span className={cellClasses.addOptionLabel}>Add option:</span>
                <span
                  className={cellClasses.badge}
                  style={choiceColor(addOptionColor)}
                >
                  {trimmedSearch}
                </span>
              </div>
            )}
          </div>
        </Popover.Dropdown>
      </Popover>
    );
  }

  if (selectedChoices.length === 0) {
    return <span className={cellClasses.emptyValue} />;
  }

  return (
    <BadgeList
      choices={selectedChoices}
      tooltipLabel={selectedChoices.map((c) => c.name).join(", ")}
    />
  );
}

function BadgeList({
  choices,
  tooltipLabel,
}: {
  choices: Choice[];
  tooltipLabel?: string;
}) {
  const chips = choices.map((choice) => (
    <span
      className={cellClasses.badge}
      key={choice.id}
      style={choiceColor(choice.color)}
    >
      {choice.name}
    </span>
  ));
  return (
    <BadgeOverflowList
      chips={chips}
      measureKey={choices.map((c) => `${c.id}:${c.name}`).join("|")}
      tooltipLabel={tooltipLabel}
    />
  );
}
