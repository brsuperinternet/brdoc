import { Button, Group, Modal, Select, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconCalendar } from "@tabler/icons-react";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { lazy, Suspense, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { IApiKey } from "@/ee/api-key";
import { useCreateApiKeyMutation } from "@/ee/api-key/queries/api-key-query";

const DateInput = lazy(() =>
  import("@mantine/dates").then((module) => ({
    default: module.DateInput,
  }))
);

interface CreateApiKeyModalProps {
  onClose: () => void;
  onSuccess: (response: IApiKey) => void;
  opened: boolean;
}

const formSchema = z.object({
  expiresAt: z.string().optional(),
  name: z.string().min(1, "Name is required"),
});
type FormValues = z.infer<typeof formSchema>;

export function CreateApiKeyModal({
  opened,
  onClose,
  onSuccess,
}: CreateApiKeyModalProps) {
  const { t, i18n } = useTranslation();
  const [expirationOption, setExpirationOption] = useState<string>("30");
  const createApiKeyMutation = useCreateApiKeyMutation();

  const form = useForm<FormValues>({
    initialValues: {
      expiresAt: "",
      name: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const getExpirationDate = (): string | undefined => {
    if (expirationOption === "never") {
      return undefined;
    }
    if (expirationOption === "custom") {
      return form.values.expiresAt;
    }
    const days = Number.parseInt(expirationOption);
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const getExpirationLabel = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const formatted = date.toLocaleDateString(i18n.language, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return `${days} days (${formatted})`;
  };

  const expirationOptions = [
    { label: getExpirationLabel(30), value: "30" },
    { label: getExpirationLabel(60), value: "60" },
    { label: getExpirationLabel(90), value: "90" },
    { label: getExpirationLabel(365), value: "365" },
    { label: t("Custom"), value: "custom" },
    { label: t("No expiration"), value: "never" },
  ];

  const handleSubmit = async (data: {
    name?: string;
    expiresAt?: string | Date;
  }) => {
    const groupData = {
      expiresAt: getExpirationDate(),
      name: data.name,
    };

    try {
      const createdKey = await createApiKeyMutation.mutateAsync(groupData);
      onSuccess(createdKey);
      form.reset();
      onClose();
    } catch (err) {
      //
    }
  };

  const handleClose = () => {
    form.reset();
    setExpirationOption("30");
    onClose();
  };

  return (
    <Modal
      closeButtonProps={{ "aria-label": t("Close") }}
      onClose={handleClose}
      opened={opened}
      size="md"
      title={t("Create {{credential}}", { credential: t("API key") })}
    >
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
        <Stack gap="md">
          <TextInput
            data-autofocus
            label={t("Name")}
            placeholder={t("Enter a descriptive name")}
            required
            {...form.getInputProps("name")}
          />

          <Select
            allowDeselect={false}
            data={expirationOptions}
            label={t("Expiration")}
            leftSection={<IconCalendar size={16} />}
            onChange={(value) => setExpirationOption(value || "30")}
            value={expirationOption}
          />

          {expirationOption === "custom" && (
            <Suspense fallback={null}>
              <DateInput
                label={t("Custom expiration date")}
                minDate={new Date()}
                placeholder={t("Select expiration date")}
                {...form.getInputProps("expiresAt")}
              />
            </Suspense>
          )}

          <Group justify="flex-end" mt="md">
            <Button onClick={handleClose} variant="default">
              {t("Cancel")}
            </Button>
            <Button loading={createApiKeyMutation.isPending} type="submit">
              {t("Create")}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
