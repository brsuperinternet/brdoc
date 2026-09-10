import {
  Alert,
  Button,
  Collapse,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DestinationFormValues,
  initialValues,
  toPayload,
  validateForm,
} from "@/ee/siem/lib/destination-form";
import {
  useCreateSiemDestinationMutation,
  useTestSiemDestinationMutation,
  useUpdateSiemDestinationMutation,
} from "@/ee/siem/queries/siem-query";
import {
  DATADOG_SITES,
  ISiemDestination,
  ISiemTestResult,
} from "@/ee/siem/types/siem.types";
import { isCloud } from "@/lib/config.ts";
import { DESTINATION_TYPE_LABELS } from "./destination-table";

interface DestinationFormModalProps {
  destination?: ISiemDestination | null;
  onClose: () => void;
  opened: boolean;
}

function connectionKey(values: DestinationFormValues): string {
  const { type, config, secrets } = toPayload(values);
  return JSON.stringify({ config, secrets, type });
}

export function DestinationFormModal({
  opened,
  onClose,
  destination,
}: DestinationFormModalProps) {
  const { t } = useTranslation();
  const isEdit = Boolean(destination);
  const hasSecrets = destination?.hasSecrets ?? {};
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [testState, setTestState] = useState<{
    result: ISiemTestResult | null;
    testedPayloadKey: string | null;
  }>({
    result: null,
    testedPayloadKey: null,
  });
  const createMutation = useCreateSiemDestinationMutation();
  const updateMutation = useUpdateSiemDestinationMutation();
  const testMutation = useTestSiemDestinationMutation();

  const form = useForm<DestinationFormValues>({
    initialValues: initialValues(destination),
    validate: (values) => validateForm(values, hasSecrets),
  });

  useEffect(() => {
    if (opened) {
      form.setValues(initialValues(destination));
      form.resetDirty();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTestState({ result: null, testedPayloadKey: null });
      setAdvancedOpen(false);
    }
  }, [opened, destination?.id]);

  const handleSubmit = async (values: DestinationFormValues) => {
    const payload = toPayload(values);
    try {
      if (destination) {
        await updateMutation.mutateAsync({
          config: payload.config,
          destinationId: destination.id,
          enabled: payload.enabled,
          name: payload.name,
          secrets: payload.secrets,
        });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch {}
  };

  const handleTest = async () => {
    if (form.validate().hasErrors) {
      return;
    }
    const payload = toPayload(form.values);
    const testedPayloadKey = connectionKey(form.values);
    setTestState((prev) => ({ ...prev, testedPayloadKey }));
    try {
      const result = await testMutation.mutateAsync({
        config: payload.config,
        destinationId: destination?.id,
        secrets: payload.secrets,
        type: payload.type,
      });
      setTestState({ result, testedPayloadKey });
    } catch {
      setTestState({ result: null, testedPayloadKey });
    }
  };

  const type = form.values.type;
  const showTls = type !== "datadog";
  const currentPayloadKey = connectionKey(form.values);
  const showTestResult =
    testState.result !== null &&
    testState.testedPayloadKey === currentPayloadKey;
  const connectionChanged =
    currentPayloadKey !== connectionKey(initialValues(destination));
  const testPassed = showTestResult && testState.result.delivered;
  const requiresTest = (!isEdit || connectionChanged) && !testPassed;

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={onClose}
      opened={opened}
      size="lg"
      title={isEdit ? t("Edit destination") : t("Add destination")}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            allowDeselect={false}
            data={[
              {
                label: DESTINATION_TYPE_LABELS.splunk_hec,
                value: "splunk_hec",
              },
              { label: DESTINATION_TYPE_LABELS.datadog, value: "datadog" },
              { label: DESTINATION_TYPE_LABELS.http, value: "http" },
            ]}
            disabled={isEdit}
            label={t("Preset")}
            {...form.getInputProps("type")}
          />

          <TextInput
            data-autofocus
            label={t("Name")}
            placeholder={t("e.g. Splunk prod")}
            required
            {...form.getInputProps("name")}
          />

          {type === "splunk_hec" && (
            <>
              <TextInput
                label={t("HEC URL")}
                placeholder="https://splunk.example.com:8088"
                required
                {...form.getInputProps("url")}
              />
              <PasswordInput
                label={t("HEC token")}
                required={!hasSecrets.token}
                {...form.getInputProps("token")}
              />
            </>
          )}

          {type === "datadog" && (
            <>
              <Select
                allowDeselect={false}
                data={DATADOG_SITES.map((site) => ({
                  label: site,
                  value: site,
                }))}
                label={t("Datadog site")}
                {...form.getInputProps("site")}
              />
              <PasswordInput
                label={t("API key")}
                required={!hasSecrets.apiKey}
                {...form.getInputProps("apiKey")}
              />
            </>
          )}

          {type === "http" && (
            <>
              <TextInput
                label={t("Endpoint URL")}
                placeholder="https://collector.example.com/docmost"
                required
                {...form.getInputProps("url")}
              />
              <PasswordInput
                description={t(
                  "Sent in the auth header below. Leave empty if your receiver does not need one."
                )}
                label={t("Token")}
                {...form.getInputProps("token")}
              />
            </>
          )}

          <Button
            onClick={() => setAdvancedOpen((open) => !open)}
            size="compact-sm"
            style={{ alignSelf: "flex-start" }}
            variant="subtle"
          >
            {advancedOpen
              ? t("Hide advanced options")
              : t("Show advanced options")}
          </Button>

          <Collapse expanded={advancedOpen}>
            <Stack gap="md">
              {type === "splunk_hec" && (
                <>
                  <TextInput
                    description={t(
                      "Leave empty to use the token's default index"
                    )}
                    label={t("Index")}
                    {...form.getInputProps("index")}
                  />
                  <Group grow>
                    <TextInput
                      label={t("Source")}
                      {...form.getInputProps("source")}
                    />
                    <TextInput
                      label={t("Sourcetype")}
                      {...form.getInputProps("sourcetype")}
                    />
                  </Group>
                  <TextInput
                    description={t("Defaults to this instance's hostname")}
                    label={t("Host")}
                    {...form.getInputProps("host")}
                  />
                </>
              )}

              {type === "datadog" && (
                <>
                  <TextInput
                    label={t("Service")}
                    {...form.getInputProps("service")}
                  />
                  <TextInput
                    label={t("Tags")}
                    placeholder="env:prod,team:security"
                    {...form.getInputProps("tags")}
                  />
                </>
              )}

              {type === "http" && (
                <>
                  <Group grow>
                    <TextInput
                      label={t("Auth header name")}
                      {...form.getInputProps("authHeaderName")}
                    />
                    <TextInput
                      label={t("Auth header prefix")}
                      {...form.getInputProps("authHeaderPrefix")}
                    />
                  </Group>
                  <Select
                    allowDeselect={false}
                    data={[
                      { label: t("JSON array"), value: "json" },
                      { label: "NDJSON", value: "ndjson" },
                    ]}
                    label={t("Body format")}
                    {...form.getInputProps("format")}
                  />
                </>
              )}

              {showTls && (
                <>
                  {!isCloud() && (
                    <Switch
                      description={
                        form.values.rejectUnauthorized
                          ? undefined
                          : t("Insecure: connections can be intercepted.")
                      }
                      label={t("Verify TLS certificate")}
                      {...form.getInputProps("rejectUnauthorized", {
                        type: "checkbox",
                      })}
                    />
                  )}
                </>
              )}

              <Switch
                label={t("Enabled")}
                {...form.getInputProps("enabled", { type: "checkbox" })}
              />
            </Stack>
          </Collapse>

          {showTestResult && (
            <Alert
              color={testState.result.delivered ? "green" : "red"}
              icon={
                testState.result.delivered ? (
                  <IconCheck size={16} />
                ) : (
                  <IconAlertCircle size={16} />
                )
              }
            >
              {testState.result.delivered
                ? t("Test event delivered successfully.")
                : testState.result.error}
            </Alert>
          )}

          <Group justify="space-between" mt="md">
            <Group gap="sm">
              <Button
                loading={testMutation.isPending}
                onClick={handleTest}
                variant="default"
              >
                {t("Test connection")}
              </Button>
              {requiresTest && (
                <Text c="dimmed" size="xs">
                  {t("Test the connection before saving.")}
                </Text>
              )}
            </Group>
            <Group>
              <Button onClick={onClose} variant="default">
                {t("Cancel")}
              </Button>
              <Button
                disabled={requiresTest}
                loading={createMutation.isPending || updateMutation.isPending}
                type="submit"
              >
                {isEdit ? t("Save") : t("Create")}
              </Button>
            </Group>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
