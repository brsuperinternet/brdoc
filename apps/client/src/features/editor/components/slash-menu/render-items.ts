import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import { ReactRenderer, useEditor } from "@tiptap/react";
import CommandList from "@/features/editor/components/slash-menu/command-list";

const renderItems = () => {
  let component: ReactRenderer | null = null;
  let popup: HTMLElement | null = null;
  let cleanup: (() => void) | null = null;
  let getReferenceClientRect: (() => DOMRect) | null = null;

  const updatePosition = () => {
    if (!(popup && getReferenceClientRect)) {
      return;
    }

    // @ts-expect-error
    const rect = getReferenceClientRect();

    computePosition({ getBoundingClientRect: () => rect }, popup, {
      middleware: [offset(0), flip(), shift()],
      placement: "bottom-start",
    }).then(({ x, y }) => {
      if (popup) {
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
      }
    });
  };

  return {
    onExit: () => {
      if (cleanup) {
        cleanup();
        cleanup = null;
      }

      if (popup) {
        popup.remove();
        popup = null;
      }

      if (component) {
        component.destroy();
        component = null;
      }
    },
    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (props.event.key === "Escape") {
        if (popup) {
          popup.style.display = "none";
        }

        return true;
      }

      // @ts-expect-error
      return component?.ref?.onKeyDown(props);
    },
    onStart: (props: {
      editor: ReturnType<typeof useEditor>;
      clientRect: DOMRect;
    }) => {
      component = new ReactRenderer(CommandList, {
        editor: props.editor,
        props,
      });

      if (!props.clientRect) {
        return;
      }

      // @ts-expect-error
      getReferenceClientRect = props.clientRect;

      popup = document.createElement("div");
      popup.style.zIndex = "199";
      popup.style.position = "absolute";
      popup.style.top = "0";
      popup.style.left = "0";

      document.body.appendChild(popup);
      popup.appendChild(component.element);

      cleanup = autoUpdate(
        // @ts-expect-error
        {
          getBoundingClientRect: () =>
            getReferenceClientRect ? getReferenceClientRect() : new DOMRect(),
        },
        popup,
        updatePosition
      );
    },
    onUpdate: (props: {
      editor: ReturnType<typeof useEditor>;
      clientRect: DOMRect;
    }) => {
      component?.updateProps(props);

      if (!props.clientRect) {
        return;
      }

      // @ts-expect-error
      getReferenceClientRect = props.clientRect;
      updatePosition();
    },
  };
};

export default renderItems;
