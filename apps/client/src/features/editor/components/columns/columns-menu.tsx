import type { ColumnsLayout } from "@docmost/editor-ext";
import { isEditorReady, isTextSelected } from "@docmost/editor-ext";
import { ActionIcon, Button, Popover, Tooltip } from "@mantine/core";
import {
  IconCheck,
  IconChevronDown,
  IconColumns2,
  IconColumns3,
  IconCopy,
  IconLayoutAlignCenter,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconTrash,
} from "@tabler/icons-react";
import { DOMSerializer, Node as PMNode } from "@tiptap/pm/model";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import clsx from "clsx";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import classes from "../common/toolbar-menu.module.css";

type LayoutPreset = {
  layout: ColumnsLayout;
  label: string;
  icon: React.ElementType;
};

const twoColumnPresets: LayoutPreset[] = [
  { icon: IconColumns2, label: "Equal columns", layout: "two_equal" },
  {
    icon: IconLayoutSidebar,
    label: "Left sidebar",
    layout: "two_left_sidebar",
  },
  {
    icon: IconLayoutSidebarRight,
    label: "Right sidebar",
    layout: "two_right_sidebar",
  },
];

const threeColumnPresets: LayoutPreset[] = [
  { icon: IconColumns3, label: "Equal columns", layout: "three_equal" },
  {
    icon: IconLayoutAlignCenter,
    label: "Wide center",
    layout: "three_with_sidebars",
  },
  {
    icon: IconLayoutSidebarRight,
    label: "Left wide",
    layout: "three_left_wide",
  },
  { icon: IconLayoutSidebar, label: "Right wide", layout: "three_right_wide" },
];

function getPresetsForCount(count: number): LayoutPreset[] {
  if (count === 2) {
    return twoColumnPresets;
  }
  if (count === 3) {
    return threeColumnPresets;
  }
  return [];
}

export function ColumnsMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();
  const [isCountOpen, setIsCountOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const nodesWithMenus = [
    "callout",
    "image",
    "video",
    "drawio",
    "excalidraw",
    "table",
  ];

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!(state && isEditorReady(editor))) {
        return false;
      }
      if (!editor.isActive("columns")) {
        return false;
      }
      if (isTextSelected(editor)) {
        return false;
      }
      if (nodesWithMenus.some((name) => editor.isActive(name))) {
        return false;
      }

      const parent = findParentNode(
        (node: PMNode) => node.type.name === "columns"
      )(state.selection);
      if (!parent) {
        return false;
      }

      const dom = editor.view.nodeDOM(parent.pos) as HTMLElement;
      if (!dom) {
        return false;
      }

      const rect = dom.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    },
    [editor]
  );

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      const { selection } = ctx.editor.state;
      const parent = findParentNode(
        (node: PMNode) => node.type.name === "columns"
      )(selection);

      return {
        columnCount: parent?.node.childCount || 2,
        isNormal: ctx.editor.isActive("columns", { widthMode: "normal" }),
        isWide: ctx.editor.isActive("columns", { widthMode: "wide" }),
        layout: (parent?.node.attrs.layout as ColumnsLayout) || "two_equal",
      };
    },
  });

  const getReferencedVirtualElement = useCallback(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "columns";
    const parent = findParentNode(predicate)(selection);

    if (parent) {
      const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
      const domRect = dom.getBoundingClientRect();

      // Columns entirely out of viewport — return real rect so menu goes off-screen
      if (domRect.bottom <= 0 || domRect.top >= window.innerHeight) {
        return {
          getBoundingClientRect: () => domRect,
          getClientRects: () => [domRect],
        };
      }

      // Clamp bottom so menu stays within viewport when columns extend below it
      // 55px = 15px offset + ~40px menu height
      const maxBottom = window.innerHeight - 55;
      if (domRect.bottom > maxBottom) {
        const clamped = new DOMRect(
          domRect.x,
          domRect.y,
          domRect.width,
          maxBottom - domRect.y
        );
        return {
          getBoundingClientRect: () => clamped,
          getClientRects: () => [clamped],
        };
      }

      return {
        getBoundingClientRect: () => domRect,
        getClientRects: () => [domRect],
      };
    }

    const domRect = posToDOMRect(editor.view, selection.from, selection.to);
    return {
      getBoundingClientRect: () => domRect,
      getClientRects: () => [domRect],
    };
  }, [editor]);

  const setColumnCount = useCallback(
    (count: number) => {
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .setColumnCount(count)
        .run();
      setIsCountOpen(false);
    },
    [editor]
  );

  const setLayout = useCallback(
    (layout: ColumnsLayout) => {
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .setColumnsLayout(layout)
        .run();
    },
    [editor]
  );

  const handleCopy = useCallback(() => {
    const { state } = editor;
    const parent = findParentNode(
      (node: PMNode) => node.type.name === "columns"
    )(state.selection);
    if (!parent) {
      return;
    }

    const serializer = DOMSerializer.fromSchema(state.schema);
    const dom = serializer.serializeNode(parent.node);
    const wrapper = document.createElement("div");
    wrapper.appendChild(dom);

    const onSuccess = () => {
      clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1500);
    };

    if (navigator.clipboard?.write) {
      navigator.clipboard
        .write([
          new ClipboardItem({
            "text/html": new Blob([wrapper.innerHTML], { type: "text/html" }),
            "text/plain": new Blob([parent.node.textContent], {
              type: "text/plain",
            }),
          }),
        ])
        .then(onSuccess)
        .catch(execCommandFallback);
    } else {
      execCommandFallback();
    }

    function execCommandFallback() {
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      document.body.appendChild(wrapper);
      const range = document.createRange();
      range.selectNodeContents(wrapper);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.execCommand("copy");
      sel?.removeAllRanges();
      document.body.removeChild(wrapper);
      editor.view.focus();
      onSuccess();
    }
  }, [editor]);

  const handleDelete = useCallback(() => {
    const parent = findParentNode(
      (node: PMNode) => node.type.name === "columns"
    )(editor.state.selection);
    if (!parent) {
      return;
    }
    editor.chain().focus().setNodeSelection(parent.pos).deleteSelection().run();
  }, [editor]);

  const columnCount = editorState?.columnCount || 2;
  const currentLayout = editorState?.layout || "two_equal";
  const presets = getPresetsForCount(columnCount);

  return (
    <BaseBubbleMenu
      editor={editor}
      getReferencedVirtualElement={getReferencedVirtualElement}
      options={{
        flip: false,
        offset: {
          mainAxis: 5,
        },
        placement: "bottom",
      }}
      pluginKey="columns-menu"
      ref={(element) => {
        if (element) {
          element.style.zIndex = "99";
        }
      }}
      shouldShow={shouldShow}
      updateDelay={0}
    >
      <div className={classes.toolbar}>
        <Popover onChange={setIsCountOpen} opened={isCountOpen} withArrow>
          <Popover.Target>
            <Button
              aria-label={t("Column count")}
              color="dark"
              onClick={() => setIsCountOpen(!isCountOpen)}
              rightSection={<IconChevronDown size={12} />}
              size="compact-sm"
              variant="subtle"
            >
              {t("{{count}} Columns", { count: columnCount })}
            </Button>
          </Popover.Target>
          <Popover.Dropdown p={4}>
            <Button.Group orientation="vertical">
              {[2, 3, 4, 5].map((n) => (
                <Button
                  color={n === columnCount ? "blue" : "dark"}
                  fullWidth
                  justify="space-between"
                  key={n}
                  onClick={() => setColumnCount(n)}
                  rightSection={
                    n === columnCount ? <IconCheck size={14} /> : null
                  }
                  size="xs"
                  variant={n === columnCount ? "light" : "subtle"}
                >
                  {t("{{count}} Columns", { count: n })}
                </Button>
              ))}
            </Button.Group>
          </Popover.Dropdown>
        </Popover>

        {presets.length > 0 && <div className={classes.divider} />}

        {presets.map((preset) => (
          <Tooltip key={preset.layout} label={t(preset.label)} position="top">
            <ActionIcon
              aria-label={t(preset.label)}
              className={clsx({
                [classes.active]: currentLayout === preset.layout,
              })}
              onClick={() => setLayout(preset.layout)}
              size="lg"
              variant="subtle"
            >
              <preset.icon size={18} />
            </ActionIcon>
          </Tooltip>
        ))}

        <div className={classes.divider} />

        <Tooltip
          label={copied ? t("Copied") : t("Copy")}
          position="top"
          withinPortal={false}
        >
          <ActionIcon
            aria-label={t("Copy")}
            onClick={handleCopy}
            size="lg"
            variant="subtle"
          >
            {copied ? (
              <IconCheck color="var(--mantine-color-green-6)" size={18} />
            ) : (
              <IconCopy size={18} />
            )}
          </ActionIcon>
        </Tooltip>

        <Tooltip label={t("Delete")} position="top" withinPortal={false}>
          <ActionIcon
            aria-label={t("Delete")}
            onClick={handleDelete}
            size="lg"
            variant="subtle"
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Tooltip>
      </div>
    </BaseBubbleMenu>
  );
}

export default ColumnsMenu;
