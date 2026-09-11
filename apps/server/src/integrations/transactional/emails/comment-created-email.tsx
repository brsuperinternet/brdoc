import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { EmailButton, MailBody } from "../partials/partials";

interface Props {
  actorName: string;
  pageTitle: string;
  pageUrl: string;
}

export const CommentCreateEmail = ({
  actorName,
  pageTitle,
  pageUrl,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi there,</Text>
      <Text style={paragraph}>
        <strong>{actorName}</strong> commented on <strong>{pageTitle}</strong>.
      </Text>
    </Section>
    <EmailButton href={pageUrl}>View</EmailButton>
  </MailBody>
);

export default CommentCreateEmail;
