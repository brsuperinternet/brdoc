import { TextSelection } from "@tiptap/pm/state";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { readOnlyEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";
import {
  HeadingLink,
  recalculateLinks,
} from "@/features/editor/components/table-of-contents/table-of-contents.tsx";
import styles from "./docs.module.css";

function getHeaderOffset(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(
    "--docs-header-h"
  );
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 56 : parsed;
}

export default function DocsToc() {
  const { t } = useTranslation();
  const editor = useAtomValue(readOnlyEditorAtom);
  const [links, setLinks] = useState<HeadingLink[]>([]);
  const [headingDOMNodes, setHeadingDOMNodes] = useState<HTMLElement[]>([]);
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);

  const handleUpdate = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    const result = recalculateLinks(editor.$nodes("heading"));
    setLinks(result.links);
    setHeadingDOMNodes(result.nodes);
  }, [editor]);

  useEffect(() => {
    // "create" repopulates once the editor view mounts after this component.
    editor?.on("create", handleUpdate);
    editor?.on("update", handleUpdate);
    handleUpdate();

    return () => {
      editor?.off("create", handleUpdate);
      editor?.off("update", handleUpdate);
    };
  }, [editor, handleUpdate]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveElement(entry.target as HTMLElement);
          }
        });
      },
      {
        root: null,
        rootMargin: `-${getHeaderOffset()}px 0px -85% 0px`,
        threshold: 0,
      }
    );

    headingDOMNodes.forEach((heading) => observer.observe(heading));
    return () => {
      headingDOMNodes.forEach((heading) => observer.unobserve(heading));
    };
  }, [headingDOMNodes]);

  const handleScrollToHeading = (position: number) => {
    if (!editor || editor.isDestroyed) {
      return;
    }
    const { view } = editor;

    const { node } = view.domAtPos(position);
    const element = node as HTMLElement;
    const scrollPosition =
      element.getBoundingClientRect().top +
      window.scrollY -
      getHeaderOffset() -
      16;

    window.scrollTo({ behavior: "smooth", top: scrollPosition });

    const tr = view.state.tr;
    tr.setSelection(new TextSelection(tr.doc.resolve(position)));
    view.dispatch(tr);
    view.focus();
  };

  if (!links.length) {
    return null;
  }

  const minLevel = Math.min(...links.map((link) => link.level));
  const effectiveActive = activeElement ?? links[0]?.element;

  return (
    <div>
      <span className={styles.tocLabel}>{t("On this page")}</span>
      <div className={styles.tocList}>
        {links.map((item, idx) => (
          <button
            className={styles.tocLink}
            data-active={item.element === effectiveActive || undefined}
            key={idx}
            onClick={() => handleScrollToHeading(item.position)}
            style={{
              paddingLeft: `${(item.level - minLevel) * 12 + 11}px`,
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
