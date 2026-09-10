import {
  IconAlignLeft,
  IconCalendar,
  IconCheckbox,
  IconCircleDot,
  IconClockEdit,
  IconClockPlus,
  IconFileDescription,
  IconHash,
  IconLetterT,
  IconLink,
  IconMail,
  IconMathFunction,
  IconPaperclip,
  IconProgressCheck,
  IconTags,
  IconUser,
  IconUserEdit,
} from "@tabler/icons-react";
import { CellCheckbox } from "@/ee/base/components/cells/cell-checkbox";
import { CellCreatedAt } from "@/ee/base/components/cells/cell-created-at";
import { CellDate } from "@/ee/base/components/cells/cell-date";
import { CellEmail } from "@/ee/base/components/cells/cell-email";
import { CellFile } from "@/ee/base/components/cells/cell-file";
import { CellFormula } from "@/ee/base/components/cells/cell-formula";
import { CellLastEditedAt } from "@/ee/base/components/cells/cell-last-edited-at";
import { CellLastEditedBy } from "@/ee/base/components/cells/cell-last-edited-by";
import { CellLongText } from "@/ee/base/components/cells/cell-long-text";
import { CellMultiSelect } from "@/ee/base/components/cells/cell-multi-select";
import { CellNumber } from "@/ee/base/components/cells/cell-number";
import { CellPage } from "@/ee/base/components/cells/cell-page";
import { CellPerson } from "@/ee/base/components/cells/cell-person";
import { CellSelect } from "@/ee/base/components/cells/cell-select";
import { CellStatus } from "@/ee/base/components/cells/cell-status";
import { CellText } from "@/ee/base/components/cells/cell-text";
import { CellUrl } from "@/ee/base/components/cells/cell-url";
import { defaultStatusChoices } from "@/ee/base/components/property/choice-editor";
import type { BasePropertyType, TypeOptions } from "@/ee/base/types/base.types";
import type { ClientPropertyTypeDescriptor } from "./property-type.descriptor";

export const PROPERTY_TYPE_REGISTRY: Record<
  BasePropertyType,
  ClientPropertyTypeDescriptor
> = {
  checkbox: {
    cellComponent: CellCheckbox,
    filterInput: "boolean",
    filterOperators: ["eq", "isEmpty", "isNotEmpty"],
    hasOptions: true,
    icon: IconCheckbox,
    isSystem: false,
    labelKey: "Checkbox",
    type: "checkbox",
  },
  createdAt: {
    cellComponent: CellCreatedAt,
    filterInput: "date",
    filterOperators: [
      "eq",
      "before",
      "after",
      "onOrBefore",
      "onOrAfter",
      "isWithin",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: false,
    icon: IconClockPlus,
    isSystem: true,
    labelKey: "Created at",
    systemAccessor: (row) => row.createdAt,
    type: "createdAt",
  },
  date: {
    cellComponent: CellDate,
    filterInput: "date",
    filterOperators: [
      "eq",
      "before",
      "after",
      "onOrBefore",
      "onOrAfter",
      "isWithin",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: true,
    icon: IconCalendar,
    isSystem: false,
    labelKey: "Date",
    type: "date",
  },
  email: {
    cellComponent: CellEmail,
    filterInput: "text",
    filterOperators: [
      "eq",
      "neq",
      "contains",
      "ncontains",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: true,
    icon: IconMail,
    isSystem: false,
    labelKey: "Email",
    type: "email",
  },
  file: {
    cellComponent: CellFile,
    filterInput: "text",
    filterOperators: ["isEmpty", "isNotEmpty"],
    hasOptions: false,
    icon: IconPaperclip,
    isSystem: false,
    labelKey: "File",
    type: "file",
  },
  formula: {
    cellComponent: CellFormula,
    filterInput: "text",
    filterOperators: ["eq", "neq", "isEmpty", "isNotEmpty"],
    hasOptions: false,
    icon: IconMathFunction,
    isSystem: true,
    labelKey: "Formula",
    type: "formula",
  },
  lastEditedAt: {
    cellComponent: CellLastEditedAt,
    filterInput: "date",
    filterOperators: [
      "eq",
      "before",
      "after",
      "onOrBefore",
      "onOrAfter",
      "isWithin",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: false,
    icon: IconClockEdit,
    isSystem: true,
    labelKey: "Last edited at",
    systemAccessor: (row) => row.updatedAt,
    type: "lastEditedAt",
  },
  lastEditedBy: {
    cellComponent: CellLastEditedBy,
    filterInput: "person",
    filterOperators: ["eq", "neq", "any", "none", "isEmpty", "isNotEmpty"],
    hasOptions: false,
    icon: IconUserEdit,
    isSystem: true,
    labelKey: "Last edited by",
    systemAccessor: (row) => row.lastUpdatedById ?? row.creatorId,
    type: "lastEditedBy",
  },
  longText: {
    cellComponent: CellLongText,
    filterInput: "text",
    filterOperators: [
      "eq",
      "neq",
      "contains",
      "ncontains",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: true,
    icon: IconAlignLeft,
    isSystem: false,
    labelKey: "Long text",
    type: "longText",
  },
  multiSelect: {
    cellComponent: CellMultiSelect,
    filterInput: "choices",
    filterOperators: ["any", "none", "isEmpty", "isNotEmpty"],
    hasOptions: true,
    icon: IconTags,
    isSystem: false,
    labelKey: "Multi-select",
    type: "multiSelect",
  },
  number: {
    cellComponent: CellNumber,
    defaultTypeOptions: () => ({ separators: "local" }),
    filterInput: "number",
    filterOperators: ["eq", "neq", "gt", "lt", "isEmpty", "isNotEmpty"],
    hasOptions: true,
    icon: IconHash,
    isSystem: false,
    labelKey: "Number",
    type: "number",
  },
  page: {
    cellComponent: CellPage,
    filterInput: "text",
    filterOperators: ["isEmpty", "isNotEmpty"],
    hasOptions: false,
    icon: IconFileDescription,
    isSystem: false,
    labelKey: "Page",
    type: "page",
  },
  person: {
    cellComponent: CellPerson,
    filterInput: "person",
    filterOperators: ["eq", "neq", "any", "none", "isEmpty", "isNotEmpty"],
    hasOptions: true,
    icon: IconUser,
    isSystem: false,
    labelKey: "Person",
    type: "person",
  },
  select: {
    cellComponent: CellSelect,
    filterInput: "choices",
    filterOperators: ["eq", "neq", "any", "none", "isEmpty", "isNotEmpty"],
    hasOptions: true,
    icon: IconCircleDot,
    isSystem: false,
    labelKey: "Select",
    type: "select",
  },
  status: {
    cellComponent: CellStatus,
    defaultTypeOptions: () => {
      const choices = defaultStatusChoices();
      return {
        choiceOrder: choices.map((c) => c.id),
        choices,
        defaultValue: choices[0].id,
      };
    },
    filterInput: "choices",
    filterOperators: ["eq", "neq", "any", "none", "isEmpty", "isNotEmpty"],
    hasOptions: true,
    icon: IconProgressCheck,
    isSystem: false,
    labelKey: "Status",
    type: "status",
  },
  text: {
    cellComponent: CellText,
    filterInput: "text",
    filterOperators: [
      "eq",
      "neq",
      "contains",
      "ncontains",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: true,
    icon: IconLetterT,
    isSystem: false,
    labelKey: "Text",
    type: "text",
  },
  url: {
    cellComponent: CellUrl,
    filterInput: "text",
    filterOperators: [
      "eq",
      "neq",
      "contains",
      "ncontains",
      "isEmpty",
      "isNotEmpty",
    ],
    hasOptions: true,
    icon: IconLink,
    isSystem: false,
    labelKey: "URL",
    type: "url",
  },
};

export function getDescriptor(
  type: string
): ClientPropertyTypeDescriptor | undefined {
  return (
    PROPERTY_TYPE_REGISTRY as Record<string, ClientPropertyTypeDescriptor>
  )[type];
}

export const SYSTEM_PROPERTY_TYPES: ReadonlySet<string> = new Set(
  Object.values(PROPERTY_TYPE_REGISTRY)
    .filter((d) => d.isSystem)
    .map((d) => d.type)
);

export function isSystemPropertyType(type: string): boolean {
  return SYSTEM_PROPERTY_TYPES.has(type);
}

export const DEFAULT_FILTER_OPERATORS = ["eq", "neq", "isEmpty", "isNotEmpty"];

export const PROPERTY_PICKER_ORDER: BasePropertyType[] = [
  "text",
  "longText",
  "number",
  "select",
  "status",
  "multiSelect",
  "date",
  "person",
  "file",
  "formula",
  "page",
  "checkbox",
  "url",
  "email",
  "createdAt",
  "lastEditedAt",
  "lastEditedBy",
];

export const propertyTypes = PROPERTY_PICKER_ORDER.map((type) => {
  const d = getDescriptor(type)!;
  return { icon: d.icon, labelKey: d.labelKey, type };
});

export function systemAccessorFor(type: string) {
  return getDescriptor(type)?.systemAccessor;
}

export function defaultTypeOptionsFor(type: string): TypeOptions {
  return getDescriptor(type)?.defaultTypeOptions?.() ?? ({} as TypeOptions);
}
