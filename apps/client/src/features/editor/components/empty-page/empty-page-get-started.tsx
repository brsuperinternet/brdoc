import { Button } from "@mantine/core";
import { IconLayoutKanban, IconTable } from "@tabler/icons-react";
import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useConvertPageToBaseMutation } from "@/ee/base/queries/base-query";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import {
  pageEditorAtom,
  yjsSyncedAtom,
} from "@/features/editor/atoms/editor-atoms";
import classes from "./empty-page-get-started.module.css";

type EmptyPageGetStartedProps = {
  pageId: string;
  editable: boolean;
};

export function EmptyPageGetStarted({
  pageId,
  editable,
}: EmptyPageGetStartedProps) {
  const { t } = useTranslation();
  const editor = useAtomValue(pageEditorAtom);
  const isSynced = useAtomValue(yjsSyncedAtom);
  const hasBases = useHasFeature(Feature.BASES);
  const convertMutation = useConvertPageToBaseMutation();

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

  if (!(editable && hasBases && editor && isSynced && isEmpty)) {
    return null;
  }

  const chips = [
    {
      disabled: convertMutation.isPending,
      icon: IconTable,
      key: "base",
      label: t("Base"),
      onClick: () => convertMutation.mutate({ pageId }),
    },
    {
      disabled: convertMutation.isPending,
      icon: IconLayoutKanban,
      key: "kanban",
      label: t("Kanban"),
      onClick: () => convertMutation.mutate({ pageId, template: "kanban" }),
    },
  ];

  return (
    <div className={classes.wrapper} contentEditable={false}>
      <span className={classes.label}>{t("Get started with")}</span>
      <div className={classes.chipRow}>
        {chips.map((chip) => (
          <Button
            disabled={chip.disabled}
            key={chip.key}
            leftSection={<chip.icon size={16} />}
            onClick={chip.onClick}
            radius="xl"
            size="xs"
            variant="default"
          >
            {chip.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
