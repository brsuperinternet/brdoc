import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { EmailButton, MailBody } from "../partials/partials";

interface Props {
  actorName: string;
  pageTitle: string;
  pageUrl: string;
}

export const PageMentionEmail = ({ actorName, pageTitle, pageUrl }: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi there,</Text>
      <Text style={paragraph}>
        <strong>{actorName}</strong> mentioned you in{" "}
        <strong>{pageTitle}</strong>.
      </Text>
    </Section>
    <EmailButton href={pageUrl}>View</EmailButton>
  </MailBody>
);

export default PageMentionEmail;
