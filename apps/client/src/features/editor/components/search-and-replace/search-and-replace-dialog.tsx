import { isEditorReady } from "@docmost/editor-ext";
import {
  ActionIcon,
  Button,
  Dialog,
  Flex,
  Input,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { getHotkeyHandler, useToggle } from "@mantine/hooks";
import {
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconLetterCase,
  IconReplace,
  IconSearch,
  IconX,
} from "@tabler/icons-react";
import { useEditor } from "@tiptap/react";
import { useAtom } from "jotai";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { searchAndReplaceStateAtom } from "@/features/editor/components/search-and-replace/atoms/search-and-replace-state-atom.ts";
import classes from "./search-replace.module.css";

interface PageFindDialogDialogProps {
  editable?: boolean;
  editor: ReturnType<typeof useEditor>;
}

function SearchAndReplaceDialog({
  editor,
  editable = true,
}: PageFindDialogDialogProps) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [pageFindState, setPageFindState] = useAtom(searchAndReplaceStateAtom);
  const inputRef = useRef(null);

  const [replaceButton, replaceButtonToggle] = useToggle([
    { color: "gray", isReplaceShow: false },
    { color: "blue", isReplaceShow: true },
  ]);

  const [caseSensitive, caseSensitiveToggle] = useToggle([
    { color: "gray", isCaseSensitive: false },
    { color: "blue", isCaseSensitive: true },
  ]);

  const searchInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const replaceInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReplaceText(event.target.value);
  };

  const closeDialog = () => {
    setSearchText("");
    setReplaceText("");
    setPageFindState({ isOpen: false });
    // Reset replace button state when closing
    if (replaceButton.isReplaceShow) {
      replaceButtonToggle();
    }
    // Clear search term in editor
    if (isEditorReady(editor)) {
      editor.commands.setSearchTerms([""]);
    }
  };

  const goToSelection = () => {
    if (!isEditorReady(editor)) {
      return;
    }

    const { results, resultIndex } = editor.storage.searchAndReplace;
    //TODO: check type error
    //@ts-expect-error
    const position: Range = results[resultIndex];

    if (!position) {
      return;
    }

    // @ts-expect-error
    editor.commands.setTextSelection(position);

    const element = document.querySelector(".search-result-current");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    editor.commands.setTextSelection(0);
  };

  const next = () => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.nextSearchResult();
    goToSelection();
  };

  const previous = () => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.previousSearchResult();
    goToSelection();
  };

  const replace = () => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replace();
    goToSelection();
  };

  const replaceAll = () => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.setReplaceTerm(replaceText);
    editor.commands.replaceAll();
  };

  useEffect(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.setSearchTerms([searchText]);
    editor.commands.resetIndex();
    editor.commands.selectCurrentItem();
  }, [searchText]);

  const handleOpenEvent = (e) => {
    setPageFindState({ isOpen: true });
    if (!isEditorReady(editor)) {
      return;
    }
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to
    );
    if (selectedText !== "") {
      setSearchText(selectedText);
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  };

  const handleCloseEvent = (e) => {
    closeDialog();
  };

  useEffect(() => {
    !pageFindState.isOpen && closeDialog();

    document.addEventListener("openFindDialogFromEditor", handleOpenEvent);
    document.addEventListener("closeFindDialogFromEditor", handleCloseEvent);

    return () => {
      document.removeEventListener("openFindDialogFromEditor", handleOpenEvent);
      document.removeEventListener(
        "closeFindDialogFromEditor",
        handleCloseEvent
      );
    };
  }, [pageFindState.isOpen]);

  useEffect(() => {
    if (!isEditorReady(editor)) {
      return;
    }
    editor.commands.setCaseSensitive(caseSensitive.isCaseSensitive);
    editor.commands.resetIndex();
    goToSelection();
  }, [caseSensitive]);

  const resultsCount = useMemo(
    () =>
      searchText.trim() === ""
        ? ""
        : editor?.storage?.searchAndReplace?.results.length > 0
          ? editor?.storage?.searchAndReplace?.resultIndex +
            1 +
            "/" +
            editor?.storage?.searchAndReplace?.results.length
          : t("Not found"),
    [
      searchText,
      editor?.storage?.searchAndReplace?.resultIndex,
      editor?.storage?.searchAndReplace?.results.length,
    ]
  );

  const location = useLocation();
  useEffect(() => {
    if (pageFindState.isOpen) {
      closeDialog();
    }
  }, [location.pathname]);

  return (
    <Dialog
      aria-label={t("Find and replace")}
      className={classes.findDialog}
      opened={pageFindState.isOpen}
      position={{ right: 50, top: 90 }}
      radius="md"
      size="lg"
      transitionProps={{ transition: "slide-down" }}
      w={"auto"}
      withBorder
    >
      <Stack gap="xs">
        <Flex align="center" gap="xs">
          <Input
            aria-label={t("Find")}
            autoFocus
            leftSection={<IconSearch size={16} />}
            onChange={searchInputEvent}
            onKeyDown={getHotkeyHandler([
              ["Enter", next],
              ["shift+Enter", previous],
              ["alt+C", caseSensitiveToggle],
              //@ts-expect-error
              ...(editable ? [["alt+R", replaceButtonToggle]] : []),
            ])}
            placeholder={t("Find")}
            ref={inputRef}
            rightSection={
              <Text size="xs" ta="right">
                {resultsCount}
              </Text>
            }
            rightSectionPointerEvents="all"
            rightSectionWidth="70"
            size="xs"
            value={searchText}
            w={220}
          />

          <ActionIcon.Group>
            <Tooltip label={t("Previous match (Shift+Enter)")}>
              <ActionIcon
                aria-label={t("Previous match (Shift+Enter)")}
                color="gray"
                onClick={previous}
                variant="subtle"
              >
                <IconArrowNarrowUp
                  stroke={1.5}
                  style={{ height: "70%", width: "70%" }}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("Next match (Enter)")}>
              <ActionIcon
                aria-label={t("Next match (Enter)")}
                color="gray"
                onClick={next}
                variant="subtle"
              >
                <IconArrowNarrowDown
                  stroke={1.5}
                  style={{ height: "70%", width: "70%" }}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t("Match case (Alt+C)")}>
              <ActionIcon
                aria-label={t("Match case (Alt+C)")}
                aria-pressed={caseSensitive.isCaseSensitive}
                color={caseSensitive.color}
                onClick={() => caseSensitiveToggle()}
                variant="subtle"
              >
                <IconLetterCase
                  stroke={1.5}
                  style={{ height: "70%", width: "70%" }}
                />
              </ActionIcon>
            </Tooltip>
            {editable && (
              <Tooltip label={t("Replace")}>
                <ActionIcon
                  aria-label={t("Replace")}
                  aria-pressed={replaceButton.isReplaceShow}
                  color={replaceButton.color}
                  onClick={() => replaceButtonToggle()}
                  variant="subtle"
                >
                  <IconReplace
                    stroke={1.5}
                    style={{ height: "70%", width: "70%" }}
                  />
                </ActionIcon>
              </Tooltip>
            )}
            <Tooltip label={t("Close (Escape)")}>
              <ActionIcon
                aria-label={t("Close (Escape)")}
                color="gray"
                onClick={closeDialog}
                variant="subtle"
              >
                <IconX stroke={1.5} style={{ height: "70%", width: "70%" }} />
              </ActionIcon>
            </Tooltip>
          </ActionIcon.Group>
        </Flex>
        {replaceButton.isReplaceShow && editable && (
          <Flex align="center" gap="xs">
            <Input
              aria-label={t("Replace")}
              autoFocus
              leftSection={<IconReplace size={16} />}
              onChange={replaceInputEvent}
              onKeyDown={getHotkeyHandler([
                ["Enter", replace],
                ["ctrl+alt+Enter", replaceAll],
              ])}
              placeholder={t("Replace")}
              rightSection={<div />}
              rightSectionPointerEvents="all"
              size="xs"
              value={replaceText}
              w={180}
            />
            <ActionIcon.Group>
              <Tooltip label={t("Replace (Enter)")}>
                <Button
                  color="gray"
                  onClick={replace}
                  size="xs"
                  variant="subtle"
                >
                  {t("Replace")}
                </Button>
              </Tooltip>
              <Tooltip label={t("Replace all (Ctrl+Alt+Enter)")}>
                <Button
                  color="gray"
                  onClick={replaceAll}
                  size="xs"
                  variant="subtle"
                >
                  {t("Replace all")}
                </Button>
              </Tooltip>
            </ActionIcon.Group>
          </Flex>
        )}
      </Stack>
    </Dialog>
  );
}

export default SearchAndReplaceDialog;
