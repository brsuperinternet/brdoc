import { IRoleData, UserRole } from "@/lib/types.ts";

export const userRoleData: IRoleData[] = [
  {
    description: "Can manage workspace",
    label: "Owner",
    value: UserRole.OWNER,
  },
  {
    description: "Can manage workspace but cannot delete it",
    label: "Admin",
    value: UserRole.ADMIN,
  },
  {
    description: "Can become members of groups and spaces in workspace",
    label: "Member",
    value: UserRole.MEMBER,
  },
];

export function getUserRoleLabel(value: string) {
  const role = userRoleData.find((item) => item.value === value);
  return role ? role.label : undefined;
}
