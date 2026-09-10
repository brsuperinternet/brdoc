import {
  Button,
  Checkbox,
  Divider,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCertificate2,
  IconCheck,
  IconRefresh,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSetupVerificationMutation } from "@/ee/page-verification/queries/page-verification-query";
import {
  ExpirationMode,
  PeriodUnit,
  VerificationType,
} from "@/ee/page-verification/types/page-verification.types";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom";
import {
  ExpirationFields,
  PERIOD_AMOUNT_MIN,
  PERIOD_UNIT_MAX_AMOUNT,
} from "./expiration-fields";
import classes from "./page-verification-modal.module.css";
import { MAX_VERIFIERS, UserOptionItem } from "./user-option";
import { VerifierList } from "./verifier-list";
import { VerifierPicker } from "./verifier-picker";

type WorkflowChooserProps = {
  onSelect: (type: VerificationType) => void;
};

function WorkflowChooser({ onSelect }: WorkflowChooserProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="md">
      <Text className={classes.subhead}>
        {t("Choose how this page should stay accurate.")}
      </Text>

      <div className={classes.chooser}>
        <UnstyledButton
          className={classes.card}
          component="button"
          onClick={() => onSelect("expiring" as VerificationType)}
          type="button"
        >
          <div className={classes.titleRow}>
            <span className={classes.iconStamp}>
              <IconRefresh size={15} stroke={1.7} />
            </span>
            <h3 className={classes.title}>{t("Recurring verification")}</h3>
          </div>
          <p className={classes.description}>
            {t("Verifiers re-confirm this page on a schedule.")}
          </p>

          <div className={classes.rule} />

          <div className={classes.meta}>
            <div className={classes.metaItem}>
              <IconCheck className={classes.metaIcon} size={13} stroke={2.4} />
              {t("Re-verify on a schedule (e.g every 30 days )")}
            </div>
          </div>

          <div className={classes.cardFooter}>
            <span className={classes.bestFor}>
              {t("Best for runbooks, FAQs, living documentation")}
            </span>
            <span className={classes.arrow}>
              <IconArrowRight size={16} stroke={1.8} />
            </span>
          </div>
        </UnstyledButton>

        <UnstyledButton
          className={classes.card}
          component="button"
          onClick={() => onSelect("qms" as VerificationType)}
          type="button"
        >
          <div className={classes.titleRow}>
            <span className={classes.iconStamp}>
              <IconCertificate2 size={15} stroke={1.7} />
            </span>
            <h3 className={classes.title}>{t("Approval workflow")}</h3>
          </div>
          <p className={classes.description}>
            {t("Formal document lifecycle with named approvers.")}
          </p>

          <div className={classes.rule} />

          <div className={classes.meta}>
            <div className={classes.metaItem}>
              <IconCheck className={classes.metaIcon} size={13} stroke={2.4} />
              {t("Draft → In approval → Approved → Obsolete")}
            </div>
            <div className={classes.metaItem}>
              <IconCheck className={classes.metaIcon} size={13} stroke={2.4} />
              {t("Designed for ISO 9001, ISO 13485, and FDA")}
            </div>
          </div>

          <div className={classes.cardFooter}>
            <span className={classes.bestFor}>
              {t("Best for SOPs and controlled documents")}
            </span>
            <span className={classes.arrow}>
              <IconArrowRight size={16} stroke={1.8} />
            </span>
          </div>
        </UnstyledButton>
      </div>
    </Stack>
  );
}

type SetupVerificationFormProps = {
  pageId: string;
  onClose: () => void;
};

export function SetupVerificationForm({
  pageId,
  onClose,
}: SetupVerificationFormProps) {
  const { t } = useTranslation();
  const setupMutation = useSetupVerificationMutation();
  const [currentUser] = useAtom(currentUserAtom);
  const [type, setType] = useState<VerificationType | null>(null);
  const [mode, setMode] = useState<ExpirationMode>("period");
  const [periodAmount, setPeriodAmount] = useState<number>(1);
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>("month");
  const [fixedDate, setFixedDate] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);
  const [selectedVerifiers, setSelectedVerifiers] = useState<UserOptionItem[]>(
    []
  );
  const didInitCurrentUser = useRef(false);

  useEffect(() => {
    if (!didInitCurrentUser.current && currentUser?.user) {
      didInitCurrentUser.current = true;
      const u = currentUser.user;
      setSelectedVerifiers([
        {
          avatarUrl: u.avatarUrl,
          email: u.email,
          label: u.name,
          value: u.id,
        },
      ]);
    }
  }, [currentUser]);

  const isQms = type === "qms";
  const canAddMore = selectedVerifiers.length < MAX_VERIFIERS;

  if (type === null) {
    return <WorkflowChooser onSelect={setType} />;
  }

  const handleAddVerifier = (user: UserOptionItem) => {
    setSelectedVerifiers((prev) =>
      prev.some((v) => v.value === user.value) ? prev : [...prev, user]
    );
  };

  const handleRemoveVerifier = (userId: string) => {
    setSelectedVerifiers((prev) => prev.filter((v) => v.value !== userId));
  };

  const handleSetup = () => {
    if (selectedVerifiers.length === 0) {
      return;
    }
    setupMutation.mutate(
      {
        pageId,
        type,
        ...(!isQms && {
          mode,
          ...(mode === "period" && {
            periodAmount,
            periodUnit,
          }),
          ...(mode === "fixed" &&
            fixedDate && {
              fixedExpiresAt: new Date(fixedDate).toISOString(),
            }),
        }),
        verifierIds: selectedVerifiers.map((v) => v.value),
      },
      {
        onSuccess: () => {
          if (!isQms) {
            onClose();
          }
        },
      }
    );
  };

  const periodValid =
    mode !== "period" ||
    (Number.isInteger(periodAmount) &&
      periodAmount >= PERIOD_AMOUNT_MIN &&
      periodAmount <= PERIOD_UNIT_MAX_AMOUNT[periodUnit]);
  const fixedDateValid =
    mode !== "fixed" ||
    (!!fixedDate && new Date(fixedDate).getTime() > Date.now());
  const hasVerifiers = selectedVerifiers.length > 0;

  const canSubmit = isQms
    ? hasVerifiers
    : hasVerifiers && confirmed && periodValid && fixedDateValid;

  return (
    <Stack>
      <div>
        <button
          className={classes.backButton}
          onClick={() => setType(null)}
          type="button"
        >
          <IconArrowLeft size={12} stroke={2.2} />
          {t("Back")}
        </button>
        <div className={classes.configureHeader}>
          <span className={classes.iconStamp}>
            {isQms ? (
              <IconCertificate2 size={16} stroke={1.6} />
            ) : (
              <IconRefresh size={16} stroke={1.6} />
            )}
          </span>
          <div>
            <span className={classes.configureEyebrow}>
              {isQms ? t("Quality management") : t("Recurring")}
            </span>
            <Text c="dimmed" mt={2} size="sm">
              {isQms
                ? t("Pages move through draft, approval, and approved stages.")
                : t(
                    "Assigned verifiers must periodically re-verify this page."
                  )}
            </Text>
          </div>
        </div>
      </div>

      <div>
        <Text c="dimmed" fw={600} mb={4} size="sm" tt="uppercase">
          {t("Verifiers")}
        </Text>
        {selectedVerifiers.length > 0 && (
          <div style={{ marginBottom: "var(--mantine-spacing-xs)" }}>
            <VerifierList
              canManage
              onRemove={handleRemoveVerifier}
              verifiers={selectedVerifiers.map((v) => ({
                avatarUrl: v.avatarUrl,
                email: v.email,
                id: v.value,
                name: v.label,
              }))}
            />
          </div>
        )}
        {canAddMore && (
          <VerifierPicker
            excludeIds={selectedVerifiers.map((v) => v.value)}
            onSelect={handleAddVerifier}
          />
        )}
      </div>

      {!isQms && (
        <>
          <Divider />

          <div>
            <Text fw={600} mb={6} size="sm">
              {t("Expiration")}
            </Text>
            <ExpirationFields
              fixedDate={fixedDate}
              mode={mode}
              onFixedDateChange={setFixedDate}
              onModeChange={setMode}
              onPeriodAmountChange={setPeriodAmount}
              onPeriodUnitChange={setPeriodUnit}
              periodAmount={periodAmount}
              periodUnit={periodUnit}
            />
          </div>

          <Divider />

          <div>
            <Text fw={600} mb={4} size="sm">
              {t("Confirm")}
            </Text>
            <Checkbox
              checked={confirmed}
              color="dark"
              label={t("I've reviewed this page for accuracy")}
              onChange={(event) => setConfirmed(event.currentTarget.checked)}
            />
          </div>
        </>
      )}

      <Group justify="flex-end">
        <Button
          color="dark"
          disabled={!canSubmit}
          loading={setupMutation.isPending}
          onClick={handleSetup}
        >
          {isQms ? t("Set up") : t("Verify")}
        </Button>
      </Group>
    </Stack>
  );
}
