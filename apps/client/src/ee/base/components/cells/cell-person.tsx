import { Popover } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { PersonReadList } from "@/ee/base/components/cells/person-read-list";
import { useListKeyboardNav } from "@/ee/base/hooks/use-list-keyboard-nav";
import { usePersonSearch } from "@/ee/base/hooks/use-person-search";
import {
  useHydrateUsers,
  useReferenceStore,
} from "@/ee/base/reference/reference-store";
import cellClasses from "@/ee/base/styles/cells.module.css";
import { IBaseProperty, PersonTypeOptions } from "@/ee/base/types/base.types";

type CellPersonProps = {
  value: unknown;
  property: IBaseProperty;
  rowId: string;
  isEditing: boolean;
  onCommit: (value: unknown) => void;
  onValueChange: (value: unknown) => void;
  onCancel: () => void;
};

export function CellPerson({
  value,
  property,
  isEditing,
  onCommit,
  onValueChange,
  onCancel,
}: CellPersonProps) {
  const allowMultiple =
    (property.typeOptions as PersonTypeOptions)?.allowMultiple === true;

  const personIds = Array.isArray(value)
    ? (value as string[])
    : typeof value === "string"
      ? [value]
      : [];

  const selectedSet = new Set(personIds);

  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setSearch("");
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [isEditing]);

  const store = useReferenceStore(property.pageId);

  const hydrateUsers = useHydrateUsers(property.pageId);

  const suggestions = usePersonSearch(search, isEditing);

  // In multi mode omit already-selected from the list (they appear as tags above).
  // Single mode keeps the selected row visible so it can be deselected.
  const filteredMembers = allowMultiple
    ? suggestions.filter((m) => !selectedSet.has(m.id))
    : suggestions;

  const { activeIndex, setActiveIndex, handleNavKey, setOptionRef } =
    useListKeyboardNav(filteredMembers.length, [search, isEditing]);

  const handleSelect = useCallback(
    (memberId: string) => {
      const picked = suggestions.find((s) => s.id === memberId);
      if (picked) {
        hydrateUsers([
          { avatarUrl: picked.avatarUrl, id: picked.id, name: picked.name },
        ]);
      }
      if (allowMultiple) {
        if (personIds.includes(memberId)) {
          const newIds = personIds.filter((id) => id !== memberId);
          onValueChange(newIds.length > 0 ? newIds : null);
        } else {
          onValueChange([...personIds, memberId]);
        }
      } else if (personIds.includes(memberId)) {
        onCommit(null);
      } else {
        onCommit(memberId);
      }
    },
    [
      suggestions,
      hydrateUsers,
      allowMultiple,
      personIds,
      onCommit,
      onValueChange,
    ]
  );

  const handleRemove = useCallback(
    (memberId: string) => {
      if (allowMultiple) {
        const newIds = personIds.filter((id) => id !== memberId);
        onValueChange(newIds.length > 0 ? newIds : null);
      } else {
        onCommit(null);
      }
    },
    [allowMultiple, personIds, onCommit, onValueChange]
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
        if (activeIndex < 0 || activeIndex >= filteredMembers.length) {
          return;
        }
        e.preventDefault();
        handleSelect(filteredMembers[activeIndex].id);
        return;
      }
      if (e.key === "Backspace" && search === "" && personIds.length > 0) {
        e.preventDefault();
        handleRemove(personIds[personIds.length - 1]);
      }
    },
    [
      onCancel,
      handleNavKey,
      activeIndex,
      filteredMembers,
      handleSelect,
      search,
      personIds,
      handleRemove,
    ]
  );

  if (isEditing) {
    return (
      <Popover
        closeOnClickOutside
        closeOnEscape
        hideDetached={false}
        onChange={(o) => {
          if (!o) {
            onCancel();
          }
        }}
        onClose={onCancel}
        opened
        position="bottom-start"
        trapFocus
        width={300}
      >
        <Popover.Target>
          <div className={cellClasses.popoverTarget}>
            <PersonReadList personIds={personIds} users={store.users} />
          </div>
        </Popover.Target>
        <Popover.Dropdown p={0}>
          <div className={cellClasses.personTagArea}>
            {personIds.map((id) => {
              const member = store.users[id];
              const name = member?.name ?? id.substring(0, 8);
              return (
                <span className={cellClasses.personTag} key={id}>
                  <CustomAvatar
                    avatarUrl={member?.avatarUrl ?? ""}
                    name={name}
                    radius="xl"
                    size={18}
                  />
                  <span className={cellClasses.personTagName}>{name}</span>
                  <button
                    className={cellClasses.personTagRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(id);
                    }}
                    type="button"
                  >
                    <IconX size={10} />
                  </button>
                </span>
              );
            })}
            <input
              className={cellClasses.personTagInput}
              data-autofocus
              onChange={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                personIds.length === 0 ? "Search for a person..." : ""
              }
              ref={searchRef}
              value={search}
            />
          </div>

          <div className={cellClasses.personDropdownDivider} />
          {allowMultiple && (
            <div className={cellClasses.personDropdownHint}>
              Select as many as you like
            </div>
          )}
          <div className={cellClasses.selectDropdown}>
            {filteredMembers.map((member, idx) => {
              const isSelected = selectedSet.has(member.id);
              return (
                <div
                  className={clsx(
                    cellClasses.selectOption,
                    isSelected && cellClasses.selectOptionActive,
                    idx === activeIndex &&
                      cellClasses.selectOptionKeyboardActive
                  )}
                  key={member.id}
                  onClick={() => handleSelect(member.id)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  ref={setOptionRef(idx)}
                >
                  <CustomAvatar
                    avatarUrl={member.avatarUrl ?? ""}
                    name={member.name ?? ""}
                    radius="xl"
                    size={24}
                  />
                  <div className={cellClasses.personOptionText}>
                    <span className={cellClasses.personOptionName}>
                      {member.name ?? ""}
                    </span>
                    {member.email && (
                      <span className={cellClasses.personOptionEmail}>
                        {member.email}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredMembers.length === 0 && (
              <div className={cellClasses.personDropdownHint}>
                No members found
              </div>
            )}
          </div>
        </Popover.Dropdown>
      </Popover>
    );
  }

  if (personIds.length === 0) {
    return <span className={cellClasses.emptyValue} />;
  }

  return <PersonReadList personIds={personIds} users={store.users} />;
}
