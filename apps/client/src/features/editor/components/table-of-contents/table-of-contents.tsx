import { Box, Text, Title } from "@mantine/core";
import { TextSelection } from "@tiptap/pm/state";
import { NodePos, useEditor } from "@tiptap/react";
import clsx from "clsx";
import { FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import classes from "./table-of-contents.module.css";

type TableOfContentsProps = {
  editor: ReturnType<typeof useEditor>;
  isShare?: boolean;
};

export type HeadingLink = {
  label: string;
  level: number;
  element: HTMLElement;
  position: number;
};

export const recalculateLinks = (nodePos: NodePos[]) => {
  const nodes: HTMLElement[] = [];

  const links: HeadingLink[] = Array.from(nodePos).reduce<HeadingLink[]>(
    (acc, item) => {
      const label = item.node.textContent;
      const level = Number(item.node.attrs.level);
      if (label.length && level <= 6) {
        acc.push({
          element: item.element,
          label,
          level,
          //@ts-expect-error
          position: item.resolvedPos.pos,
        });
        nodes.push(item.element);
      }
      return acc;
    },
    []
  );
  return { links, nodes };
};

export const TableOfContents: FC<TableOfContentsProps> = (props) => {
  const { t } = useTranslation();
  const [links, setLinks] = useState<HeadingLink[]>([]);
  const [headingDOMNodes, setHeadingDOMNodes] = useState<HTMLElement[]>([]);
  const [activeElement, setActiveElement] = useState<HTMLElement | null>(null);
  const headerPaddingRef = useRef<HTMLDivElement | null>(null);

  const handleScrollToHeading = (position: number) => {
    if (!props.editor || props.editor.isDestroyed) {
      return;
    }
    const { view } = props.editor;

    const headerOffset = Number.parseInt(
      window.getComputedStyle(headerPaddingRef.current).getPropertyValue("top")
    );

    const { node } = view.domAtPos(position);
    const element = node as HTMLElement;
    const scrollPosition =
      element.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      behavior: "smooth",
      top: scrollPosition,
    });

    const tr = view.state.tr;
    tr.setSelection(new TextSelection(tr.doc.resolve(position)));
    view.dispatch(tr);
    view.focus();
  };

  const handleUpdate = () => {
    if (!props.editor || props.editor.isDestroyed) {
      return;
    }

    const result = recalculateLinks(props.editor.$nodes("heading"));

    setLinks(result.links);
    setHeadingDOMNodes(result.nodes);
  };

  useEffect(() => {
    // "create" repopulates once the editor view mounts after this component
    props.editor?.on("create", handleUpdate);
    props.editor?.on("update", handleUpdate);

    return () => {
      props.editor?.off("create", handleUpdate);
      props.editor?.off("update", handleUpdate);
    };
  }, [props.editor]);

  useEffect(
    () => {
      handleUpdate();
    },
    props.isShare ? [props.editor] : []
  );

  useEffect(() => {
    try {
      const observeHandler = (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveElement(entry.target as HTMLElement);
          }
        });
      };

      let headerOffset = 0;
      if (headerPaddingRef.current) {
        headerOffset = Number.parseInt(
          window
            .getComputedStyle(headerPaddingRef.current)
            .getPropertyValue("top")
        );
      }
      const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: `-${headerOffset}px 0px -85% 0px`,
        threshold: 0,
      };
      const observer = new IntersectionObserver(
        observeHandler,
        observerOptions
      );

      headingDOMNodes.forEach((heading) => {
        observer.observe(heading);
      });
      return () => {
        headingDOMNodes.forEach((heading) => {
          observer.unobserve(heading);
        });
      };
    } catch (err) {
      console.log(err);
    }
  }, [headingDOMNodes, props.editor]);

  if (!links.length) {
    return (
      <>
        {!props.isShare && (
          <Text size="sm">
            {t("Add headings (H1, H2, H3) to generate a table of contents.")}
          </Text>
        )}

        {props.isShare && (
          <Text c="dimmed" size="sm">
            {t("No table of contents.")}
          </Text>
        )}
      </>
    );
  }

  return (
    <>
      {props.isShare && (
        <Title fw={500} mb="md" order={2} size="h6">
          {t("Table of contents")}
        </Title>
      )}
      <div className={props.isShare ? classes.leftBorder : ""}>
        {links.map((item, idx) => (
          <Box<"button">
            className={clsx(classes.link, {
              [classes.linkActive]: item.element === activeElement,
            })}
            component="button"
            key={idx}
            onClick={() => handleScrollToHeading(item.position)}
            style={{
              paddingLeft: `calc(${item.level} * var(--mantine-spacing-md))`,
            }}
          >
            {item.label}
          </Box>
        ))}
      </div>
      <div className={classes.headerPadding} ref={headerPaddingRef} />
    </>
  );
};
