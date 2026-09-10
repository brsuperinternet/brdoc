import { sanitizeUrl } from "@docmost/editor-ext";
import { Badge, Group, Text, Tooltip } from "@mantine/core";
import { IconCheck, IconFileDescription } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CustomAvatar } from "@/components/ui/custom-avatar";
import { BadgeOverflowList } from "@/ee/base/components/cells/badge-overflow";
import { FileValue } from "@/ee/base/components/cells/cell-file";
import { ChoiceBadge } from "@/ee/base/components/cells/choice-badge";
import { choiceColor } from "@/ee/base/components/cells/choice-color";
import { PersonReadList } from "@/ee/base/components/cells/person-read-list";
import {
  formatDateDisplay,
  formatLongTextPreview,
  formatNumber,
  formatTimestamp,
} from "@/ee/base/formatters/cell-formatters";
import {
  useReferenceStore,
  useResolvePage,
} from "@/ee/base/reference/reference-store";
import cellClasses from "@/ee/base/styles/cells.module.css";
import {
  DateTypeOptions,
  IBaseProperty,
  isFormulaErrorCell,
  NumberTypeOptions,
  SelectTypeOptions,
} from "@/ee/base/types/base.types";
import { buildPageUrl, getPageTitle } from "@/features/page/page.utils";

type CardFieldProps = {
  property: IBaseProperty;
  value: unknown;
  pageId: string;
};

export function CardField({ property, value, pageId }: CardFieldProps) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (Array.isArray(value) && value.length === 0) {
    return null;
  }

  switch (property.type) {
    case "text":
      return <TextField value={value} />;
    case "longText":
      return <LongTextField value={value} />;
    case "number":
      return <NumberField property={property} value={value} />;
    case "select":
    case "status":
      return <SelectField property={property} value={value} />;
    case "multiSelect":
      return <MultiSelectField property={property} value={value} />;
    case "date":
      return <DateField property={property} value={value} />;
    case "createdAt":
    case "lastEditedAt":
      return <TimestampField value={value} />;
    case "person":
      return <PersonField pageId={pageId} value={value} />;
    case "lastEditedBy":
      return <LastEditedByField pageId={pageId} value={value} />;
    case "file":
      return <FileField value={value} />;
    case "page":
      return (
        <PageField
          basePageId={pageId}
          propertyPageId={property.pageId}
          value={value}
        />
      );
    case "checkbox":
      return <CheckboxField value={value} />;
    case "url":
      return <UrlField value={value} />;
    case "email":
      return <EmailField value={value} />;
    case "formula":
      return <FormulaField property={property} value={value} />;
    default:
      return (
        <Text lineClamp={1} size="xs">
          {String(value)}
        </Text>
      );
  }
}

function TextField({ value }: { value: unknown }) {
  const text = typeof value === "string" ? value : String(value);
  if (!text) {
    return null;
  }
  return (
    <Text lineClamp={2} size="sm">
      {text}
    </Text>
  );
}

function LongTextField({ value }: { value: unknown }) {
  const preview = formatLongTextPreview(
    typeof value === "string" ? value : undefined
  );
  if (!preview) {
    return null;
  }
  return (
    <Text c="dimmed" lineClamp={2} size="xs">
      {preview}
    </Text>
  );
}

function NumberField({
  value,
  property,
}: {
  value: unknown;
  property: IBaseProperty;
}) {
  const num = typeof value === "number" ? value : null;
  if (num === null) {
    return null;
  }
  const formatted = formatNumber(
    num,
    property.typeOptions as NumberTypeOptions | undefined
  );
  if (!formatted) {
    return null;
  }
  return <Text size="sm">{formatted}</Text>;
}

function SelectField({
  value,
  property,
}: {
  value: unknown;
  property: IBaseProperty;
}) {
  const choices =
    (property.typeOptions as SelectTypeOptions | undefined)?.choices ?? [];
  const selectedId = typeof value === "string" ? value : null;
  const choice = choices.find((c) => c.id === selectedId);
  if (!choice) {
    return null;
  }
  return (
    <ChoiceBadge
      name={choice.name}
      style={{ ...choiceColor(choice.color), alignSelf: "flex-start" }}
    />
  );
}

function MultiSelectField({
  value,
  property,
}: {
  value: unknown;
  property: IBaseProperty;
}) {
  const choices =
    (property.typeOptions as SelectTypeOptions | undefined)?.choices ?? [];
  const selectedIds = Array.isArray(value) ? (value as string[]) : [];
  const selectedChoices = choices.filter((c) => selectedIds.includes(c.id));
  if (selectedChoices.length === 0) {
    return null;
  }
  const chips = selectedChoices.map((choice) => (
    <span
      className={cellClasses.badge}
      key={choice.id}
      style={choiceColor(choice.color)}
    >
      {choice.name}
    </span>
  ));
  return (
    <BadgeOverflowList
      chips={chips}
      measureKey={selectedChoices.map((c) => `${c.id}:${c.name}`).join("|")}
      tooltipLabel={selectedChoices.map((c) => c.name).join(", ")}
    />
  );
}

function DateField({
  value,
  property,
}: {
  value: unknown;
  property: IBaseProperty;
}) {
  const dateStr = typeof value === "string" ? value : null;
  const formatted = formatDateDisplay(
    dateStr,
    property.typeOptions as DateTypeOptions | undefined
  );
  if (!formatted) {
    return null;
  }
  return (
    <Text c="dimmed" size="xs">
      {formatted}
    </Text>
  );
}

function TimestampField({ value }: { value: unknown }) {
  const formatted = formatTimestamp(typeof value === "string" ? value : null);
  if (!formatted) {
    return null;
  }
  return (
    <Text c="dimmed" size="xs">
      {formatted}
    </Text>
  );
}

function PersonField({ value, pageId }: { value: unknown; pageId: string }) {
  const store = useReferenceStore(pageId);
  const personIds = Array.isArray(value)
    ? (value as string[])
    : typeof value === "string"
      ? [value]
      : [];
  if (personIds.length === 0) {
    return null;
  }
  return <PersonReadList personIds={personIds} users={store.users} />;
}

function LastEditedByField({
  value,
  pageId,
}: {
  value: unknown;
  pageId: string;
}) {
  const userId = typeof value === "string" ? value : null;
  const store = useReferenceStore(pageId);
  if (!userId) {
    return null;
  }
  const user = store.users[userId] ?? null;
  const name = user?.name ?? userId.substring(0, 8);
  return (
    <Group gap={6} style={{ overflow: "hidden" }} wrap="nowrap">
      <CustomAvatar
        avatarUrl={user?.avatarUrl ?? ""}
        name={name}
        radius="xl"
        size={20}
      />
      <Tooltip disabled={!name} label={name} openDelay={400} withinPortal>
        <Text size="xs" truncate>
          {name}
        </Text>
      </Tooltip>
    </Group>
  );
}

function FileField({ value }: { value: unknown }) {
  const files = Array.isArray(value)
    ? (value as FileValue[]).filter(
        (f) => f && typeof f === "object" && "id" in f && "fileName" in f
      )
    : [];
  if (files.length === 0) {
    return null;
  }
  const maxVisible = 2;
  const visible = files.slice(0, maxVisible);
  const overflow = files.length - maxVisible;
  return (
    <div className={cellClasses.fileGroup}>
      {visible.map((file) => (
        <span className={cellClasses.fileBadge} key={file.id}>
          {file.fileName}
        </span>
      ))}
      {overflow > 0 && (
        <span className={cellClasses.overflowCount}>+{overflow}</span>
      )}
    </div>
  );
}

function PageField({
  value,
  basePageId,
  propertyPageId,
}: {
  value: unknown;
  basePageId: string;
  propertyPageId: string;
}) {
  const { t } = useTranslation();
  const pageId = typeof value === "string" && value.length > 0 ? value : null;
  const resolvedPage = useResolvePage(propertyPageId, pageId);

  if (!pageId) {
    return null;
  }
  if (resolvedPage === undefined) {
    return null;
  }

  if (resolvedPage === null) {
    return (
      <span className={cellClasses.pageMissing}>
        <IconFileDescription size={14} />
        <span>Page not found</span>
      </span>
    );
  }

  const title = getPageTitle(resolvedPage.title, undefined, t);
  const spaceSlug = resolvedPage.space?.slug ?? "";
  const url = buildPageUrl(spaceSlug, resolvedPage.slugId, title);

  return (
    <Tooltip disabled={!title} label={title} openDelay={400} withinPortal>
      <Link
        className={cellClasses.pagePill}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        to={url}
      >
        {resolvedPage.icon ? (
          <span className={cellClasses.pagePillIcon}>{resolvedPage.icon}</span>
        ) : (
          <IconFileDescription
            className={cellClasses.pagePillIconFallback}
            size={14}
          />
        )}
        <span className={cellClasses.pagePillText}>{title}</span>
      </Link>
    </Tooltip>
  );
}

function CheckboxField({ value }: { value: unknown }) {
  if (value !== true) {
    return null;
  }
  return <IconCheck size={14} />;
}

function UrlField({ value }: { value: unknown }) {
  const displayValue = typeof value === "string" ? value : "";
  if (!displayValue) {
    return null;
  }
  const safeHref = sanitizeUrl(displayValue);
  if (!safeHref) {
    return (
      <Text lineClamp={1} size="xs">
        {displayValue}
      </Text>
    );
  }
  return (
    <Tooltip
      label={displayValue}
      maw={420}
      multiline
      openDelay={400}
      withinPortal
    >
      <a
        className={cellClasses.urlLink}
        href={safeHref}
        onClick={(e) => e.stopPropagation()}
        rel="noopener noreferrer"
        style={{ fontSize: "var(--mantine-font-size-xs)" }}
        target="_blank"
      >
        {displayValue}
      </a>
    </Tooltip>
  );
}

function EmailField({ value }: { value: unknown }) {
  const displayValue = typeof value === "string" ? value : "";
  if (!displayValue) {
    return null;
  }
  return (
    <Tooltip
      label={displayValue}
      maw={420}
      multiline
      openDelay={400}
      withinPortal
    >
      <a
        className={cellClasses.emailLink}
        href={`mailto:${displayValue}`}
        onClick={(e) => e.stopPropagation()}
        style={{ fontSize: "var(--mantine-font-size-xs)" }}
      >
        {displayValue}
      </a>
    </Tooltip>
  );
}

function FormulaField({
  value,
  property,
}: {
  value: unknown;
  property: IBaseProperty;
}) {
  if (isFormulaErrorCell(value)) {
    return (
      <Tooltip label={`${value.__err}: ${value.msg}`} withinPortal>
        <Badge color="red" size="sm" variant="light">
          #ERROR
        </Badge>
      </Tooltip>
    );
  }

  const opts = (property.typeOptions ?? {}) as { resultType?: string };
  const resultType = opts.resultType ?? "null";

  if (resultType === "number") {
    return <NumberField property={property} value={value} />;
  }
  if (resultType === "boolean") {
    return <CheckboxField value={value} />;
  }
  if (resultType === "date") {
    return <DateField property={property} value={value} />;
  }

  const text =
    typeof value === "string" ? value : value == null ? null : String(value);
  if (!text) {
    return null;
  }
  return (
    <Text lineClamp={2} size="sm">
      {text}
    </Text>
  );
}
