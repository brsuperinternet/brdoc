import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import { triggerPostMoveFlash } from "@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash";
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from "@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge";
import { getReorderDestinationIndex } from "@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index";
import * as liveRegion from "@atlaskit/pragmatic-drag-and-drop-live-region";
import {
  Button,
  CloseButton,
  Divider,
  Group,
  Popover,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowsSort,
  IconGripVertical,
  IconPlus,
} from "@tabler/icons-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { BaseDropEdgeIndicator } from "@/ee/base/components/grid/base-drop-edge-indicator";
import classes from "@/ee/base/styles/property.module.css";
import { Choice } from "@/ee/base/types/base.types";
import { generateBaseChoiceId } from "@/ee/base/utils/generate-base-id";
import { DefaultValuePicker } from "./default-value-picker";

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

const STATUS_CATEGORIES = [
  { label: "To Do", value: "todo" },
  { label: "In Progress", value: "inProgress" },
  { label: "Complete", value: "complete" },
] as const;

// Default choices for a new status property, one per category.
export function defaultStatusChoices(): Choice[] {
  return [
    {
      category: "todo",
      color: "gray",
      id: generateBaseChoiceId(),
      name: "Not started",
    },
    {
      category: "inProgress",
      color: "blue",
      id: generateBaseChoiceId(),
      name: "In progress",
    },
    {
      category: "complete",
      color: "green",
      id: generateBaseChoiceId(),
      name: "Done",
    },
  ];
}

function pruneDefault(
  value: string | string[] | null,
  choices: Choice[]
): string | string[] | null {
  if (value === null) {
    return null;
  }
  const ids = new Set(choices.map((c) => c.id));
  if (Array.isArray(value)) {
    const live = value.filter((id) => ids.has(id));
    return live.length ? live : null;
  }
  return ids.has(value) ? value : null;
}

function defaultsEqual(
  a: string | string[] | null,
  b: string | string[] | null
): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}

type ChoiceEditorProps = {
  initialChoices: Choice[];
  onSave: (choices: Choice[], defaultValue: string | string[] | null) => void;
  onClose: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  showCategories?: boolean;
  hideButtons?: boolean;
  initialDefaultValue?: string | string[] | null;
  multiDefault?: boolean;
  /**
   * Where the per-choice color-picker popover portals. Pass the enclosing
   * property-menu dropdown node so the picker renders INSIDE that subtree —
   * otherwise a color click registers as "outside" and closes the menu.
   */
  dropdownPortalTarget?: HTMLElement | null;
};

export function ChoiceEditor({
  initialChoices,
  onSave,
  onClose,
  onDirtyChange,
  showCategories = false,
  hideButtons = false,
  initialDefaultValue = null,
  multiDefault = false,
  dropdownPortalTarget,
}: ChoiceEditorProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Choice[]>(initialChoices);
  const [focusChoiceId, setFocusChoiceId] = useState<string | null>(null);
  const [defaultDraft, setDefaultDraft] = useState<string | string[] | null>(
    initialDefaultValue
  );

  useEffect(() => {
    if (!hideButtons) {
      setDraft(initialChoices);
      setDefaultDraft(initialDefaultValue);
    }
  }, [initialChoices, initialDefaultValue, hideButtons]);

  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (hideButtons) {
      const cleaned = draft.filter((c) => c.name.trim());
      onSaveRef.current(cleaned, pruneDefault(defaultDraft, cleaned));
    }
  }, [hideButtons, draft, defaultDraft]);

  const isDirty = useMemo(() => {
    if (!defaultsEqual(defaultDraft, initialDefaultValue)) {
      return true;
    }
    if (draft.length !== initialChoices.length) {
      return true;
    }
    return draft.some((d, i) => {
      const o = initialChoices[i];
      return (
        d.id !== o.id ||
        d.name !== o.name ||
        d.color !== o.color ||
        d.category !== o.category
      );
    });
  }, [draft, initialChoices, defaultDraft, initialDefaultValue]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const hasEmptyNames = draft.some((c) => !c.name.trim());

  const handleRename = useCallback((choiceId: string, name: string) => {
    setDraft((prev) =>
      prev.map((c) => (c.id === choiceId ? { ...c, name } : c))
    );
  }, []);

  const handleColorChange = useCallback((choiceId: string, color: string) => {
    setDraft((prev) =>
      prev.map((c) => (c.id === choiceId ? { ...c, color } : c))
    );
  }, []);

  const handleRemove = useCallback((choiceId: string) => {
    setDraft((prev) => prev.filter((c) => c.id !== choiceId));
    setDefaultDraft((prev) => {
      if (prev === null) {
        return prev;
      }
      if (Array.isArray(prev)) {
        const next = prev.filter((id) => id !== choiceId);
        return next.length ? next : null;
      }
      return prev === choiceId ? null : prev;
    });
  }, []);

  const handleAdd = useCallback(
    (category?: "todo" | "inProgress" | "complete") => {
      const id = generateBaseChoiceId();
      setDraft((prev) => {
        const colorIndex = prev.length % CHOICE_COLORS.length;
        const newChoice: Choice = {
          color: CHOICE_COLORS[colorIndex],
          id,
          name: "",
          ...(category ? { category } : {}),
        };
        return [...prev, newChoice];
      });
      setFocusChoiceId(id);
    },
    []
  );

  const handleAlphabetize = useCallback(() => {
    setDraft((prev) => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
  }, []);

  const handleSave = useCallback(() => {
    const cleaned = draft.filter((c) => c.name.trim());
    onSave(cleaned, pruneDefault(defaultDraft, cleaned));
    onClose();
  }, [draft, defaultDraft, onSave, onClose]);

  const handleCancel = useCallback(() => {
    setDraft(initialChoices);
    setDefaultDraft(initialDefaultValue);
    onDirtyChange?.(false);
    onClose();
  }, [initialChoices, initialDefaultValue, onDirtyChange, onClose]);

  const handleReorder = useCallback(
    (activeId: string, targetId: string, edge: Edge) => {
      setDraft((prev) => {
        const startIndex = prev.findIndex((c) => c.id === activeId);
        const indexOfTarget = prev.findIndex((c) => c.id === targetId);
        if (startIndex === -1 || indexOfTarget === -1) {
          return prev;
        }
        const finishIndex = getReorderDestinationIndex({
          axis: "vertical",
          closestEdgeOfTarget: edge,
          indexOfTarget,
          startIndex,
        });
        if (finishIndex === startIndex) {
          return prev;
        }
        return reorder({ finishIndex, list: prev, startIndex });
      });
    },
    []
  );

  const handleCategoryReorder = useCallback(
    (category: string, activeId: string, targetId: string, edge: Edge) => {
      setDraft((prev) => {
        const catChoices = prev.filter(
          (c) => (c.category ?? "todo") === category
        );
        const startIndex = catChoices.findIndex((c) => c.id === activeId);
        const indexOfTarget = catChoices.findIndex((c) => c.id === targetId);
        if (startIndex === -1 || indexOfTarget === -1) {
          return prev;
        }
        const finishIndex = getReorderDestinationIndex({
          axis: "vertical",
          closestEdgeOfTarget: edge,
          indexOfTarget,
          startIndex,
        });
        if (finishIndex === startIndex) {
          return prev;
        }
        const reordered = reorder({
          finishIndex,
          list: catChoices,
          startIndex,
        });
        const result: Choice[] = [];
        for (const cat of ["todo", "inProgress", "complete"]) {
          if (cat === category) {
            result.push(...reordered);
          } else {
            result.push(...prev.filter((c) => (c.category ?? "todo") === cat));
          }
        }
        return result;
      });
    },
    []
  );

  return (
    <Stack gap="xs">
      <Group justify="space-between">
        <Text fw={600} size="xs">
          {t("Options")}
        </Text>
        <UnstyledButton
          className={classes.alphabetizeBtn}
          onClick={handleAlphabetize}
        >
          <IconArrowsSort color="var(--mantine-color-dimmed)" size={14} />
          <Text c="dimmed" size="xs">
            {t("Alphabetize")}
          </Text>
        </UnstyledButton>
      </Group>

      {showCategories ? (
        <StatusChoiceList
          draft={draft}
          dropdownPortalTarget={dropdownPortalTarget}
          focusChoiceId={focusChoiceId}
          onAdd={handleAdd}
          onCategoryReorder={handleCategoryReorder}
          onColorChange={handleColorChange}
          onFocused={() => setFocusChoiceId(null)}
          onRemove={handleRemove}
          onRename={handleRename}
        />
      ) : (
        <FlatChoiceList
          draft={draft}
          dropdownPortalTarget={dropdownPortalTarget}
          focusChoiceId={focusChoiceId}
          onAdd={handleAdd}
          onColorChange={handleColorChange}
          onFocused={() => setFocusChoiceId(null)}
          onRemove={handleRemove}
          onRename={handleRename}
          onReorder={handleReorder}
        />
      )}

      <DefaultValuePicker
        choices={draft.filter((c) => c.name.trim())}
        dropdownPortalTarget={dropdownPortalTarget}
        multiple={multiDefault}
        onChange={setDefaultDraft}
        value={defaultDraft}
      />

      {!hideButtons && (
        <>
          <Divider />

          <Group gap="xs" justify="flex-end">
            <Button onClick={handleCancel} size="xs" variant="default">
              {t("Cancel")}
            </Button>
            <Button
              disabled={!isDirty || hasEmptyNames}
              onClick={handleSave}
              size="xs"
            >
              {t("Save")}
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}

function FlatChoiceList({
  draft,
  focusChoiceId,
  onFocused,
  onRename,
  onColorChange,
  onRemove,
  onAdd,
  onReorder,
  dropdownPortalTarget,
}: {
  draft: Choice[];
  focusChoiceId: string | null;
  onFocused: () => void;
  onRename: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
  onReorder: (activeId: string, targetId: string, edge: Edge) => void;
  dropdownPortalTarget?: HTMLElement | null;
}) {
  const { t } = useTranslation();

  return (
    <Stack gap={4}>
      {draft.map((choice) => (
        <SortableChoiceRow
          autoFocus={choice.id === focusChoiceId}
          choice={choice}
          dragType="base-choice-flat"
          dropdownPortalTarget={dropdownPortalTarget}
          key={choice.id}
          onColorChange={onColorChange}
          onFocused={onFocused}
          onRemove={onRemove}
          onRename={onRename}
          onReorder={onReorder}
        />
      ))}

      <UnstyledButton className={classes.addOptionBtn} onClick={() => onAdd()}>
        <IconPlus color="var(--mantine-color-dimmed)" size={14} />
        <Text c="dimmed" size="xs">
          {t("Add option")}
        </Text>
      </UnstyledButton>
    </Stack>
  );
}

function StatusChoiceList({
  draft,
  focusChoiceId,
  onFocused,
  onRename,
  onColorChange,
  onRemove,
  onAdd,
  onCategoryReorder,
  dropdownPortalTarget,
}: {
  draft: Choice[];
  focusChoiceId: string | null;
  onFocused: () => void;
  onRename: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onRemove: (id: string) => void;
  onAdd: (category: "todo" | "inProgress" | "complete") => void;
  onCategoryReorder: (
    category: string,
    activeId: string,
    targetId: string,
    edge: Edge
  ) => void;
  dropdownPortalTarget?: HTMLElement | null;
}) {
  const grouped = useMemo(() => {
    const groups: Record<string, Choice[]> = {
      complete: [],
      inProgress: [],
      todo: [],
    };
    for (const choice of draft) {
      const cat = choice.category ?? "todo";
      (groups[cat] ?? groups.todo).push(choice);
    }
    return groups;
  }, [draft]);

  return (
    <Stack gap="sm">
      {STATUS_CATEGORIES.map(({ value: category, label }) => (
        <CategorySection
          category={category as "todo" | "inProgress" | "complete"}
          choices={grouped[category] ?? []}
          dropdownPortalTarget={dropdownPortalTarget}
          focusChoiceId={focusChoiceId}
          key={category}
          label={label}
          onAdd={onAdd}
          onColorChange={onColorChange}
          onFocused={onFocused}
          onRemove={onRemove}
          onRename={onRename}
          onReorder={onCategoryReorder}
        />
      ))}
    </Stack>
  );
}

function CategorySection({
  category,
  label,
  choices,
  focusChoiceId,
  onFocused,
  onRename,
  onColorChange,
  onRemove,
  onAdd,
  onReorder,
  dropdownPortalTarget,
}: {
  category: "todo" | "inProgress" | "complete";
  label: string;
  choices: Choice[];
  focusChoiceId: string | null;
  onFocused: () => void;
  onRename: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onRemove: (id: string) => void;
  onAdd: (category: "todo" | "inProgress" | "complete") => void;
  onReorder: (
    category: string,
    activeId: string,
    targetId: string,
    edge: Edge
  ) => void;
  dropdownPortalTarget?: HTMLElement | null;
}) {
  const { t } = useTranslation();

  const handleRowReorder = useCallback(
    (activeId: string, targetId: string, edge: Edge) => {
      onReorder(category, activeId, targetId, edge);
    },
    [category, onReorder]
  );

  return (
    <Stack gap={4}>
      <Text c="dimmed" fw={600} size="xs">
        {t(label)}
      </Text>

      {choices.map((choice) => (
        <SortableChoiceRow
          autoFocus={choice.id === focusChoiceId}
          choice={choice}
          // Per-category drag type prevents cross-category drops.
          dragType={`base-choice-status:${category}`}
          dropdownPortalTarget={dropdownPortalTarget}
          key={choice.id}
          onColorChange={onColorChange}
          onFocused={onFocused}
          onRemove={onRemove}
          onRename={onRename}
          onReorder={handleRowReorder}
        />
      ))}

      <UnstyledButton
        className={classes.addOptionBtn}
        onClick={() => onAdd(category)}
      >
        <IconPlus color="var(--mantine-color-dimmed)" size={14} />
        <Text c="dimmed" size="xs">
          {t("Add option")}
        </Text>
      </UnstyledButton>
    </Stack>
  );
}

function SortableChoiceRow({
  choice,
  dragType,
  autoFocus,
  onFocused,
  onRename,
  onColorChange,
  onRemove,
  onReorder,
  dropdownPortalTarget,
}: {
  choice: Choice;
  dragType: string;
  autoFocus?: boolean;
  onFocused?: () => void;
  onRename: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onRemove: (id: string) => void;
  onReorder: (activeId: string, targetId: string, edge: Edge) => void;
  dropdownPortalTarget?: HTMLElement | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<Edge | null>(null);

  // Stable ref so the DnD effect doesn't re-register on every parent render.
  const onReorderRef = useRef(onReorder);
  useLayoutEffect(() => {
    onReorderRef.current = onReorder;
  });

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
      onFocused?.();
    }
  }, [autoFocus, onFocused]);

  useEffect(() => {
    const row = rowRef.current;
    const handle = handleRef.current;
    if (!(row && handle)) {
      return;
    }
    return combine(
      draggable({
        dragHandle: handle,
        element: row,
        getInitialData: () => ({ choiceId: choice.id, type: dragType }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        canDrop: ({ source }) =>
          source.data.type === dragType && source.data.choiceId !== choice.id,
        element: row,
        getData: ({ input, element }) =>
          attachClosestEdge(
            { choiceId: choice.id },
            { allowedEdges: ["top", "bottom"], element, input }
          ),
        onDrag: ({ self }) => setClosestEdge(extractClosestEdge(self.data)),
        onDragLeave: () => setClosestEdge(null),
        onDrop: ({ source, self }) => {
          setClosestEdge(null);
          const edge = extractClosestEdge(self.data);
          if (!edge) {
            return;
          }
          onReorderRef.current(source.data.choiceId as string, choice.id, edge);
          triggerPostMoveFlash(row);
          liveRegion.announce("Moved option");
        },
      })
    );
  }, [choice.id, dragType]);

  const hasError = !choice.name.trim();

  return (
    <Group
      align="center"
      data-dragging={isDragging || undefined}
      gap={6}
      ref={rowRef}
      style={{
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
      }}
      wrap="nowrap"
    >
      <div className={classes.dragHandle} ref={handleRef}>
        <IconGripVertical size={14} style={{ opacity: 0.4 }} />
      </div>
      <ColorDot
        color={choice.color}
        dropdownPortalTarget={dropdownPortalTarget}
        onChange={(c) => onColorChange(choice.id, c)}
      />
      <TextInput
        error={hasError}
        onChange={(e) => onRename(choice.id, e.currentTarget.value)}
        ref={inputRef}
        size="xs"
        style={{ flex: 1 }}
        styles={
          hasError
            ? { input: { borderColor: "var(--mantine-color-red-6)" } }
            : undefined
        }
        value={choice.name}
      />
      <CloseButton onClick={() => onRemove(choice.id)} size="sm" />
      {closestEdge && <BaseDropEdgeIndicator edge={closestEdge} />}
    </Group>
  );
}

function ColorDot({
  color,
  onChange,
  dropdownPortalTarget,
}: {
  color: string;
  onChange: (color: string) => void;
  dropdownPortalTarget?: HTMLElement | null;
}) {
  const [opened, setOpened] = useState(false);
  const colors = choiceColor(color);

  return (
    <Popover
      onChange={setOpened}
      opened={opened}
      portalProps={{ target: dropdownPortalTarget ?? undefined }}
      position="bottom"
      shadow="sm"
      withinPortal
    >
      <Popover.Target>
        <UnstyledButton
          onClick={() => setOpened((o) => !o)}
          style={{
            backgroundColor: colors.backgroundColor as string,
            border: `2px solid ${colors.color as string}`,
            borderRadius: "50%",
            flexShrink: 0,
            height: 20,
            width: 20,
          }}
        />
      </Popover.Target>
      <Popover.Dropdown p={8}>
        <SimpleGrid cols={5} spacing={6}>
          {CHOICE_COLORS.map((c) => {
            const dotColors = choiceColor(c);
            return (
              <UnstyledButton
                key={c}
                onClick={() => {
                  onChange(c);
                  setOpened(false);
                }}
                style={{
                  backgroundColor: dotColors.backgroundColor as string,
                  border:
                    c === color
                      ? `2px solid ${dotColors.color as string}`
                      : "2px solid transparent",
                  borderRadius: "50%",
                  height: 24,
                  width: 24,
                }}
              />
            );
          })}
        </SimpleGrid>
      </Popover.Dropdown>
    </Popover>
  );
}
