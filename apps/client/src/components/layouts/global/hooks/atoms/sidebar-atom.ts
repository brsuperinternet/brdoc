import { atom } from "jotai";
import { atomWithWebStorage } from "@/lib/jotai-helper.ts";

export const mobileSidebarAtom = atom<boolean>(false);

export const desktopSidebarAtom = atomWithWebStorage<boolean>(
  "showSidebar",
  true
);

export const desktopAsideAtom = atom<boolean>(false);

// Valid `tab` values: "" | "comments" | "toc" | "chat" | "details"
type AsideStateType = {
  tab: string;
  isAsideOpen: boolean;
};

export const asideStateAtom = atom<AsideStateType>({
  isAsideOpen: false,
  tab: "",
});

export const sidebarWidthAtom = atomWithWebStorage<number>("sidebarWidth", 300);
