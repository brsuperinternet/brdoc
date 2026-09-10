import { atom } from "jotai";
import { atomFamily } from "jotai/utils";
import type { RowReferences } from "@/ee/base/types/base.types";

// Per-base normalized store of resolved reference entities, hydrated from each
// rows-page `references`. Keyed by pageId, matching base-atoms.ts.
export const referenceStoreAtomFamily = atomFamily((_pageId: string) =>
  atom<RowReferences>({ pages: {}, users: {} })
);

export function mergeReferences(
  prev: RowReferences,
  next: RowReferences | undefined
): RowReferences {
  if (!next) {
    return prev;
  }
  return {
    pages: { ...prev.pages, ...next.pages },
    users: { ...prev.users, ...next.users },
  };
}
