import { useDebouncedCallback } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import classes from "@/ee/base/styles/grid.module.css";
import {
  updatePageData,
  usePageQuery,
  useUpdateTitlePageMutation,
} from "@/features/page/queries/page-query";
import { UpdateEvent } from "@/features/websocket/types";
import { useQueryEmit } from "@/features/websocket/use-query-emit";
import localEmitter from "@/lib/local-emitter";

// Editable base name for the inline embed. Follows the TitleEditor convention
// (updatePageData + localEmitter + websocket emit) so the sidebar and other
// clients stay in sync. Standalone pages use the page TitleEditor instead.
export function BaseEmbedTitle({ pageId }: { pageId: string }) {
  const { t } = useTranslation();
  const { data: page } = usePageQuery({ pageId });
  const { mutateAsync: updateTitleAsync } = useUpdateTitlePageMutation();
  const emit = useQueryEmit();
  const [value, setValue] = useState("");
  const focusedRef = useRef(false);

  // Keep in sync with the persisted title but never clobber active user input.
  useEffect(() => {
    if (!focusedRef.current) {
      setValue(page?.title ?? "");
    }
  }, [page?.title]);

  const commit = useCallback(() => {
    const trimmed = value.trim();
    if (!page || trimmed === (page.title ?? "")) {
      return;
    }
    updateTitleAsync({ pageId, title: trimmed }).then((updated) => {
      if (updated.title !== trimmed) {
        return;
      }
      const event: UpdateEvent = {
        entity: ["pages"],
        id: updated.id,
        operation: "updateOne",
        payload: {
          icon: updated.icon,
          parentPageId: updated.parentPageId,
          slugId: updated.slugId,
          title: updated.title,
        },
        spaceId: updated.spaceId,
      };
      updatePageData(updated);
      localEmitter.emit("message", event);
      emit(event);
    });
  }, [value, page, pageId, updateTitleAsync, emit]);

  const debouncedCommit = useDebouncedCallback(commit, 500);

  // Force-save any pending edit on unmount (e.g. navigating away mid-type).
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);
  useEffect(() => () => commitRef.current(), []);

  return (
    <input
      aria-label={t("Base name")}
      className={classes.embedTitleInput}
      onBlur={() => {
        focusedRef.current = false;
        commit();
      }}
      onChange={(e) => {
        setValue(e.currentTarget.value);
        debouncedCommit();
      }}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
        if (e.key === "Escape") {
          setValue(page?.title ?? "");
          e.currentTarget.blur();
        }
      }}
      placeholder={t("Untitled base")}
      value={value}
    />
  );
}
