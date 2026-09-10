import "katex/dist/katex.min.css";
import { ActionIcon, Flex, Popover, Stack, Textarea } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { IconTrashX } from "@tabler/icons-react";
import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import katex from "katex";
//import "katex/dist/contrib/mhchem.min.js";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { v4 } from "uuid";
import classes from "./math.module.css";

export default function MathBlockView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, editor, getPos } = props;
  const mathResultContainer = useRef<HTMLDivElement>(null);
  const mathPreviewContainer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [debouncedPreview] = useDebouncedValue(preview, 500);

  const renderMath = (
    katexString: string,
    container: HTMLDivElement | null
  ) => {
    try {
      katex.render(katexString, container!, {
        displayMode: true,
        strict: false,
      });
      setError(null);
    } catch (e) {
      //console.error(e.message);
      setError(e.message);
    }
  };

  useEffect(() => {
    renderMath(node.attrs.text, mathResultContainer.current);
  }, [node.attrs.text]);

  useEffect(() => {
    if (isEditing) {
      renderMath(preview || "", mathPreviewContainer.current);
    }
  }, [preview, isEditing]);

  useEffect(() => {
    if (debouncedPreview !== null) {
      queueMicrotask(() => {
        updateAttributes({ text: debouncedPreview });
      });
    }
  }, [debouncedPreview]);

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
    <Popover
      id={v4()}
      opened={isEditing && editor.isEditable}
      position="top"
      shadow="md"
      trapFocus
      width={500}
      withArrow={true}
      zIndex={101}
    >
      <Popover.Target>
        <NodeViewWrapper
          className={[
            classes.mathBlock,
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
            style={{
              display: isEditing && preview?.length ? undefined : "none",
            }}
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
      <Popover.Dropdown>
        <Stack>
          <Textarea
            autosize
            classNames={{ input: classes.textInput }}
            draggable="false"
            maxRows={8}
            minRows={4}
            onBlur={(e) => {
              e.preventDefault();
            }}
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
                (e.key === "ArrowLeft" || e.key === "ArrowUp") &&
                selectionStart === selectionEnd &&
                selectionStart === 0
              ) {
                editor.commands.focus(getPos() - 1);
              }

              if (
                (e.key === "ArrowRight" || e.key === "ArrowDown") &&
                selectionStart === selectionEnd &&
                selectionStart === textAreaRef.current?.value.length
              ) {
                editor.commands.focus(getPos() + node.nodeSize);
              }
            }}
            placeholder={"E = mc^2"}
            ref={textAreaRef}
            value={preview ?? ""}
          />

          <Flex align="flex-end" justify="flex-end">
            <ActionIcon
              aria-label={t("Delete equation")}
              color="red"
              onClick={() => props.deleteNode()}
              variant="light"
            >
              <IconTrashX size={18} />
            </ActionIcon>
          </Flex>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
