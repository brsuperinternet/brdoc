import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { EmailButton, MailBody } from "../partials/partials";

interface Props {
  expiresAt: string;
  pageTitle: string;
  pageUrl: string;
  spaceName: string;
}

export const VerificationExpiringEmail = ({
  pageTitle,
  spaceName,
  pageUrl,
  expiresAt,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi there,</Text>
      <Text style={paragraph}>
        The page <strong>{pageTitle}</strong> in the{" "}
        <strong>{spaceName}</strong> space needs to be re-verified. The
        verification expires on <strong>{expiresAt}</strong>.
      </Text>
    </Section>
    <EmailButton href={pageUrl}>Review page</EmailButton>
  </MailBody>
);

export default VerificationExpiringEmail;
