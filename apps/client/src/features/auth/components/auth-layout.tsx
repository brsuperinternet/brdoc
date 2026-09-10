import { Group, Text } from "@mantine/core";
import React from "react";
import classes from "./auth.module.css";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <>
      <Group className={classes.logo} gap={8} justify="center">
        <img
          alt="Docmost"
          height={22}
          src="/icons/favicon-32x32.png"
          width={22}
        />
        <Text fw={700} size="28px" style={{ userSelect: "none" }}>
          Docmost
        </Text>
      </Group>
      <main>{children}</main>
    </>
  );
}
