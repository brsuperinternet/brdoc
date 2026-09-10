import "@/features/editor/styles/index.css";
import { UniqueID } from "@docmost/editor-ext";
import { Title } from "@mantine/core";
import { EditorProvider } from "@tiptap/react";
import { useMemo } from "react";
import TemplateMeta from "@/ee/template/components/template-meta";
import { ITemplate } from "@/ee/template/types/template.types";
import { mainExtensions } from "@/features/editor/extensions/extensions";

type ReadonlyTemplateEditorProps = {
  template: ITemplate;
};

export default function ReadonlyTemplateEditor({
  template,
}: ReadonlyTemplateEditorProps) {
  const extensions = useMemo(() => {
    const filteredExtensions = mainExtensions.filter(
      (ext) => ext.name !== "uniqueID"
    );

    return [
      ...filteredExtensions,
      UniqueID.configure({
        types: ["heading", "paragraph"],
        updateDocument: false,
      }),
    ];
  }, []);

  return (
    <>
      <div style={{ padding: "0 3rem" }}>
        <Title lh={1.2} order={1} size="2.5rem">
          {template.title || "Untitled"}
        </Title>

        <TemplateMeta template={template} />
      </div>

      <EditorProvider
        content={template.content}
        editable={false}
        extensions={extensions}
        immediatelyRender={true}
        textDirection="auto"
      />
    </>
  );
}
