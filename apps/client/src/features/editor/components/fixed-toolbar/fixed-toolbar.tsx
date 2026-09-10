import type { Editor } from "@tiptap/react";
import { useAtomValue } from "jotai";
import { FC } from "react";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms";
import { workspaceAtom } from "@/features/user/atoms/current-user-atom";
import classes from "./fixed-toolbar.module.css";
import { AlignmentGroup } from "./groups/alignment-group";
import { BlockTypeGroup } from "./groups/block-type-group";
import { ColorGroup } from "./groups/color-group";
import { HistoryGroup } from "./groups/history-group";
import { InlineMarksGroup } from "./groups/inline-marks-group";
import { ListsGroup } from "./groups/lists-group";
import { MediaGroup } from "./groups/media-group";
import { MoreInsertsGroup } from "./groups/more-inserts-group";
import { QuickInsertsGroup } from "./groups/quick-inserts-group";
import { useToolbarState } from "./use-toolbar-state";

type FixedToolbarProps = {
  editor?: Editor | null;
  templateMode?: boolean;
};

export const FixedToolbar: FC<FixedToolbarProps> = ({
  editor: editorProp,
  templateMode = false,
}) => {
  const editorFromAtom = useAtomValue(pageEditorAtom);
  const editor = editorProp ?? editorFromAtom;
  const state = useToolbarState(editor);
  const workspace = useAtomValue(workspaceAtom);
  const isGenerativeAiEnabled = workspace?.settings?.ai?.generative === true;

  return (
    <>
      <div
        aria-label="Editor toolbar"
        className={classes.fixedToolbar}
        data-fixed-toolbar="true"
        onMouseDown={(e) => e.preventDefault()}
        role="toolbar"
      >
        <div className={classes.inner}>
          {/* {isGenerativeAiEnabled && (
            <>
              <AskAiGroup />
              <div className={classes.divider} />
            </>
          )} */}
          {editor && state && (
            <>
              <BlockTypeGroup editor={editor} />
              <div className={classes.divider} />
              <InlineMarksGroup editor={editor} state={state} />
              <div className={classes.divider} />
              <ColorGroup editor={editor} />
              <div className={classes.divider} />
              <ListsGroup editor={editor} state={state} />
              <div className={classes.divider} />
              <AlignmentGroup editor={editor} />
              <div className={classes.divider} />
              <MediaGroup editor={editor} templateMode={templateMode} />
              <div className={classes.divider} />
              <QuickInsertsGroup editor={editor} />
              <MoreInsertsGroup editor={editor} templateMode={templateMode} />
              <div className={classes.divider} />
              <HistoryGroup editor={editor} state={state} />
            </>
          )}
        </div>
      </div>
      <div aria-hidden className={classes.spacer} />
    </>
  );
};
