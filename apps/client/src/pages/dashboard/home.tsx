import { Container, Space } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import HomeTabs from "@/features/home/components/home-tabs";
import SpaceCarousel from "@/features/space/components/space-carousel.tsx";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <DocumentTitle title={t("Home")} />
      <Container pt="xl" size={"900"}>
        <Space h="xl" />

        <SpaceCarousel />

        <Space h="xl" />

        <HomeTabs />
      </Container>
    </>
  );
}
