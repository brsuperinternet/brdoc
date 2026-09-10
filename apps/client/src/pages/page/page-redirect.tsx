import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Error404 } from "@/components/ui/error-404.tsx";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { usePageQuery } from "@/features/page/queries/page-query";
import { extractPageSlugId } from "@/lib";

export default function PageRedirect() {
  const { pageSlug } = useParams();
  const {
    data: page,
    isLoading: pageIsLoading,
    isError,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const navigate = useNavigate();

  useEffect(() => {
    if (page) {
      const pageUrl = buildPageUrl(page.space.slug, page.slugId, page.title);
      navigate(pageUrl);
    }
  }, [page]);

  if (isError) {
    return <Error404 />;
  }

  if (pageIsLoading) {
    return <></>;
  }

  return null;
}
