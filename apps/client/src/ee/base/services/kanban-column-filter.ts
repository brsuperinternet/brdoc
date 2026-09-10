import { normalizeFilter } from "@/ee/base/queries/base-row-query";
import {
  FilterGroup,
  FilterNode,
  NO_VALUE_CHOICE_ID,
} from "@/ee/base/types/base.types";

export function buildColumnFilter(
  viewFilter: FilterGroup | undefined,
  groupByPropertyId: string,
  columnKey: string
): FilterNode | undefined {
  const condition =
    columnKey === NO_VALUE_CHOICE_ID
      ? { op: "isEmpty" as const, propertyId: groupByPropertyId }
      : { op: "eq" as const, propertyId: groupByPropertyId, value: columnKey };
  const children: FilterGroup["children"] = viewFilter?.children?.length
    ? [viewFilter, condition]
    : [condition];
  return normalizeFilter({ children, op: "and" });
}
