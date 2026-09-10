import { Popover, TextInput } from "@mantine/core";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChoiceBadge } from "@/ee/base/components/cells/choice-badge";
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

type CellSelectProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

export function CellSelect({
  value,
  property,
  isEditing,
  onCommit,
  onCancel,
}: CellSelectProps) {
  const typeOptions = property.typeOptions as SelectTypeOptions | undefined;
  const choices = typeOptions?.choices ?? [];
  const selectedId = typeof value === "string" ? value : null;
  const selectedChoice = choices.find((c) => c.id === selectedId);

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setSearch("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [isEditing]);

  const filteredChoices = search
    ? choices.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : choices;

  const handleSelect = useCallback(
    (choice: Choice) => {
      onCommit(choice.id === selectedId ? null : choice.id);
    },
    [selectedId, onCommit]
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
    onCommit(newChoice.id);
  }, [
    trimmedSearch,
    addOptionColor,
    choices,
    typeOptions,
    property,
    updatePropertyMutation,
    onCommit,
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
            handleSelect(item.choice);
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
      handleSelect,
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
            {selectedChoice ? (
              <span
                className={cellClasses.badge}
                style={choiceColor(selectedChoice.color)}
              >
                {selectedChoice.name}
              </span>
            ) : (
              <span className={cellClasses.emptyValue} />
            )}
          </div>
        </Popover.Target>
        <Popover.Dropdown p={4}>
          <TextInput
            mb={4}
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search..."
            ref={searchRef}
            size="xs"
            value={search}
          />
          <div className={cellClasses.selectDropdown}>
            {filteredChoices.map((choice, idx) => {
              const isSelected = choice.id === selectedId;
              return (
                <div
                  className={clsx(
                    cellClasses.selectOption,
                    isSelected && cellClasses.selectOptionActive,
                    idx === activeIndex &&
                      cellClasses.selectOptionKeyboardActive
                  )}
                  key={choice.id}
                  onClick={() => handleSelect(choice)}
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
              );
            })}
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

  if (!selectedChoice) {
    return <span className={cellClasses.emptyValue} />;
  }

  return (
    <ChoiceBadge
      name={selectedChoice.name}
      style={choiceColor(selectedChoice.color)}
    />
  );
}
