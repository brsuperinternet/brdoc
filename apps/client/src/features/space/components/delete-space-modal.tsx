import { Button, Divider, Group, Modal, Text, TextInput } from "@mantine/core";
import { useField } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route";
import { useDeleteSpaceMutation } from "../queries/space-query";
import { ISpace } from "../types/space.types";

interface DeleteSpaceModalProps {
  space: ISpace;
}

export default function DeleteSpaceModal({ space }: DeleteSpaceModalProps) {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteSpaceMutation = useDeleteSpaceMutation();
  const navigate = useNavigate();

  const confirmNameField = useField({
    initialValue: "",
    validate: (value) =>
      value.trim().toLowerCase() === space.name.trim().toLocaleLowerCase()
        ? null
        : t("Names do not match"),
    validateOnChange: true,
  });

  const handleDelete = async () => {
    if (
      confirmNameField.getValue().trim().toLowerCase() !==
      space.name.trim().toLowerCase()
    ) {
      confirmNameField.validate();
      return;
    }

    setIsDeleting(true);
    try {
      // pass slug too so we can clear the local cache
      await deleteSpaceMutation.mutateAsync({ id: space.id, slug: space.slug });
      navigate(APP_ROUTE.HOME);
    } catch (error) {
      console.error("Failed to delete space", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button color="red" onClick={open} variant="light">
        {t("Delete")}
      </Button>

      <Modal
        onClose={close}
        opened={opened}
        title={t("Are you sure you want to delete this space?")}
      >
        <Divider mb="xs" size="xs" />
        <Text>
          {t(
            "All pages, comments, attachments and permissions in this space will be deleted irreversibly."
          )}
        </Text>
        <Text mt="sm">
          <Trans
            components={{ b: <Text fw={500} span /> }}
            defaults="Type the space name <b>{{spaceName}}</b> to confirm your action."
            values={{ spaceName: space.name }}
          />
        </Text>
        <TextInput
          {...confirmNameField.getInputProps()}
          data-autofocus
          placeholder={t("Confirm space name")}
          py="sm"
          variant="filled"
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={close} variant="default">
            {t("Cancel")}
          </Button>
          <Button color="red" loading={isDeleting} onClick={handleDelete}>
            {t("Confirm")}
          </Button>
        </Group>
      </Modal>
    </>
  );
}
