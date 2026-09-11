import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { MailBody } from "../partials/partials";

interface Props {
  invitedUserEmail: string;
  invitedUserName: string;
}

export const InvitationAcceptedEmail = ({
  invitedUserName,
  invitedUserEmail,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi there,</Text>
      <Text style={paragraph}>
        {invitedUserName} ({invitedUserEmail}) has accepted your invitation, and
        is now a member of the workspace.
      </Text>
    </Section>
  </MailBody>
);

export default InvitationAcceptedEmail;
