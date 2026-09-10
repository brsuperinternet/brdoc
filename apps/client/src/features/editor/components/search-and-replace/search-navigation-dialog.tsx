import { isEditorReady } from "@docmost/editor-ext";
import { ActionIcon, Dialog, Flex, Text, Tooltip } from "@mantine/core";
import {
  IconArrowNarrowDown,
  IconArrowNarrowUp,
  IconX,
} from "@tabler/icons-react";
import { useEditor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import classes from "./search-replace.module.css";

interface SearchNavigationDialogProps {
  editor: ReturnType<typeof useEditor>;
}

interface SearchNavigationEvent extends CustomEvent {
  detail: {
    searchTerms: string[];
    wholeWord?: boolean;
  };
}

function SearchNavigationDialog({ editor }: SearchNavigationDialogProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const [resultState, setResultState] = useState({
    resultIndex: 0,
    resultsLength: 0,
  });

  const goToSelection = () => {
    if (!isEditorReady(editor)) {
      return;
    }

    const { results, resultIndex } = editor.storage.searchAndReplace;
    const position = results[resultIndex];

    setResultState({
      resultIndex,
      resultsLength: results.length,
    });

    if (!position) {
      return;
    }
    requestAnimationFrame(() => {
      document
        .querySelector(".search-result-current")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
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

  const close = useCallback(() => {
    if (!openRef.current) {
      return;
    }

    openRef.current = false;
    setOpen(false);
    if (isEditorReady(editor)) {
      editor.commands.setSearchTerms([""]);
    }
    const nextParams = new URLSearchParams(location.search);
    nextParams.delete("q");
    nextParams.delete("m");
    const nextSearch = nextParams.toString();
    navigate(
      {
        hash: location.hash,
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : "",
      },
      { replace: true }
    );
  }, [editor, location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const { searchTerms: terms, wholeWord = true } = (
        event as SearchNavigationEvent
      ).detail;

      if (!(terms?.length && isEditorReady(editor))) {
        return;
      }

      openRef.current = false;
      editor.commands.setSearchTerms(terms);
      editor.commands.setWholeWord(wholeWord);
      editor.commands.resetIndex();

      const { results, resultIndex } = editor.storage.searchAndReplace;
      openRef.current = true;
      if (results.length === 0) {
        close();
        return;
      }

      setOpen(true);
      setResultState({
        resultIndex,
        resultsLength: results.length,
      });

      goToSelection();
    };

    const handleClose = () => {
      if (openRef.current) {
        close();
      }
    };

    document.addEventListener("openSearchNavigationDialog", handleOpen);
    document.addEventListener("openFindDialogFromEditor", handleClose);
    document.addEventListener("closeFindDialogFromEditor", handleClose);

    return () => {
      document.removeEventListener("openSearchNavigationDialog", handleOpen);
      document.removeEventListener("openFindDialogFromEditor", handleClose);
      document.removeEventListener("closeFindDialogFromEditor", handleClose);
    };
  }, [close, editor]);

  useEffect(() => {
    const handleTransaction = () => {
      if (!openRef.current || editor.isDestroyed) {
        return;
      }

      const { results } = editor.storage.searchAndReplace;
      if (results.length === 0) {
        close();
      }
    };

    editor.on("transaction", handleTransaction);
    return () => {
      editor.off("transaction", handleTransaction);
    };
  }, [close, editor]);

  return (
    <Dialog
      aria-label="Search navigation"
      className={classes.findDialog}
      opened={open}
      position={{ right: 50, top: 90 }}
      radius="md"
      size="xs"
      w="auto"
      withBorder
    >
      <Flex align="center" gap="xs">
        <Text size="xs" style={{ flex: 1 }}>
          {resultState.resultsLength > 0
            ? `${resultState.resultIndex + 1}/${resultState.resultsLength}`
            : t("Not found")}
        </Text>
        <Tooltip label="Previous match">
          <ActionIcon
            aria-label="Previous match"
            color="gray"
            disabled={resultState.resultsLength === 0}
            onClick={previous}
            variant="subtle"
          >
            <IconArrowNarrowUp size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Next match">
          <ActionIcon
            aria-label="Next match"
            color="gray"
            disabled={resultState.resultsLength === 0}
            onClick={next}
            variant="subtle"
          >
            <IconArrowNarrowDown size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Close">
          <ActionIcon
            aria-label="Close"
            color="gray"
            onClick={close}
            variant="subtle"
          >
            <IconX size={16} />
          </ActionIcon>
        </Tooltip>
      </Flex>
    </Dialog>
  );
}

export default SearchNavigationDialog;
