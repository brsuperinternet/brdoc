import { Group, NumberInput, Select, Text } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useTranslation } from "react-i18next";
import {
  ExpirationMode,
  PeriodUnit,
} from "@/ee/page-verification/types/page-verification.types";
import i18n from "@/i18n.ts";

export const PERIOD_UNIT_DAYS: Record<PeriodUnit, number> = {
  day: 1,
  month: 30,
  week: 7,
  year: 365,
};

export const PERIOD_UNIT_MAX_AMOUNT: Record<PeriodUnit, number> = {
  day: 3650,
  month: 120,
  week: 520,
  year: 20,
};

export const PERIOD_AMOUNT_MIN = 1;

export function addDays(days: number, from?: Date): Date {
  const date = from ? new Date(from) : new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function formatShortDate(date: Date): string {
  const crossesYear = date.getFullYear() !== new Date().getFullYear();
  return date.toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "short",
    ...(crossesYear && { year: "numeric" }),
  });
}

function formatLongDate(date: Date): string {
  return date.toLocaleDateString(i18n.language, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function toLocalDateString(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pluralizeUnit(
  unit: PeriodUnit,
  amount: number,
  t: (key: string) => string
): string {
  switch (unit) {
    case "day":
      return amount === 1 ? t("day") : t("days");
    case "week":
      return amount === 1 ? t("week") : t("weeks");
    case "month":
      return amount === 1 ? t("month") : t("months");
    case "year":
      return amount === 1 ? t("year") : t("years");
  }
}

function buildModeOptions(
  t: (key: string) => string
): { value: ExpirationMode; label: string }[] {
  return [
    { label: t("Period"), value: "period" },
    { label: t("Fixed date"), value: "fixed" },
    { label: t("Indefinitely"), value: "indefinite" },
  ];
}

function buildUnitOptions(
  t: (key: string) => string
): { value: PeriodUnit; label: string }[] {
  return [
    { label: t("Days"), value: "day" },
    { label: t("Weeks"), value: "week" },
    { label: t("Months"), value: "month" },
    { label: t("Years"), value: "year" },
  ];
}

type ExpirationFieldsProps = {
  mode: ExpirationMode;
  periodAmount: number;
  periodUnit: PeriodUnit;
  fixedDate: string;
  onModeChange: (mode: ExpirationMode) => void;
  onPeriodAmountChange: (amount: number) => void;
  onPeriodUnitChange: (unit: PeriodUnit) => void;
  onFixedDateChange: (iso: string) => void;
  baseDate?: Date;
};

export function ExpirationFields({
  mode,
  periodAmount,
  periodUnit,
  fixedDate,
  onModeChange,
  onPeriodAmountChange,
  onPeriodUnitChange,
  onFixedDateChange,
  baseDate,
}: ExpirationFieldsProps) {
  const { t } = useTranslation();
  const modeOptions = buildModeOptions(t);
  const unitOptions = buildUnitOptions(t);

  const unitMax = PERIOD_UNIT_MAX_AMOUNT[periodUnit];

  const handleUnitChange = (nextUnit: PeriodUnit) => {
    const nextMax = PERIOD_UNIT_MAX_AMOUNT[nextUnit];
    if (periodAmount > nextMax) {
      onPeriodAmountChange(nextMax);
    }
    onPeriodUnitChange(nextUnit);
  };

  const amountValid =
    Number.isInteger(periodAmount) &&
    periodAmount >= PERIOD_AMOUNT_MIN &&
    periodAmount <= unitMax;

  const nextDueDate =
    mode === "period" && amountValid
      ? addDays(periodAmount * PERIOD_UNIT_DAYS[periodUnit], baseDate)
      : null;

  const fixedDateObj = fixedDate ? new Date(fixedDate) : null;

  let helperText: string | null = null;
  let helperError = false;
  if (mode === "period" && !amountValid) {
    helperText = t("Maximum is {{max}} {{unit}} for this unit", {
      max: unitMax,
      unit: pluralizeUnit(periodUnit, unitMax, t),
    });
    helperError = true;
  } else if (mode === "period" && nextDueDate && amountValid) {
    helperText = t(
      "Re-verifies every {{amount}} {{unit}} · Next due {{date}}",
      {
        amount: periodAmount,
        date: formatShortDate(nextDueDate),
        unit: pluralizeUnit(periodUnit, periodAmount, t),
      }
    );
  } else if (mode === "fixed" && fixedDateObj) {
    helperText = t(
      "Expires on {{date}}. Re-verifying won't change the deadline.",
      { date: formatLongDate(fixedDateObj) }
    );
  } else if (mode === "indefinite") {
    helperText = t("Never expires. Verifiers can re-verify at any time.");
  }

  return (
    <div>
      <Group align="flex-start" gap="xs" wrap="wrap">
        <Select
          allowDeselect={false}
          data={modeOptions}
          onChange={(val) => val && onModeChange(val as ExpirationMode)}
          style={{ flex: "1 1 140px", minWidth: 140 }}
          value={mode}
          variant="filled"
        />

        {mode === "period" && (
          <Group
            gap="xs"
            style={{ flex: "1 1 220px", minWidth: 220 }}
            wrap="nowrap"
          >
            <NumberInput
              clampBehavior="blur"
              hideControls
              max={unitMax}
              min={PERIOD_AMOUNT_MIN}
              onChange={(val) => {
                const n =
                  typeof val === "number"
                    ? val
                    : Number.parseInt(String(val), 10);
                if (!Number.isNaN(n)) {
                  onPeriodAmountChange(n);
                }
              }}
              style={{ flex: "0 0 80px" }}
              value={periodAmount}
              variant="filled"
            />
            <Select
              allowDeselect={false}
              data={unitOptions}
              onChange={(val) => val && handleUnitChange(val as PeriodUnit)}
              style={{ flex: 1, minWidth: 120 }}
              value={periodUnit}
              variant="filled"
            />
          </Group>
        )}

        {mode === "fixed" && (
          <DateInput
            clearable
            minDate={addDays(1)}
            onChange={(val) => onFixedDateChange(val ?? "")}
            placeholder={t("Pick a date")}
            style={{ flex: "1 1 200px", minWidth: 180 }}
            value={fixedDate || undefined}
            variant="filled"
          />
        )}
      </Group>

      {helperText && (
        <Text c={helperError ? "red" : "dimmed"} mt={6} size="xs">
          {helperText}
        </Text>
      )}
    </div>
  );
}
