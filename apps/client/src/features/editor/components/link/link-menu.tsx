import { isTextSelected } from "@docmost/editor-ext";
import { Paper } from "@mantine/core";
import { TextSelection } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useAtom } from "jotai";
import { FC, useCallback, useEffect, useRef } from "react";
import { showLinkMenuAtom } from "@/features/editor/atoms/editor-atoms";
import { LinkEditorPanel } from "@/features/editor/components/link/link-editor-panel";
import { normalizeUrl } from "@/lib/utils";

type EditorLinkMenuProps = {
  editor: Editor;
};

export const EditorLinkMenu: FC<EditorLinkMenuProps> = ({ editor }) => {
  const [showLinkMenu, setShowLinkMenu] = useAtom(showLinkMenuAtom);
  const showLinkMenuRef = useRef(showLinkMenu);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    showLinkMenuRef.current = showLinkMenu;
    if (showLinkMenu) {
      editor.commands.focus();
    }
  }, [showLinkMenu, editor]);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      containerRef.current
        ?.querySelector<HTMLInputElement>("input")
        ?.focus({ preventScroll: true });
    });
  }, []);

  const onSetLink = useCallback(
    (url: string, internal?: boolean) => {
      editor
        .chain()
        .focus()
        .setLink({
          href: internal ? url : normalizeUrl(url),
          internal: !!internal,
        } as any)
        .command(({ tr }) => {
          tr.setSelection(TextSelection.create(tr.doc, tr.selection.to));
          return true;
        })
        .run();
      setShowLinkMenu(false);
    },
    [editor, setShowLinkMenu]
  );

  useEffect(() => {
    if (!showLinkMenu) {
      return;
    }

    const dismiss = () => {
      setShowLinkMenu(false);
      editor.commands.focus();
      editor.commands.setTextSelection(editor.state.selection.to);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        dismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [showLinkMenu, setShowLinkMenu]);

  if (!showLinkMenu) {
    return null;
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{
        offset: 8,
        onHide: () => {
          setShowLinkMenu(false);
        },
        onShow: focusInput,
        placement: "bottom",
      }}
      shouldShow={({ editor, state }) => {
        const { empty } = state.selection;
        return (
          showLinkMenuRef.current &&
          editor.isEditable &&
          !empty &&
          isTextSelected(editor)
        );
      }}
      style={{ position: "relative", zIndex: 198 }}
    >
      <Paper
        p="sm"
        radius={6}
        ref={containerRef}
        shadow="md"
        w={320}
        withBorder
      >
        <LinkEditorPanel onSetLink={onSetLink} />
      </Paper>
    </BubbleMenu>
  );
};
