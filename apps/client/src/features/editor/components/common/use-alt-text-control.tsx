import {
  ActionIcon,
  Button,
  Group,
  Paper,
  Text,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { IconAlt } from "@tabler/icons-react";
import { Editor } from "@tiptap/react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const ALT_MAX_LENGTH = 300;

function sanitizeAlt(value: string): string {
  return value
    .replace(/[\\[\]!]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type UseAltTextControlArgs = {
  editor: Editor;
  nodeName: string;
  currentAlt: string;
};

export function useAltTextControl({
  editor,
  nodeName,
  currentAlt,
}: UseAltTextControlArgs) {
  const { t } = useTranslation();
  const [showInput, setShowInput] = useState(false);
  const [draft, setDraft] = useState("");

  const open = useCallback(() => {
    setDraft(currentAlt || "");
    setShowInput(true);
  }, [currentAlt]);

  useEffect(() => {
    const handler = () => {
      if (!editor.isActive(nodeName)) {
        setShowInput(false);
      }
    };
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("selectionUpdate", handler);
    };
  }, [editor, nodeName]);

  const cancel = useCallback(() => {
    setShowInput(false);
  }, []);

  const save = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .updateAttributes(nodeName, { alt: sanitizeAlt(draft) || undefined })
      .run();
    setShowInput(false);
  }, [editor, nodeName, draft]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancel();
      }
    },
    [save, cancel]
  );

  const button = (
    <Tooltip label={t("Alt text")} position="top" withinPortal={false}>
      <ActionIcon
        aria-label={t("Alt text")}
        onClick={open}
        size="lg"
        variant="subtle"
      >
        <IconAlt size={18} />
      </ActionIcon>
    </Tooltip>
  );

  const panel = showInput ? (
    <Paper
      p="sm"
      radius={6}
      shadow="md"
      style={{ position: "relative", zIndex: 100 }}
      w={320}
      withBorder
    >
      <Text fw={600} mb={2} size="sm">
        {t("Alt text")}
      </Text>
      <Text c="dimmed" mb="xs" size="xs">
        {t("Describe this for accessibility.")}
      </Text>
      <Textarea
        autoFocus
        autosize
        maxLength={ALT_MAX_LENGTH}
        maxRows={5}
        minRows={2}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onKeyDown={onKeyDown}
        placeholder={t("Add a description")}
        size="xs"
        value={draft}
      />
      <Group align="center" justify="space-between" mt="xs" wrap="nowrap">
        <Text c="dimmed" size="xs">
          {draft.length}/{ALT_MAX_LENGTH}
        </Text>
        <Group gap="xs">
          <Button onClick={cancel} size="compact-xs" variant="default">
            {t("Cancel")}
          </Button>
          <Button onClick={save} size="compact-xs">
            {t("Save")}
          </Button>
        </Group>
      </Group>
    </Paper>
  ) : null;

  return { button, isEditing: showInput, panel };
}
