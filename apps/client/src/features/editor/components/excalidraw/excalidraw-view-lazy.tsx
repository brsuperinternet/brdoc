import { NodeViewProps } from "@tiptap/react";
import { lazy, Suspense } from "react";

const ExcalidrawView = lazy(
  () => import("@/features/editor/components/excalidraw/excalidraw-view.tsx")
);

export default function ExcalidrawViewLazy(props: NodeViewProps) {
  return (
    <Suspense fallback={null}>
      <ExcalidrawView {...props} />
    </Suspense>
  );
}
