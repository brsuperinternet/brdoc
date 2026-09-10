import { Container } from "@mantine/core";
import { useParams } from "react-router-dom";
import { DocumentTitle } from "@/components/ui/document-title.tsx";
import SpacePublicNotice from "@/features/public-space/components/space-public-notice.tsx";
import SpaceHomeTabs from "@/features/space/components/space-home-tabs.tsx";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";

export default function SpaceHome() {
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  return (
    <>
      <DocumentTitle title={space?.name || "Overview"} />
      <Container pt="xl" size={"900"}>
        {space && <SpacePublicNotice space={space} />}
        {space && <SpaceHomeTabs />}
      </Container>
    </>
  );
}
