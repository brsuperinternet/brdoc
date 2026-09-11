import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { EmailButton, MailBody } from "../partials/partials";

interface Props {
  actorName: string;
  comment?: string;
  pageTitle: string;
  pageUrl: string;
  spaceName: string;
}

export const ApprovalRejectedEmail = ({
  actorName,
  pageTitle,
  spaceName,
  pageUrl,
  comment,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi there,</Text>
      <Text style={paragraph}>
        <strong>{actorName}</strong> returned <strong>{pageTitle}</strong> in
        the <strong>{spaceName}</strong> space for revision.
      </Text>
      {comment && (
        <Text style={{ ...paragraph, fontStyle: "italic" }}>
          &ldquo;{comment}&rdquo;
        </Text>
      )}
    </Section>
    <EmailButton href={pageUrl}>View page</EmailButton>
  </MailBody>
);

export default ApprovalRejectedEmail;
