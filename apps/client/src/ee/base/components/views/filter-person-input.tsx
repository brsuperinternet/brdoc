import { Input, InputBase, Popover } from "@mantine/core";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { useListKeyboardNav } from "@/ee/base/hooks/use-list-keyboard-nav";
import {
  type PersonSuggestion,
  usePersonSearch,
} from "@/ee/base/hooks/use-person-search";
import {
  useHydrateUsers,
  useReferenceStore,
} from "@/ee/base/reference/reference-store";
import cellClasses from "@/ee/base/styles/cells.module.css";

type FilterPersonInputProps = {
  pageId: string;
  multiple: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder: string;
  label?: string;
  w?: number | string;
  portalTarget?: HTMLElement | null;
};

function toIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => !!v);
  }
  if (typeof value === "string" && value) {
    return [value];
  }
  return [];
}

export function FilterPersonInput({
  pageId,
  multiple,
  value,
  onChange,
  placeholder,
  label,
  w,
  portalTarget,
}: FilterPersonInputProps) {
  const ids = toIds(value);
  const selectedSet = new Set(ids);

  const [opened, setOpened] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const store = useReferenceStore(pageId);
  const hydrateUsers = useHydrateUsers(pageId);
  const suggestions = usePersonSearch(search, opened);

  useEffect(() => {
    if (opened) {
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setSearch("");
    }
  }, [opened]);

  const filtered: PersonSuggestion[] = multiple
    ? suggestions.filter((s) => !selectedSet.has(s.id))
    : suggestions;

  const { activeIndex, setActiveIndex, handleNavKey, setOptionRef } =
    useListKeyboardNav(filtered.length, [search, opened]);

  const emit = useCallback(
    (nextIds: string[]) => {
      if (multiple) {
        onChange(nextIds.length > 0 ? nextIds : undefined);
      } else {
        onChange(nextIds[0] ?? undefined);
      }
    },
    [multiple, onChange]
  );

  const handleSelect = useCallback(
    (id: string) => {
      const picked = suggestions.find((s) => s.id === id);
      if (picked) {
        hydrateUsers([
          { avatarUrl: picked.avatarUrl, id: picked.id, name: picked.name },
        ]);
      }
      if (multiple) {
        emit(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
      } else {
        emit([id]);
        setOpened(false);
      }
      setSearch("");
    },
    [suggestions, hydrateUsers, multiple, ids, emit]
  );

  const handleRemove = useCallback(
    (id: string) => emit(ids.filter((x) => x !== id)),
    [emit, ids]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpened(false);
        return;
      }
      if (handleNavKey(e)) {
        return;
      }
      if (e.key === "Enter") {
        if (activeIndex < 0 || activeIndex >= filtered.length) {
          return;
        }
        e.preventDefault();
        handleSelect(filtered[activeIndex].id);
        return;
      }
      if (e.key === "Backspace" && search === "" && ids.length > 0) {
        e.preventDefault();
        handleRemove(ids[ids.length - 1]);
      }
    },
    [
      handleNavKey,
      activeIndex,
      filtered,
      handleSelect,
      search,
      ids,
      handleRemove,
    ]
  );

  return (
    <Popover
      closeOnClickOutside
      closeOnEscape={false}
      onChange={setOpened}
      opened={opened}
      portalProps={{ target: portalTarget ?? undefined }}
      position="bottom-start"
      width={260}
      withinPortal={!!portalTarget}
    >
      <Popover.Target>
        <InputBase
          component="button"
          label={label}
          multiline
          onClick={() => setOpened((o) => !o)}
          pointer
          rightSection={<IconChevronDown size={14} />}
          rightSectionPointerEvents="none"
          size="xs"
          type="button"
          w={w ?? 170}
        >
          {ids.length === 0 ? (
            <Input.Placeholder>{placeholder}</Input.Placeholder>
          ) : (
            <span className={cellClasses.filterTriggerChips}>
              {ids.map((id) => {
                const user = store.users[id];
                const name = user?.name ?? id.substring(0, 8);
                return (
                  <span className={cellClasses.filterTriggerChip} key={id}>
                    <CustomAvatar
                      avatarUrl={user?.avatarUrl ?? ""}
                      name={name}
                      radius="xl"
                      size={16}
                    />
                    <span className={cellClasses.filterTriggerChipName}>
                      {name}
                    </span>
                  </span>
                );
              })}
            </span>
          )}
        </InputBase>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <div className={cellClasses.personTagArea}>
          {multiple &&
            ids.map((id) => {
              const user = store.users[id];
              const name = user?.name ?? id.substring(0, 8);
              return (
                <span className={cellClasses.personTag} key={id}>
                  <CustomAvatar
                    avatarUrl={user?.avatarUrl ?? ""}
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
            onChange={(e) => setSearch(e.currentTarget.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find a user..."
            ref={searchRef}
            value={search}
          />
        </div>
        <div className={cellClasses.personDropdownDivider} />
        <div className={cellClasses.selectDropdown}>
          {filtered.map((member, idx) => (
            <div
              className={clsx(
                cellClasses.selectOption,
                selectedSet.has(member.id) && cellClasses.selectOptionActive,
                idx === activeIndex && cellClasses.selectOptionKeyboardActive
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
          ))}
          {filtered.length === 0 && (
            <div className={cellClasses.personDropdownHint}>No users found</div>
          )}
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
