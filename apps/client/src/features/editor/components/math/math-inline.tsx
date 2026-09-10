import "katex/dist/katex.min.css";
import { Popover, Textarea } from "@mantine/core";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
//import "katex/dist/contrib/mhchem.min.js";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 } from "uuid";
import classes from "./math.module.css";

export default function MathInlineView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, editor, getPos } = props;
  const mathResultContainer = useRef<HTMLDivElement>(null);
  const mathPreviewContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const renderMath = (
    katexString: string,
    container: HTMLDivElement | null
  ) => {
    try {
      katex.render(katexString, container);
      setError(null);
    } catch (e) {
      //console.error(e);
      setError(e.message);
    }
  };

  useEffect(() => {
    renderMath(node.attrs.text, mathResultContainer.current);
  }, [node.attrs.text]);

  useEffect(() => {
    if (isEditing) {
      renderMath(preview || "", mathPreviewContainer.current);
    } else if (preview !== null) {
      queueMicrotask(() => {
        updateAttributes({ text: preview.trim() });
      });
    }
  }, [preview, isEditing]);

  useEffect(() => {
    const pos = getPos();
    const { from, to } = editor.state.selection;
    const nodeSelected =
      props.selected && from === pos && to === pos + node.nodeSize;
    setIsEditing(nodeSelected);
    if (nodeSelected) {
      setPreview(node.attrs.text);
    }
  }, [props.selected]);

  return (
    <>
      <Popover
        id={v4()}
        middlewares={{ flip: true, inline: true, shift: true }}
        opened={isEditing && editor.isEditable}
        position="top"
        shadow="md"
        trapFocus
        width={400}
        withArrow={true}
        zIndex={101}
      >
        <Popover.Target>
          <NodeViewWrapper
            className={[
              classes.mathInline,
              props.selected ? classes.selected : "",
              error ? classes.error : "",
              (isEditing && !preview?.trim().length) ||
              !(isEditing || node.attrs.text.trim().length)
                ? classes.empty
                : "",
            ].join(" ")}
            data-katex="true"
          >
            <div
              ref={mathPreviewContainer}
              style={{ display: isEditing ? undefined : "none" }}
            />
            <div
              ref={mathResultContainer}
              style={{ display: isEditing ? "none" : undefined }}
            />
            {((isEditing && !preview?.trim().length) ||
              !(isEditing || node.attrs.text.trim().length)) && (
              <div>{t("Empty equation")}</div>
            )}
            {error && <div>{t("Invalid equation")}</div>}
          </NodeViewWrapper>
        </Popover.Target>
        <Popover.Dropdown p={"xs"}>
          <Textarea
            autosize
            classNames={{ input: classes.textInput }}
            draggable={false}
            maxRows={5}
            minRows={1}
            onChange={(e) => {
              setPreview(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey)) {
                return editor.commands.focus(getPos() + node.nodeSize);
              }

              if (!textAreaRef.current) {
                return;
              }

              const { selectionStart, selectionEnd } = textAreaRef.current;

              if (
                e.key === "ArrowLeft" &&
                selectionStart === selectionEnd &&
                selectionStart === 0
              ) {
                editor.commands.focus(getPos());
              }

              if (
                e.key === "ArrowRight" &&
                selectionStart === selectionEnd &&
                selectionStart === textAreaRef.current.value.length
              ) {
                editor.commands.focus(getPos() + node.nodeSize);
              }
            }}
            placeholder={"E = mc^2"}
            ref={textAreaRef}
            value={preview ?? ""}
          />
        </Popover.Dropdown>
      </Popover>
    </>
  );
}
