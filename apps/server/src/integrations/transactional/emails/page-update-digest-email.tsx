import { Link, Section, Text } from "react-email";
import { content, link, paragraph } from "../css/styles";
import { getGreetingName, MailBody } from "../partials/partials";

interface PageUpdate {
  title: string;
  updatedBy: string[];
  url: string;
}

interface Props {
  pageUpdates: PageUpdate[];
  totalUpdates: number;
  userName: string;
}

export const PageUpdateDigestEmail = ({
  userName,
  pageUpdates,
  totalUpdates,
}: Props) => (
  <MailBody>
    <Section style={content}>
      <Text style={paragraph}>Hi {getGreetingName(userName)},</Text>
      <Text style={paragraph}>
        There {totalUpdates === 1 ? "has" : "have"} been{" "}
        <strong>
          {totalUpdates} update{totalUpdates === 1 ? "" : "s"}
        </strong>{" "}
        since your last update.
      </Text>

      {pageUpdates.map((page, i) => (
        <Section key={i} style={pageCard}>
          <Text style={pageTitle}>
            <Link href={page.url} style={link}>
              {page.title}
            </Link>
          </Text>
          {page.updatedBy.length > 0 && (
            <Text style={updatedByText}>
              Edited by {page.updatedBy.join(", ")}
            </Text>
          )}
        </Section>
      ))}
    </Section>
  </MailBody>
);

const pageCard = {
  borderLeft: "3px solid #e8e5ef",
  marginBottom: "12px",
  paddingLeft: "12px",
};

const pageTitle = {
  ...paragraph,
  fontSize: 14,
  fontWeight: "bold" as const,
  margin: "0 0 2px 0",
};

const updatedByText = {
  ...paragraph,
  color: "#666",
  fontSize: 13,
  margin: "0",
};

export default PageUpdateDigestEmail;
