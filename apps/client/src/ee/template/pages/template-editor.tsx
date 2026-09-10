import "@/features/editor/styles/index.css";
import {
  ActionIcon,
  Button,
  Container,
  Group,
  Popover,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure, useWindowEvent } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowLeft,
  IconCheck,
  IconMoodSmile,
  IconSettings,
} from "@tabler/icons-react";
import { EditorContent, useEditor } from "@tiptap/react";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import EmojiPicker from "@/components/ui/emoji-picker";
import { EditorAiMenu } from "@/ee/ai/components/editor/ai-menu/ai-menu";
import TemplateMeta from "@/ee/template/components/template-meta";
import { EditorBubbleMenu } from "@/features/editor/components/bubble-menu/bubble-menu";
import CalloutMenu from "@/features/editor/components/callout/callout-menu.tsx";
import ColumnsMenu from "@/features/editor/components/columns/columns-menu.tsx";
import { FixedToolbar } from "@/features/editor/components/fixed-toolbar/fixed-toolbar";
import { EditorLinkMenu } from "@/features/editor/components/link/link-menu";
import { TableHandlesLayer } from "@/features/editor/components/table/handle/table-handles-layer";
import TableMenu from "@/features/editor/components/table/table-menu.tsx";
import { templateExtensions } from "@/features/editor/extensions/extensions";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import { userAtom } from "@/features/user/atoms/current-user-atom";
import useUserRole from "@/hooks/use-user-role";
import {
  useGetTemplateByIdQuery,
  useUpdateTemplateMutation,
} from "../queries/template-query";
import classes from "./template-editor.module.css";

export default function TemplateEditor() {
  const { t } = useTranslation();
  const { templateId } = useParams<{ templateId: string }>();
  const { isAdmin: isWorkspaceAdmin } = useUserRole();
  const user = useAtomValue(userAtom);
  const editorToolbarEnabled =
    user?.settings?.preferences?.editorToolbar ?? false;

  const { data: existingTemplate } = useGetTemplateByIdQuery(templateId || "");
  const { data: spaces } = useGetSpacesQuery({ limit: 100 });
  const updateMutation = useUpdateTemplateMutation();
  const updateMutationRef = useRef(updateMutation.mutateAsync);
  updateMutationRef.current = updateMutation.mutateAsync;

  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [draftSpaceId, setDraftSpaceId] = useState<string | null>(null);
  const [settingsOpened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);

  useWindowEvent("keydown", (event) => {
    if (settingsOpened && event.key === "Escape") {
      event.stopPropagation();
      event.preventDefault();
      closeSettings();
    }
  });

  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const titleRef = useRef(title);
  const iconRef = useRef(icon);
  const spaceIdRef = useRef(spaceId);
  const loadedRef = useRef(false);
  const isDirtyRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedFadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    content: "",
    editorProps: {
      handleDOMEvents: {
        keydown: (_view, event) => {
          if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
            const slashCommand = document.querySelector("#slash-command");
            if (slashCommand) {
              return true;
            }
          }
        },
      },
      scrollMargin: 80,
      scrollThreshold: 80,
    },
    extensions: templateExtensions,
    onUpdate() {
      if (loadedRef.current) {
        markDirty();
      }
    },
    textDirection: "auto",
  });

  // Load template data into editor
  useEffect(() => {
    if (existingTemplate && editor && !editor.isDestroyed) {
      loadedRef.current = false;
      setTitle(existingTemplate.title || "");
      setIcon(existingTemplate.icon || null);
      setSpaceId(existingTemplate.spaceId || null);
      titleRef.current = existingTemplate.title || "";
      iconRef.current = existingTemplate.icon || null;
      spaceIdRef.current = existingTemplate.spaceId || null;
      if (existingTemplate.content) {
        editor.commands.setContent(existingTemplate.content);
      }
      requestAnimationFrame(() => {
        loadedRef.current = true;
      });
    }
  }, [existingTemplate, editor]);

  const spaceOptions = [
    ...(isWorkspaceAdmin
      ? [{ group: t("Workspace"), items: [{ label: t("Global"), value: "" }] }]
      : []),
    ...(spaces?.items?.length
      ? [
          {
            group: t("Spaces"),
            items: spaces.items.map((s) => ({ label: s.name, value: s.id })),
          },
        ]
      : []),
  ];

  // Save function
  const save = useCallback(async () => {
    if (!(editor && templateId && titleRef.current.trim())) {
      return;
    }
    if (!isDirtyRef.current) {
      return;
    }

    setSaveStatus("saving");
    try {
      await updateMutationRef.current({
        content: editor.getJSON(),
        icon: iconRef.current || undefined,
        spaceId: spaceIdRef.current,
        templateId,
        title: titleRef.current,
      });
      isDirtyRef.current = false;
      setSaveStatus("saved");

      if (savedFadeTimerRef.current) {
        clearTimeout(savedFadeTimerRef.current);
      }
      savedFadeTimerRef.current = setTimeout(() => {
        setSaveStatus((prev) => (prev === "saved" ? "idle" : prev));
      }, 3000);
    } catch {
      setSaveStatus("error");
    }
  }, [editor, templateId]);

  // Schedule save 30s after last change
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      save();
    }, 30_000);
  }, [save]);

  // Mark content as dirty and schedule save
  const markDirty = useCallback(() => {
    isDirtyRef.current = true;
    setSaveStatus("idle");
    scheduleSave();
  }, [scheduleSave]);

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      titleRef.current = value;
      if (loadedRef.current) {
        markDirty();
      }
    },
    [markDirty]
  );

  const handleIconChange = useCallback(
    (value: string | null) => {
      setIcon(value);
      iconRef.current = value;
      if (loadedRef.current) {
        markDirty();
      }
    },
    [markDirty]
  );

  const handleSpaceIdChange = useCallback(
    (value: string | null) => {
      setSpaceId(value);
      spaceIdRef.current = value;
      if (loadedRef.current) {
        markDirty();
      }
    },
    [markDirty]
  );

  // beforeunload warning for unsaved changes
  // If user cancels (stays on page), the save fires and completes.
  // If user leaves, the save is fire-and-forget.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
        save();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [save]);

  // Save on unmount if dirty
  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (savedFadeTimerRef.current) {
        clearTimeout(savedFadeTimerRef.current);
      }
      if (isDirtyRef.current) {
        save();
      }
    },
    [save]
  );

  // Manual retry for error state
  const handleRetry = useCallback(() => {
    save();
  }, [save]);

  return (
    <>
      <DocumentTitle title={t("Edit template")} />

      {editorToolbarEnabled && editor && (
        <FixedToolbar editor={editor} templateMode />
      )}

      <div className={classes.header}>
        <Container h="100%" px={0} size={900}>
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Link className={classes.backLink} to="/templates">
              <IconArrowLeft size={16} />
              {t("Templates")}
            </Link>

            <Group gap="xs" wrap="nowrap">
              {saveStatus === "saving" && (
                <Text c="dimmed" size="xs">
                  {t("Saving...")}
                </Text>
              )}
              {saveStatus === "saved" && (
                <Group gap={4} wrap="nowrap">
                  <IconCheck color="var(--mantine-color-green-6)" size={14} />
                  <Text c="dimmed" size="xs">
                    {t("Saved")}
                  </Text>
                </Group>
              )}
              {saveStatus === "error" && (
                <Text
                  c="red"
                  onClick={handleRetry}
                  size="xs"
                  style={{ cursor: "pointer" }}
                >
                  {t("Save failed. Retry")}
                </Text>
              )}

              <Popover
                onDismiss={closeSettings}
                opened={settingsOpened}
                position="bottom"
                shadow="md"
                width={300}
              >
                <Popover.Target>
                  <ActionIcon
                    aria-label={t("Template settings")}
                    color="gray"
                    onClick={() => {
                      setDraftSpaceId(spaceId);
                      openSettings();
                    }}
                    size="md"
                    variant="subtle"
                  >
                    <IconSettings size={18} />
                  </ActionIcon>
                </Popover.Target>
                <Popover.Dropdown>
                  <Stack gap="sm">
                    <Select
                      comboboxProps={{ withinPortal: false }}
                      data={spaceOptions}
                      description={t(
                        "Choose which space this template belongs to"
                      )}
                      label={t("Scope")}
                      onChange={(val) => setDraftSpaceId(val || null)}
                      searchable
                      size="sm"
                      value={draftSpaceId || ""}
                    />
                    <Group justify="flex-end" mt="xs">
                      <Button
                        onClick={closeSettings}
                        size="xs"
                        variant="default"
                      >
                        {t("Cancel")}
                      </Button>
                      <Button
                        onClick={() => {
                          const scopeChanged = draftSpaceId !== spaceId;
                          handleSpaceIdChange(draftSpaceId);
                          closeSettings();
                          if (scopeChanged) {
                            notifications.show({
                              message: t("Template scope updated"),
                            });
                          }
                        }}
                        size="xs"
                      >
                        {t("Save")}
                      </Button>
                    </Group>
                  </Stack>
                </Popover.Dropdown>
              </Popover>
            </Group>
          </Group>
        </Container>
      </div>

      <Container className={classes.editor} size={900}>
        <div className={classes.titleArea}>
          <div className={classes.emojiButton}>
            <EmojiPicker
              actionIconProps={
                icon ? { size: "3rem", variant: "transparent" } : undefined
              }
              icon={
                icon ? (
                  <span className={classes.emojiIcon}>{icon}</span>
                ) : (
                  <IconMoodSmile size={20} stroke={1.5} />
                )
              }
              onEmojiSelect={(emoji: { native: string }) =>
                handleIconChange(emoji.native)
              }
              readOnly={false}
              removeEmojiAction={() => handleIconChange(null)}
            />
          </div>
          <input
            autoFocus
            className={classes.titleInput}
            onChange={(e) => handleTitleChange(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (editor && !editor.isDestroyed) {
                  editor.commands.focus("start");
                }
              }
            }}
            placeholder={t("Untitled")}
            value={title}
          />
          {existingTemplate && <TemplateMeta template={existingTemplate} />}
        </div>
        <EditorContent editor={editor} />
        {editor && (
          <>
            <EditorAiMenu editor={editor} />
            <EditorBubbleMenu editor={editor} templateMode />
            <EditorLinkMenu editor={editor} />
            <TableMenu editor={editor} />
            <TableHandlesLayer editor={editor} />
            <CalloutMenu editor={editor} />
            <ColumnsMenu editor={editor} />
          </>
        )}
        <div
          onClick={() => {
            if (editor && !editor.isDestroyed) {
              editor.commands.focus("end");
            }
          }}
          style={{ paddingBottom: "20vh" }}
        />
      </Container>
    </>
  );
}
