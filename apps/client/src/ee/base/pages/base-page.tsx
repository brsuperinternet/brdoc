import { Container, Stack, Text, Title } from "@mantine/core";
import { useParams } from "react-router-dom";
import { BaseView } from "@/ee/base/components/base-view";
import { useBaseQuery } from "@/ee/base/queries/base-query";
import { Feature } from "@/ee/features";
import { useHasFeature } from "@/ee/hooks/use-feature";

export default function BasePage() {
  const { pageId } = useParams<{ pageId: string }>();
  const hasBases = useHasFeature(Feature.BASES);
  const { data: base } = useBaseQuery(pageId ?? "");

  if (!pageId) {
    return (
      <Stack align="center" p="xl">
        <Text c="dimmed">No base ID provided</Text>
      </Stack>
    );
  }

  return (
    <Container
      fluid
      p="md"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 60px)",
      }}
    >
      {base && (
        <Title mb="xs" order={3}>
          {base.icon ? `${base.icon} ` : ""}
          {base.name}
        </Title>
      )}
      <BaseView
        editable={hasBases && (base?.permissions?.canEdit ?? false)}
        pageId={pageId}
      />
    </Container>
  );
}
