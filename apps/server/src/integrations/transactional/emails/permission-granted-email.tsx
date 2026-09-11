import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { EmailButton, MailBody } from "../partials/partials";

interface Props {
  accessLabel: string;
  actorName: string;
  pageTitle: string;
  pageUrl: string;
}

export const PermissionGrantedEmail = ({
  actorName,
  pageTitle,
  pageUrl,
  accessLabel,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi there,</Text>
      <Text style={paragraph}>
        <strong>{actorName}</strong> gave you {accessLabel} access to{" "}
        <strong>{pageTitle}</strong>.
      </Text>
    </Section>
    <EmailButton href={pageUrl}>View</EmailButton>
  </MailBody>
);

export default PermissionGrantedEmail;
