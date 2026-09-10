import { Button, Divider, Stack } from "@mantine/core";
import { GoogleIcon } from "@/components/icons/google-icon.tsx";
import { getGoogleSignupUrl } from "@/ee/security/sso.utils.ts";

export default function SsoCloudSignup() {
  const handleSsoLogin = () => {
    window.location.href = getGoogleSignupUrl();
  };

  return (
    <>
      <Stack align="stretch" gap="sm" justify="center">
        <Button
          fullWidth
          leftSection={<GoogleIcon size={16} />}
          onClick={handleSsoLogin}
          variant="default"
        >
          Signup with Google
        </Button>
      </Stack>
      <Divider label="OR" labelPosition="center" my="xs" />
    </>
  );
}
