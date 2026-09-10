import {
  ActionIcon,
  Group,
  Menu,
  Modal,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconRosetteDiscountCheckFilled,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label";
import { usePageVerificationInfoQuery } from "@/ee/page-verification/queries/page-verification-query";
import { usePageQuery } from "@/features/page/queries/page-query";
import i18n from "@/i18n.ts";
import { extractPageSlugId } from "@/lib";
import { ManageVerificationForm } from "./manage-verification-form";
import { SetupVerificationForm } from "./setup-verification-form";
import { getStatusColor, getStatusLabel } from "./verification-status";

type PageVerificationModalProps = {
  pageId: string;
  opened: boolean;
  onClose: () => void;
};

export function PageVerificationModal({
  pageId,
  opened,
  onClose,
}: PageVerificationModalProps) {
  const { t } = useTranslation();
  const { data: verificationInfo } = usePageVerificationInfoQuery(
    opened ? pageId : undefined
  );

  const status = verificationInfo?.status ?? "none";

  return (
    <Modal
      aria-label={
        status === "none" ? t("Set up verification") : t("Verify page")
      }
      onClose={onClose}
      opened={opened}
      size={520}
      title={
        <Group gap="xs">
          <IconShieldCheck
            color={
              status === "verified" || status === "approved"
                ? "var(--mantine-color-blue-6)"
                : status === "expired"
                  ? "var(--mantine-color-red-6)"
                  : undefined
            }
            size={20}
            stroke={1.5}
          />
          <Text fw={600}>
            {status === "none" ? t("Set up verification") : t("Verify page")}
          </Text>
        </Group>
      }
    >
      {status === "none" ? (
        <SetupVerificationForm onClose={onClose} pageId={pageId} />
      ) : (
        <ManageVerificationForm onClose={onClose} pageId={pageId} />
      )}
    </Modal>
  );
}

type PageVerificationBadgeProps = {
  readOnly?: boolean;
};

export function PageVerificationBadge({
  readOnly,
}: PageVerificationBadgeProps) {
  const { t } = useTranslation();
  const { pageSlug } = useParams();
  const pageSlugId = extractPageSlugId(pageSlug);
  const hasVerificationFeature = useHasFeature(Feature.PAGE_VERIFICATION);
  const [opened, { open, close }] = useDisclosure(false);

  const { data: page } = usePageQuery({ pageId: pageSlugId });
  const pageId = page?.id;

  const { data: verificationInfo, isLoading } = usePageVerificationInfoQuery(
    hasVerificationFeature ? pageId : undefined
  );
  const upgradeLabel = useUpgradeLabel();

  if (!pageId) {
    return null;
  }
  if (!hasVerificationFeature) {
    if (readOnly) {
      return null;
    }
    const lockedLabel = `${t("Add verification")} — ${upgradeLabel}`;
    // Use ActionIcon (a real <button>) instead of a ThemeIcon so the tooltip
    // is reachable on keyboard focus, and screen readers announce the upgrade
    // hint via the accessible name. Click is a no-op since the feature is
    // gated; the tooltip explains why.
    return (
      <Tooltip label={lockedLabel} openDelay={250} withArrow>
        <ActionIcon aria-label={lockedLabel} color="gray" variant="subtle">
          <IconShieldCheck size={20} stroke={1.5} />
        </ActionIcon>
      </Tooltip>
    );
  }
  if (isLoading) {
    return null;
  }

  const status = verificationInfo?.status ?? "none";

  if (status === "none" && readOnly) {
    return null;
  }

  const tooltipLabel =
    status === "verified" && verificationInfo?.expiresAt
      ? t("Verified until {{date}}", {
          date: new Date(verificationInfo.expiresAt).toLocaleDateString(
            i18n.language,
            { day: "numeric", month: "long", year: "numeric" }
          ),
        })
      : getStatusLabel(status, t);

  return (
    <>
      {status === "none" ? (
        readOnly ? null : (
          <Tooltip label={t("Set up verification")} openDelay={250} withArrow>
            <ActionIcon
              aria-label={t("Set up verification")}
              color="gray"
              onClick={open}
              variant="subtle"
            >
              <IconShieldCheck size={20} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        )
      ) : (
        <Tooltip label={tooltipLabel} openDelay={250} withArrow>
          <UnstyledButton
            aria-label={tooltipLabel}
            onClick={open}
            style={{
              alignItems: "center",
              cursor: "pointer",
              display: "inline-flex",
              gap: 4,
            }}
          >
            <IconRosetteDiscountCheckFilled
              aria-hidden="true"
              color={`var(--mantine-color-${getStatusColor(status).replace(".", "-")})`}
              size={18}
            />
            <Text c={getStatusColor(status)} size="sm">
              {getStatusLabel(status, t)}
            </Text>
          </UnstyledButton>
        </Tooltip>
      )}

      <PageVerificationModal onClose={close} opened={opened} pageId={pageId} />
    </>
  );
}

type PageVerificationMenuItemProps = {
  pageId?: string;
  onClick: () => void;
};

export function PageVerificationMenuItem({
  pageId,
  onClick,
}: PageVerificationMenuItemProps) {
  const { t } = useTranslation();
  const hasVerificationFeature = useHasFeature(Feature.PAGE_VERIFICATION);
  const upgradeLabel = useUpgradeLabel();

  const { data: verificationInfo } = usePageVerificationInfoQuery(
    hasVerificationFeature ? pageId : undefined
  );

  const hasVerification =
    !!verificationInfo && verificationInfo.status !== "none";
  const label = hasVerification
    ? t("Edit verification")
    : t("Add verification");

  const menuItem = (
    <Menu.Item
      disabled={!hasVerificationFeature}
      leftSection={<IconShieldCheck size={16} />}
      onClick={hasVerificationFeature ? onClick : undefined}
    >
      {label}
    </Menu.Item>
  );

  if (!hasVerificationFeature) {
    return (
      <Tooltip label={upgradeLabel} position="left" withinPortal={false}>
        {menuItem}
      </Tooltip>
    );
  }

  return menuItem;
}
