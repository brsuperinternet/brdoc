import type {
  DateFilterAnchor,
  DateFilterRange,
} from "@/ee/base/types/base.types";

export const DATE_ANCHOR_PRESETS: {
  value: DateFilterAnchor;
  labelKey: string;
}[] = [
  { labelKey: "Today", value: "today" },
  { labelKey: "Tomorrow", value: "tomorrow" },
  { labelKey: "Yesterday", value: "yesterday" },
  { labelKey: "One week ago", value: "oneWeekAgo" },
  { labelKey: "One week from now", value: "oneWeekFromNow" },
  { labelKey: "One month ago", value: "oneMonthAgo" },
  { labelKey: "One month from now", value: "oneMonthFromNow" },
];

export const DATE_RANGE_PRESETS: {
  value: DateFilterRange;
  labelKey: string;
}[] = [
  { labelKey: "Past week", value: "pastWeek" },
  { labelKey: "Past month", value: "pastMonth" },
  { labelKey: "Past year", value: "pastYear" },
  { labelKey: "This week", value: "thisWeek" },
  { labelKey: "This month", value: "thisMonth" },
  { labelKey: "This year", value: "thisYear" },
  { labelKey: "Next week", value: "nextWeek" },
  { labelKey: "Next month", value: "nextMonth" },
  { labelKey: "Next year", value: "nextYear" },
];

export const ANCHOR_VALUES = new Set<string>(
  DATE_ANCHOR_PRESETS.map((p) => p.value)
);
export const RANGE_VALUES = new Set<string>(
  DATE_RANGE_PRESETS.map((p) => p.value)
);
