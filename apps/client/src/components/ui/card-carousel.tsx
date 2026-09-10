import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import classes from "./card-carousel.module.css";

type Props = {
  children: ReactNode;
  ariaLabel?: string;
};

export default function CardCarousel({ children, ariaLabel }: Props) {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) {
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = trackRef.current;
    if (!el) {
      return;
    }

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    for (const child of Array.from(el.children)) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, [updateScrollState, children]);

  const scrollBy = (direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) {
      return;
    }
    el.scrollBy({
      behavior: "smooth",
      left: direction * el.clientWidth * 0.85,
    });
  };

  return (
    <div className={classes.root}>
      <div
        className={classes.track}
        onScroll={updateScrollState}
        ref={trackRef}
        {...(ariaLabel ? { "aria-label": ariaLabel, role: "region" } : {})}
      >
        {children}
      </div>

      <button
        aria-label={t("Scroll left")}
        className={`${classes.arrow} ${classes.arrowLeft} ${canScrollLeft ? classes.visible : ""}`}
        onClick={() => scrollBy(-1)}
        tabIndex={canScrollLeft ? 0 : -1}
        type="button"
      >
        <IconChevronLeft size={18} />
      </button>

      <button
        aria-label={t("Scroll right")}
        className={`${classes.arrow} ${classes.arrowRight} ${canScrollRight ? classes.visible : ""}`}
        onClick={() => scrollBy(1)}
        tabIndex={canScrollRight ? 0 : -1}
        type="button"
      >
        <IconChevronRight size={18} />
      </button>
    </div>
  );
}
