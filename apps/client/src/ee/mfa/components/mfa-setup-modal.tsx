import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Code,
  Collapse,
  Group,
  Image,
  List,
  Loader,
  Modal,
  Paper,
  PinInput,
  Stack,
  Stepper,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconKey,
  IconPrinter,
  IconQrcode,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useMutation } from "@tanstack/react-query";
import { zod4Resolver } from "mantine-form-zod-resolver";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { CopyButton } from "@/components/common/copy-button";
import { enableMfa, setupMfa } from "@/ee/mfa";

interface MfaSetupModalProps {
  isRequired?: boolean;
  onClose?: () => void;
  onComplete: () => void;
  opened: boolean;
}

interface SetupData {
  manualKey: string;
  qrCode: string;
}

const formSchema = z.object({
  verificationCode: z
    .string()
    .length(6, { message: "Please enter a 6-digit code" }),
});

export function MfaSetupModal({
  opened,
  onClose,
  onComplete,
  isRequired = false,
}: MfaSetupModalProps) {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);

  const form = useForm({
    initialValues: {
      verificationCode: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const setupMutation = useMutation({
    mutationFn: () => setupMfa({ method: "totp" }),
    onError: (error: any) => {
      notifications.show({
        color: "red",
        message: error.response?.data?.message || t("Failed to setup MFA"),
        title: t("Error"),
      });
    },
    onSuccess: (data) => {
      setSetupData(data);
    },
  });

  // Generate QR code when modal opens
  React.useEffect(() => {
    if (opened && !setupData && !setupMutation.isPending) {
      setupMutation.mutate();
    }
  }, [opened]);

  const enableMutation = useMutation({
    mutationFn: (verificationCode: string) =>
      enableMfa({
        verificationCode,
      }),
    onError: (error: any) => {
      notifications.show({
        color: "red",
        message:
          error.response?.data?.message || t("Invalid verification code"),
        title: t("Error"),
      });
      form.setFieldValue("verificationCode", "");
    },
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setActive(1); // Move to backup codes step
    },
  });

  const handleClose = () => {
    if (active === 1 && backupCodes.length > 0) {
      onComplete();
    }
    onClose();
    // Reset state
    setTimeout(() => {
      setActive(0);
      setSetupData(null);
      setBackupCodes([]);
      setManualEntryOpen(false);
      form.reset();
    }, 200);
  };

  const handleVerify = async (values: { verificationCode: string }) => {
    await enableMutation.mutateAsync(values.verificationCode);
  };

  const handlePrintBackupCodes = () => {
    window.print();
  };

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      size="md"
      title={t("Set up two-factor authentication")}
    >
      <Stepper active={active} size="sm">
        <Stepper.Step
          description={t("Add to authenticator")}
          icon={<IconQrcode size={18} />}
          label={t("Setup & Verify")}
        >
          <form onSubmit={form.onSubmit(handleVerify)}>
            <Stack gap="md" mt="xl">
              {setupMutation.isPending ? (
                <Center py="xl">
                  <Loader size="lg" />
                </Center>
              ) : setupData ? (
                <>
                  <Text size="sm">
                    {t("1. Scan this QR code with your authenticator app")}
                  </Text>

                  <Center>
                    <Paper p="md" withBorder>
                      <Image
                        alt="MFA QR Code"
                        height={200}
                        src={setupData.qrCode}
                        width={200}
                      />
                    </Paper>
                  </Center>

                  <UnstyledButton
                    onClick={() => setManualEntryOpen(!manualEntryOpen)}
                  >
                    <Group gap="xs">
                      {manualEntryOpen ? (
                        <IconChevronDown size={16} />
                      ) : (
                        <IconChevronRight size={16} />
                      )}
                      <Text c="dimmed" size="sm">
                        {t("Can't scan the code?")}
                      </Text>
                    </Group>
                  </UnstyledButton>

                  <Collapse expanded={manualEntryOpen}>
                    <Alert
                      color="gray"
                      icon={<IconAlertCircle size={20} />}
                      variant="light"
                    >
                      <Text mb="sm" size="sm">
                        {t(
                          "Enter this code manually in your authenticator app:"
                        )}
                      </Text>
                      <Group gap="xs">
                        <Code block>{setupData.manualKey}</Code>
                        <CopyButton value={setupData.manualKey}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? t("Copied") : t("Copy")}>
                              <ActionIcon
                                color={copied ? "green" : "gray"}
                                onClick={copy}
                              >
                                {copied ? (
                                  <IconCheck size={16} />
                                ) : (
                                  <IconCopy size={16} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Alert>
                  </Collapse>

                  <Text mt="md" size="sm">
                    {t("2. Enter the 6-digit code from your authenticator")}
                  </Text>

                  <Stack align="center">
                    <PinInput
                      autoFocus
                      data-autofocus
                      length={6}
                      oneTimeCode
                      type="number"
                      {...form.getInputProps("verificationCode")}
                      styles={{
                        input: {
                          fontSize: "1.2rem",
                          textAlign: "center",
                        },
                      }}
                    />
                    {form.errors.verificationCode && (
                      <Text c="red" size="sm">
                        {form.errors.verificationCode}
                      </Text>
                    )}
                  </Stack>

                  <Button
                    fullWidth
                    leftSection={<IconShieldCheck size={18} />}
                    loading={enableMutation.isPending}
                    type="submit"
                  >
                    {t("Verify and enable")}
                  </Button>
                </>
              ) : (
                <Center py="xl">
                  <Text c="dimmed" size="sm">
                    {t("Failed to generate QR code. Please try again.")}
                  </Text>
                </Center>
              )}
            </Stack>
          </form>
        </Stepper.Step>

        <Stepper.Step
          description={t("Save codes")}
          icon={<IconKey size={18} />}
          label={t("Backup")}
        >
          <Stack gap="md" mt="xl">
            <Alert
              color="yellow"
              icon={<IconAlertCircle size={20} />}
              title={t("Save your backup codes")}
            >
              <Text size="sm">
                {t(
                  "These codes can be used to access your account if you lose access to your authenticator app. Each code can only be used once."
                )}
              </Text>
            </Alert>

            <Paper p="md" withBorder>
              <Group justify="space-between" mb="sm">
                <Text fw={600} size="sm">
                  {t("Backup codes")}
                </Text>
                <Group gap="xs" wrap="nowrap">
                  <CopyButton value={backupCodes.join("\n")}>
                    {({ copied, copy }) => (
                      <Button
                        leftSection={
                          copied ? (
                            <IconCheck size={14} />
                          ) : (
                            <IconCopy size={14} />
                          )
                        }
                        onClick={copy}
                        size="xs"
                        variant="subtle"
                      >
                        {copied ? t("Copied") : t("Copy")}
                      </Button>
                    )}
                  </CopyButton>
                  <Button
                    leftSection={<IconPrinter size={14} />}
                    onClick={handlePrintBackupCodes}
                    size="xs"
                    variant="subtle"
                  >
                    {t("Print")}
                  </Button>
                </Group>
              </Group>
              <List size="sm" spacing="xs">
                {backupCodes.map((code, index) => (
                  <List.Item key={index}>
                    <Code>{code}</Code>
                  </List.Item>
                ))}
              </List>
            </Paper>

            <Button
              fullWidth
              leftSection={<IconCheck size={18} />}
              onClick={handleClose}
            >
              {t("I've saved my backup codes")}
            </Button>
          </Stack>
        </Stepper.Step>
      </Stepper>
    </Modal>
  );
}
