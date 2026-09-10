import { Button, Modal, PasswordInput, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { zod4Resolver } from "mantine-form-zod-resolver";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { z } from "zod/v4";
import { ldapLogin } from "@/ee/security/services/ldap-auth-service";
import { IAuthProvider } from "@/ee/security/types/security.types";
import APP_ROUTE, { getPostLoginRedirect } from "@/lib/app-route";

const formSchema = z.object({
  password: z.string().min(1, { message: "Password is required" }),
  username: z.string().min(1, { message: "Username is required" }),
});

interface LdapLoginModalProps {
  onClose: () => void;
  opened: boolean;
  provider: IAuthProvider;
  workspaceId: string;
}

export function LdapLoginModal({
  opened,
  onClose,
  provider,
  workspaceId,
}: LdapLoginModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      password: "",
      username: "",
    },
    validate: zod4Resolver(formSchema),
  });

  const handleSubmit = async (values: {
    username: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await ldapLogin({
        password: values.password,
        providerId: provider.id,
        username: values.username,
        workspaceId,
      });

      // Handle MFA like the regular login
      if (response?.userHasMfa) {
        onClose();
        navigate(APP_ROUTE.AUTH.MFA_CHALLENGE + window.location.search);
      } else if (response?.requiresMfaSetup) {
        onClose();
        navigate(APP_ROUTE.AUTH.MFA_SETUP_REQUIRED + window.location.search);
      } else {
        onClose();
        navigate(getPostLoginRedirect());
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage =
        err.response?.data?.message || "Authentication failed";
      setError(errorMessage);

      notifications.show({
        color: "red",
        message: errorMessage,
      });
    }
  };

  const handleClose = () => {
    form.reset();
    setError(null);
    onClose();
  };

  return (
    <Modal
      onClose={handleClose}
      opened={opened}
      size="md"
      title={`LDAP Login - ${provider.name}`}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            data-autofocus
            disabled={isLoading}
            id="ldap-username"
            label={t("LDAP username")}
            placeholder="Enter your LDAP username"
            type="text"
            variant="filled"
            {...form.getInputProps("username")}
          />

          <PasswordInput
            disabled={isLoading}
            label={t("LDAP password")}
            placeholder={t("Enter your LDAP password")}
            variant="filled"
            visibilityToggleButtonProps={{
              "aria-hidden": false,
              "aria-label": t("Toggle password visibility"),
              tabIndex: 0,
            }}
            {...form.getInputProps("password")}
          />

          <Button fullWidth loading={isLoading} mt="md" type="submit">
            {t("Sign in with LDAP")}
          </Button>
        </Stack>
      </form>
    </Modal>
  );
}
