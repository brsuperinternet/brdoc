import { IRoleData } from "@/lib/types";
import { PagePermissionRole } from "./page-permission.types";

export const pagePermissionRoleData: IRoleData[] = [
  {
    description: "Can edit page and manage access",
    label: "Can edit",
    value: PagePermissionRole.WRITER,
  },
  {
    description: "Can only view page",
    label: "Can view",
    value: PagePermissionRole.READER,
  },
];

export function getPagePermissionRoleLabel(value: string): string | undefined {
  const role = pagePermissionRoleData.find((item) => item.value === value);
  return role ? role.label : undefined;
}
