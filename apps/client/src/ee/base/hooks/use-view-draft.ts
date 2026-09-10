import { useAtom } from "jotai";
import { RESET } from "jotai/utils";
import { useCallback, useMemo } from "react";
import { viewDraftAtomFamily } from "@/ee/base/atoms/view-draft-atom";
import {
  BaseViewDraft,
  FilterGroup,
  ViewConfig,
  ViewConfigPatch,
  ViewSortConfig,
} from "@/ee/base/types/base.types";

export type UseViewDraftArgs = {
  userId: string | undefined;
  pageId: string | undefined;
  viewId: string | undefined;
  baselineFilter: FilterGroup | undefined;
  baselineSorts: ViewSortConfig[] | undefined;
};

export type ViewDraftState = {
  draft: BaseViewDraft | null;
  effectiveFilter: FilterGroup | undefined;
  effectiveSorts: ViewSortConfig[] | undefined;
  isDirty: boolean;
  setFilter: (filter: FilterGroup | undefined) => void;
  setSorts: (sorts: ViewSortConfig[] | undefined) => void;
  reset: () => void;
  buildPromotedConfig: (baseline: ViewConfig) => ViewConfigPatch;
};

// JSON-stringify equality suffices for FilterGroup and ViewSortConfig[]: both
// are pure data trees with stable insertion order, so the same graph always
// serializes identically. Avoids a deep-equal dependency for two simple types.
function filterEq(a: FilterGroup | undefined, b: FilterGroup | undefined) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}
function sortsEq(
  a: ViewSortConfig[] | undefined,
  b: ViewSortConfig[] | undefined
) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function useViewDraft(args: UseViewDraftArgs): ViewDraftState {
  const { userId, pageId, viewId, baselineFilter, baselineSorts } = args;
  const ready = !!(userId && pageId && viewId);

  // Always mount with a stable key so hook order is consistent. Not read/written when not ready.
  const atomKey = useMemo(
    () => ({
      pageId: pageId ?? "",
      userId: userId ?? "",
      viewId: viewId ?? "",
    }),
    [userId, pageId, viewId]
  );
  const [storedDraft, setDraft] = useAtom(viewDraftAtomFamily(atomKey));

  const draft = ready ? storedDraft : null;

  const setFilter = useCallback(
    (next: FilterGroup | undefined) => {
      if (!ready) {
        return;
      }
      const current = storedDraft ?? null;
      // If a baseline filter exists, clearing to undefined would fall back to it
      // in effectiveFilter. Persist an empty AND-group to explicitly override it.
      const mergedFilter =
        next === undefined && baselineFilter !== undefined
          ? ({ children: [], op: "and" } as FilterGroup)
          : next;
      const mergedSorts = current?.sorts;
      if (
        mergedFilter === undefined &&
        (mergedSorts === undefined || mergedSorts === null)
      ) {
        setDraft(RESET);
        return;
      }
      setDraft({
        filter: mergedFilter,
        sorts: mergedSorts,
        updatedAt: new Date().toISOString(),
      });
    },
    [ready, storedDraft, setDraft, baselineFilter]
  );

  const setSorts = useCallback(
    (next: ViewSortConfig[] | undefined) => {
      if (!ready) {
        return;
      }
      const current = storedDraft ?? null;
      const mergedFilter = current?.filter;
      // If baseline sorts exist, clearing to undefined would fall back to them.
      // Persist an empty array to explicitly override with no sorts.
      const mergedSorts =
        next === undefined &&
        baselineSorts !== undefined &&
        baselineSorts.length > 0
          ? []
          : next;
      if (
        mergedFilter === undefined &&
        (mergedSorts === undefined || mergedSorts === null)
      ) {
        setDraft(RESET);
        return;
      }
      setDraft({
        filter: mergedFilter,
        sorts: mergedSorts,
        updatedAt: new Date().toISOString(),
      });
    },
    [ready, storedDraft, setDraft, baselineSorts]
  );

  const reset = useCallback(() => {
    if (!ready) {
      return;
    }
    setDraft(RESET);
  }, [ready, setDraft]);

  const effectiveFilter = useMemo(
    () => (draft?.filter === undefined ? baselineFilter : draft.filter),
    [draft?.filter, baselineFilter]
  );
  const effectiveSorts = useMemo(
    () => (draft?.sorts === undefined ? baselineSorts : draft.sorts),
    [draft?.sorts, baselineSorts]
  );

  const isDirty = useMemo(() => {
    if (!draft) {
      return false;
    }
    const filterDirty =
      draft.filter !== undefined && !filterEq(draft.filter, baselineFilter);
    const sortsDirty =
      draft.sorts !== undefined && !sortsEq(draft.sorts, baselineSorts);
    return filterDirty || sortsDirty;
  }, [draft, baselineFilter, baselineSorts]);

  const buildPromotedConfig = useCallback(
    (baseline: ViewConfig): ViewConfigPatch => ({
      filter: draft?.filter ?? baseline.filter ?? null,
      sorts: draft?.sorts ?? baseline.sorts ?? null,
    }),
    [draft]
  );

  if (!ready) {
    return {
      buildPromotedConfig: (baseline) => ({
        filter: baseline.filter ?? null,
        sorts: baseline.sorts ?? null,
      }),
      draft: null,
      effectiveFilter: baselineFilter,
      effectiveSorts: baselineSorts,
      isDirty: false,
      reset: () => {},
      setFilter: () => {},
      setSorts: () => {},
    };
  }

  return {
    buildPromotedConfig,
    draft,
    effectiveFilter,
    effectiveSorts,
    isDirty,
    reset,
    setFilter,
    setSorts,
  };
}
