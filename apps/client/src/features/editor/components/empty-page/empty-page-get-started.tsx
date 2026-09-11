import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  pageEditorAtom,
  yjsSyncedAtom,
} from "@/features/editor/atoms/editor-atoms";
import classes from "./empty-page-get-started.module.css";

type EmptyPageGetStartedProps = {
  editable: boolean;
};

export function EmptyPageGetStarted({ editable }: EmptyPageGetStartedProps) {
  const { t } = useTranslation();
  const editor = useAtomValue(pageEditorAtom);
  const isSynced = useAtomValue(yjsSyncedAtom);

  const [isEmpty, setIsEmpty] = useState(false);
  useEffect(() => {
    if (!editor) {
      return;
    }
    const sync = () => setIsEmpty(editor.isEmpty);
    sync();
    editor.on("update", sync);
    editor.on("create", sync);
    return () => {
      editor.off("update", sync);
      editor.off("create", sync);
    };
  }, [editor]);

  if (!(editable && editor && isSynced && isEmpty)) {
    return null;
  }

  return (
    <div className={classes.wrapper} contentEditable={false}>
      <span className={classes.label}>{t("Get started with")}</span>
    </div>
  );
}
