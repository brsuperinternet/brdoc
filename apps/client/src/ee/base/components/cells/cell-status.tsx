import { Popover, TextInput } from "@mantine/core";
import clsx from "clsx";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChoiceBadge } from "@/ee/base/components/cells/choice-badge";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { useListKeyboardNav } from "@/ee/base/hooks/use-list-keyboard-nav";
import cellClasses from "@/ee/base/styles/cells.module.css";
import {
  Choice,
  IBaseProperty,
  SelectTypeOptions,
} from "@/ee/base/types/base.types";

type CellStatusProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onCancel: () => void;
};

type CategoryGroup = {
  label: string;
  choices: Choice[];
};

const categoryLabels: Record<string, string> = {
  complete: "Complete",
  inProgress: "In Progress",
  todo: "To Do",
};

export function CellStatus({
  value,
  property,
  isEditing,
  onCommit,
  onCancel,
}: CellStatusProps) {
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

  const groups = useMemo(() => {
    const filtered = search
      ? choices.filter((c) =>
          c.name.toLowerCase().includes(search.toLowerCase())
        )
      : choices;

    const grouped: Record<string, Choice[]> = {};
    for (const choice of filtered) {
      const cat = choice.category ?? "todo";
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(choice);
    }

    const result: CategoryGroup[] = [];
    for (const key of ["todo", "inProgress", "complete"]) {
      if (grouped[key]?.length) {
        result.push({
          choices: grouped[key],
          label: categoryLabels[key] ?? key,
        });
      }
    }
    return result;
  }, [choices, search]);

  const flatChoices = useMemo(() => groups.flatMap((g) => g.choices), [groups]);
  const choiceIdxMap = useMemo(() => {
    const m = new Map<string, number>();
    flatChoices.forEach((c, i) => m.set(c.id, i));
    return m;
  }, [flatChoices]);

  const { activeIndex, setActiveIndex, handleNavKey, setOptionRef } =
    useListKeyboardNav(flatChoices.length, [search, isEditing]);

  const handleSelect = useCallback(
    (choice: Choice) => {
      onCommit(choice.id === selectedId ? null : choice.id);
    },
    [selectedId, onCommit]
  );

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
        if (activeIndex < 0 || activeIndex >= flatChoices.length) {
          return;
        }
        e.preventDefault();
        handleSelect(flatChoices[activeIndex]);
      }
    },
    [onCancel, handleNavKey, activeIndex, flatChoices, handleSelect]
  );

  if (isEditing) {
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
            {groups.map((group) => (
              <div key={group.label}>
                <div className={cellClasses.selectCategoryLabel}>
                  {group.label}
                </div>
                {group.choices.map((choice) => {
                  const idx = choiceIdxMap.get(choice.id) ?? -1;
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
              </div>
            ))}
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
