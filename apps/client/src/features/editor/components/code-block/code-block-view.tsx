import { ActionIcon, Group, Select, Tooltip } from "@mantine/core";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import React, { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CopyButton } from "@/components/common/copy-button";
import classes from "./code-block.module.css";

const MermaidView = React.lazy(
  () => import("@/features/editor/components/code-block/mermaid-view.tsx")
);

export default function CodeBlockView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, extension, editor, getPos } = props;
  const { language } = node.attrs;
  const [languageValue, setLanguageValue] = useState<string | null>(
    language || null
  );
  const [isSelected, setIsSelected] = useState(false);

  useEffect(() => {
    const updateSelection = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      // Check if the selection intersects with the node's range
      const isNodeSelected =
        (from >= getPos() && from < getPos() + node.nodeSize) ||
        (to > getPos() && to <= getPos() + node.nodeSize);
      setIsSelected(isNodeSelected);
    };

    editor.on("selectionUpdate", updateSelection);
    return () => {
      editor.off("selectionUpdate", updateSelection);
    };
  }, [editor, getPos(), node.nodeSize]);

  function changeLanguage(language: string) {
    setLanguageValue(language);
    updateAttributes({
      language,
    });
  }

  return (
    <NodeViewWrapper className="codeBlock">
      <Group
        className={classes.menuGroup}
        contentEditable={false}
        justify="flex-end"
      >
        <Select
          checkIconPosition="right"
          classNames={{ input: classes.selectInput }}
          data={extension.options.lowlight.listLanguages().sort()}
          disabled={!editor.isEditable}
          onChange={changeLanguage}
          placeholder="auto"
          searchable
          style={{ maxWidth: "130px" }}
          value={languageValue}
        />

        <CopyButton timeout={2000} value={node?.textContent}>
          {({ copied, copy }) => (
            <Tooltip
              label={copied ? t("Copied") : t("Copy")}
              position="right"
              withArrow
            >
              <ActionIcon
                color={copied ? "teal" : "gray"}
                onClick={copy}
                variant="subtle"
              >
                {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>

      <pre
        hidden={
          ((language === "mermaid" && !editor.isEditable) ||
            (language === "mermaid" && !isSelected)) &&
          node.textContent.length > 0
        }
        spellCheck="false"
      >
        {/* @ts-ignore */}
        <NodeViewContent as="code" className={`language-${language}`} />
      </pre>

      {language === "mermaid" && (
        <Suspense fallback={null}>
          <MermaidView props={props} />
        </Suspense>
      )}
    </NodeViewWrapper>
  );
}
