import { Link, Section, Text } from "react-email";
import { content, link, paragraph } from "../css/styles";
import { EmailButton, getGreetingName, MailBody } from "../partials/partials";

interface Props {
  actorName: string;
  pageTitle: string;
  pageUrl: string;
  spaceName: string;
  userName: string;
}

export const PageUpdateEmail = ({
  userName,
  actorName,
  pageTitle,
  pageUrl,
  spaceName,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi {getGreetingName(userName)},</Text>
      <Text style={paragraph}>
        <strong>{actorName}</strong> updated{" "}
        <Link href={pageUrl} style={link}>
          <strong>{pageTitle}</strong>
        </Link>{" "}
        in the <strong>{spaceName}</strong> space.
      </Text>
    </Section>
    <EmailButton href={pageUrl}>View page</EmailButton>
  </MailBody>
);

export default PageUpdateEmail;
