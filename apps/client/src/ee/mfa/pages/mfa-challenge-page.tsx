import { MfaChallenge, useMfaPageProtection } from "@/ee/mfa";

export function MfaChallengePage() {
  const { isValid } = useMfaPageProtection();

  if (!isValid) {
    return null;
  }

  return <MfaChallenge />;
}
