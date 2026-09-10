import "@/features/editor/styles/index.css";
import { Heading, UniqueID } from "@docmost/editor-ext";
import { Document } from "@tiptap/extension-document";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Text } from "@tiptap/extension-text";
import { Editor, EditorProvider } from "@tiptap/react";
import { useAtom } from "jotai";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  lightboxRequestAtom,
  readOnlyEditorAtom,
} from "@/features/editor/atoms/editor-atoms.ts";
import LightboxView, {
  getLightboxClickRequest,
} from "@/features/editor/components/common/lightbox-view";
import { TransclusionLookupProvider } from "@/features/editor/components/transclusion/transclusion-lookup-context";
import { mainExtensions } from "@/features/editor/extensions/extensions";
import { useEditorScroll } from "./hooks/use-editor-scroll";

interface PageEditorProps {
  /** Rendered between the title and the content. */
  byline?: React.ReactNode;
  content: any;
  pageId?: string;
  printMode?: boolean;
  /**
   * When rendering inside a public share, pass the share's id (or key). Lookups
   * for transclusion content then resolve against the share graph instead of
   * the viewer's personal permissions, so a share never leaks source content
   * that isn't itself shared.
   */
  shareId?: string;
  /**
   * When rendering inside a public space, pass the space slug. Transclusion
   * lookups then resolve against the published space instead of the viewer's
   * personal permissions.
   */
  spaceSlug?: string;
  title: string;
  /** Set false when the consumer renders its own end matter (e.g. prev/next). */
  trailingSpace?: boolean;
}

export default function ReadonlyPageEditor({
  title,
  content,
  pageId,
  printMode = false,
  shareId,
  spaceSlug,
  byline,
  trailingSpace = true,
}: PageEditorProps) {
  const [, setReadOnlyEditor] = useAtom(readOnlyEditorAtom);
  const [lightboxRequest, setLightboxRequest] = useAtom(lightboxRequestAtom);
  const [contentEditor, setContentEditor] = useState<Editor | null>(null);
  const isComponentMounted = useRef(false);
  const editorCreated = useRef(false);
  const isPublicView = Boolean(shareId || spaceSlug);

  const canScroll = useCallback(
    () => isComponentMounted.current && editorCreated.current,
    [isComponentMounted, editorCreated]
  );
  const initialScrollTo = window.location.hash
    ? window.location.hash.slice(1)
    : "";
  const { handleScrollTo } = useEditorScroll({ canScroll, initialScrollTo });

  useEffect(() => {
    isComponentMounted.current = true;
  }, []);

  useEffect(() => {
    if (!isPublicView) {
      return;
    }
    setLightboxRequest(null);
  }, [pageId, isPublicView]);

  const extensions = useMemo(() => {
    const excludedExtensions = new Set([
      "uniqueID",
      ...(printMode ? ["tableHeaderPin", "tableReadonlySort"] : []),
    ]);
    const filteredExtensions = mainExtensions.filter(
      (ext) => !excludedExtensions.has(ext.name)
    );

    return [
      ...filteredExtensions,
      UniqueID.configure({
        types: ["heading", "paragraph"],
        updateDocument: false,
      }),
    ];
  }, [printMode]);

  const titleExtensions = [
    Document.extend({
      content: "heading",
    }),
    Heading,
    Text,
    Placeholder.configure({
      placeholder: "Untitled",
      showOnlyWhenEditable: false,
    }),
  ];

  return (
    <TransclusionLookupProvider shareId={shareId} spaceSlug={spaceSlug}>
      <div className="page-title">
        <EditorProvider
          content={title}
          editable={false}
          extensions={titleExtensions}
          immediatelyRender={true}
          textDirection="auto"
        />
      </div>

      {byline}

      <EditorProvider
        content={content}
        editable={false}
        editorProps={
          isPublicView
            ? {
                handleClickOn: (_view, _pos, node) => {
                  const request = getLightboxClickRequest(node);
                  if (!request) {
                    return false;
                  }

                  setLightboxRequest(request);
                  return true;
                },
              }
            : undefined
        }
        extensions={extensions}
        immediatelyRender={true}
        onCreate={({ editor }) => {
          if (editor) {
            if (pageId) {
              // @ts-expect-error
              editor.storage.pageId = pageId;
            }
            // @ts-expect-error
            setReadOnlyEditor(editor);
            setContentEditor(editor);

            handleScrollTo(editor);
            editorCreated.current = true;
          }
        }}
        textDirection="auto"
      />
      {isPublicView && contentEditor && (
        <LightboxView
          editor={contentEditor}
          onClose={() => setLightboxRequest(null)}
          open={!!lightboxRequest}
          src={lightboxRequest?.src ?? ""}
          type={lightboxRequest?.type ?? "image"}
        />
      )}
      {trailingSpace && <div style={{ paddingBottom: "20vh" }} />}
    </TransclusionLookupProvider>
  );
}
