import * as React from "react";
import { Body, Container, Head, Html, Row, Section, Text } from "react-email";
import {
  button as buttonStyle,
  container,
  footer,
  logo,
  main,
} from "../css/styles";

interface MailBodyProps {
  children: React.ReactNode;
}

export function MailBody({ children }: MailBodyProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <MailHeader />
        <Container style={container}>{children}</Container>
        <MailFooter />
      </Body>
    </Html>
  );
}

export function MailHeader() {
  return (
    <Section style={logo}>
      {/* <Heading style={h1}>docmost</Heading> */}
    </Section>
  );
}

interface EmailButtonProps {
  children: React.ReactNode;
  href: string;
}

export function EmailButton({ href, children }: EmailButtonProps) {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={{ margin: "0 0 15px 15px" }}
    >
      <tr>
        <td
          style={{
            backgroundColor: buttonStyle.backgroundColor,
            borderRadius: buttonStyle.borderRadius,
            textAlign: "center" as const,
          }}
        >
          <a
            href={href}
            style={{
              color: buttonStyle.color,
              display: "inline-block",
              fontFamily: buttonStyle.fontFamily,
              fontSize: buttonStyle.fontSize,
              padding: "8px 16px",
              textDecoration: "none",
            }}
            target="_blank"
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  );
}

export function MailFooter() {
  return (
    <Section style={footer}>
      <Row>
        <Text style={{ color: "#706a7b", textAlign: "center" }}>
          © {new Date().getFullYear()} Docmost, All Rights Reserved <br />
        </Text>
      </Row>
    </Section>
  );
}

export function getGreetingName(name?: string): string {
  return name?.split(" ")[0] || "there";
}
