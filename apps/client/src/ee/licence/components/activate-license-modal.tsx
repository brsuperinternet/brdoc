import { Button, Divider, Group, Modal, Stack, Textarea } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useAtom } from "jotai";
import { zod4Resolver } from "mantine-form-zod-resolver";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { entitlementAtom } from "@/ee/entitlement/entitlement-atom";
import RemoveLicense from "@/ee/licence/components/remove-license.tsx";
import { useActivateMutation } from "@/ee/licence/queries/license-query.ts";

export default function ActivateLicense() {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [entitlements] = useAtom(entitlementAtom);
  const hasLicense = entitlements != null && entitlements.tier !== "free";

  return (
    <Group justify="flex-end" mb="sm" wrap="nowrap">
      <Button onClick={open}>
        {hasLicense ? t("Update license") : t("Add license")}
      </Button>

      {hasLicense && <RemoveLicense />}

      <Modal
        centered
        onClose={close}
        opened={opened}
        size="550"
        title={t("Enterprise license")}
      >
        <ActivateLicenseForm onClose={close} />
      </Modal>
    </Group>
  );
}

const formSchema = z.object({
  licenseKey: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

interface ActivateLicenseFormProps {
  onClose?: () => void;
}
export function ActivateLicenseForm({ onClose }: ActivateLicenseFormProps) {
  const { t } = useTranslation();
  const activateLicenseMutation = useActivateMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    initialValues: {
      licenseKey: "",
    },
    validate: zod4Resolver(formSchema),
  });

  async function handleSubmit(data: { licenseKey: string }) {
    await activateLicenseMutation.mutateAsync(data.licenseKey);
    form.reset();
    onClose?.();
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string)?.trim();
      if (content) {
        form.setFieldValue("licenseKey", content);
        handleSubmit({ licenseKey: content });
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <input
        accept=".txt,.license"
        hidden
        onChange={handleFileUpload}
        ref={fileInputRef}
        type="file"
      />

      <Stack gap="xs">
        <Textarea
          autosize
          data-autofocus
          label={t("License key")}
          maxRows={5}
          minRows={3}
          placeholder={t("e.g eyJhb.....")}
          variant="filled"
          {...form.getInputProps("licenseKey")}
        />

        <Group justify="flex-end">
          <Button
            disabled={activateLicenseMutation.isPending}
            loading={activateLicenseMutation.isPending}
            type="submit"
          >
            {t("Save")}
          </Button>
        </Group>

        <Divider label={t("Or")} labelPosition="center" />

        <Group justify="center">
          <Button onClick={() => fileInputRef.current?.click()} variant="light">
            {t("Upload license file")}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
