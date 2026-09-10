import {
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconArrowRight, IconShieldLock } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { GeneralAccessSelect, PagePermissionList } from "@/ee/page-permission";
import {
  useAddPagePermissionMutation,
  useRestrictPageMutation,
  useUnrestrictPageMutation,
} from "@/ee/page-permission/queries/page-permission-query";
import {
  IPageRestrictionInfo,
  PagePermissionRole,
} from "@/ee/page-permission/types/page-permission.types";
import { pagePermissionRoleData } from "@/ee/page-permission/types/page-permission-role-data";
import { buildPageUrl } from "@/features/page/page.utils";
import { MultiMemberSelect } from "@/features/space/components/multi-member-select";
import classes from "./page-permission.module.css";

type PagePermissionTabProps = {
  pageId: string;
  restrictionInfo: IPageRestrictionInfo;
};

export function PagePermissionTab({
  pageId,
  restrictionInfo,
}: PagePermissionTabProps) {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [role, setRole] = useState<string>(PagePermissionRole.WRITER);

  const restrictMutation = useRestrictPageMutation();
  const unrestrictMutation = useUnrestrictPageMutation();
  const addPermissionMutation = useAddPagePermissionMutation();

  const hasInheritedRestriction = restrictionInfo.hasInheritedRestriction;
  const hasDirectRestriction = restrictionInfo.hasDirectRestriction;
  const canManage = restrictionInfo.userAccess.canManage;

  const handleDirectAccessChange = async (value: "open" | "restricted") => {
    if (value === "restricted" && !hasDirectRestriction) {
      await restrictMutation.mutateAsync(pageId);
    } else if (value === "open" && hasDirectRestriction) {
      await unrestrictMutation.mutateAsync(pageId);
    }
  };

  const handleAddMembers = async () => {
    if (memberIds.length === 0) {
      return;
    }

    const userIds = memberIds
      .filter((id) => id.startsWith("user-"))
      .map((id) => id.replace("user-", ""));

    const groupIds = memberIds
      .filter((id) => id.startsWith("group-"))
      .map((id) => id.replace("group-", ""));

    await addPermissionMutation.mutateAsync({
      pageId,
      role: role as PagePermissionRole,
      ...(userIds.length > 0 && { userIds }),
      ...(groupIds.length > 0 && { groupIds }),
    });

    setMemberIds([]);
  };

  const handleRemoveAll = async () => {
    await unrestrictMutation.mutateAsync(pageId);
  };

  return (
    <Stack gap="md">
      {hasInheritedRestriction && (
        <Paper className={classes.inheritedSection} p="sm" radius="sm">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon color="orange" radius="sm" size="lg" variant="light">
              <IconShieldLock size={18} stroke={1.5} />
            </ThemeIcon>
            <Box style={{ flex: 1 }}>
              <Text fw={500} size="sm">
                {t("Inherited restriction")}
              </Text>
              <Group gap={4}>
                <Text c="dimmed" size="xs">
                  {t("Access limited by")}
                </Text>
                {restrictionInfo.inheritedFrom && (
                  <Link
                    style={{ textDecoration: "none" }}
                    to={buildPageUrl(
                      spaceSlug,
                      restrictionInfo.inheritedFrom.slugId,
                      restrictionInfo.inheritedFrom.title
                    )}
                  >
                    <Group gap={2}>
                      <Text c="blue" fw={500} size="xs">
                        {restrictionInfo.inheritedFrom.title || t("Untitled")}
                      </Text>
                      <IconArrowRight
                        color="var(--mantine-color-blue-6)"
                        size={12}
                      />
                    </Group>
                  </Link>
                )}
              </Group>
            </Box>
          </Group>
        </Paper>
      )}

      <Box>
        <GeneralAccessSelect
          disabled={!canManage}
          hasInheritedRestriction={hasInheritedRestriction}
          onChange={handleDirectAccessChange}
          value={hasDirectRestriction ? "restricted" : "open"}
        />
        {!(hasDirectRestriction || hasInheritedRestriction) && (
          <Text c="dimmed" mt={4} size="xs">
            {t("Restrict access to control who can view and edit this page")}
          </Text>
        )}
        {!hasDirectRestriction && hasInheritedRestriction && (
          <Text c="dimmed" mt={4} size="xs">
            {t("Add additional restrictions specific to this page")}
          </Text>
        )}
      </Box>

      {hasDirectRestriction && (
        <>
          <Divider />

          {canManage && (
            <Group align="flex-end" gap="xs">
              <Box style={{ flex: 1 }}>
                <MultiMemberSelect onChange={setMemberIds} value={memberIds} />
              </Box>
              <Select
                allowDeselect={false}
                data={pagePermissionRoleData.map((r) => ({
                  label: t(r.label),
                  value: r.value,
                }))}
                onChange={(value) => value && setRole(value)}
                value={role}
                variant="filled"
                w={120}
              />
              <Button
                disabled={memberIds.length === 0}
                loading={addPermissionMutation.isPending}
                onClick={handleAddMembers}
              >
                {t("Add")}
              </Button>
            </Group>
          )}

          <PagePermissionList
            canManage={canManage}
            onRemoveAll={handleRemoveAll}
            pageId={pageId}
          />
        </>
      )}
    </Stack>
  );
}
