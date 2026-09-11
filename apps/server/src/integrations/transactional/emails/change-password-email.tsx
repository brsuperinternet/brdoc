import { Section, Text } from "react-email";
import { content, paragraph } from "../css/styles";
import { MailBody } from "../partials/partials";

interface Props {
  username?: string;
}

export const ChangePasswordEmail = ({ username }: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi {username},</Text>
      <Text style={paragraph}>
        This is a confirmation that your password has been changed.
      </Text>
    </Section>
  </MailBody>
);

export default ChangePasswordEmail;
