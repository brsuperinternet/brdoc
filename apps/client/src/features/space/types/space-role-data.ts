import { IRoleData, SpaceRole } from "@/lib/types.ts";

export const spaceRoleData: IRoleData[] = [
  {
    description: "Has full access to space settings and pages.",
    label: "Full access",
    value: SpaceRole.ADMIN,
  },
  {
    description: "Can create and edit pages in space.",
    label: "Can edit",
    value: SpaceRole.WRITER,
  },
  {
    description: "Can view pages in space but not edit.",
    label: "Can view",
    value: SpaceRole.READER,
  },
];

export function getSpaceRoleLabel(value: string) {
  const role = spaceRoleData.find((item) => item.value === value);
  return role ? role.label : undefined;
}
