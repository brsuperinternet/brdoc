import { useAtom } from "jotai";
import { asideStateAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom";

export const ASIDE_PANEL_ID = "aside-panel";

const useToggleAside = () => {
  const [asideState, setAsideState] = useAtom(asideStateAtom);

  const toggleAside = (tab: string) => {
    if (asideState.tab === tab) {
      setAsideState({ isAsideOpen: !asideState.isAsideOpen, tab });
    } else {
      setAsideState({ isAsideOpen: true, tab });
    }
  };

  return toggleAside;
};

export const useAsideTriggerProps = (tab: string) => {
  const [asideState, setAsideState] = useAtom(asideStateAtom);

  return {
    "aria-controls": ASIDE_PANEL_ID,
    "aria-expanded": asideState.isAsideOpen && asideState.tab === tab,
    onClick: () => {
      if (asideState.tab === tab) {
        setAsideState({ isAsideOpen: !asideState.isAsideOpen, tab });
      } else {
        setAsideState({ isAsideOpen: true, tab });
      }
    },
  } as const;
};

export default useToggleAside;
