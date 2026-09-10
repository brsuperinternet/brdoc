import { Button, Container, Group, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import classes from "./error-404.module.css";

export function Error404() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t("404 page not found")} />
      <Container className={classes.root}>
        <Title className={classes.title}>{t("404 page not found")}</Title>
        <Text c="dimmed" className={classes.description} size="lg" ta="center">
          {t("Sorry, we can't find the page you are looking for.")}
        </Text>
        <Group justify="center">
          <Button component={Link} size="md" to={"/home"} variant="subtle">
            {t("Take me back to homepage")}
          </Button>
        </Group>
      </Container>
    </>
  );
}
