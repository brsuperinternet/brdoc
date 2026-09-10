import "@/features/editor/styles/index.css";
import { Container } from "@mantine/core";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ReadonlyPageEditor from "@/features/editor/readonly-page-editor";

type PdfRenderData = {
  pageId: string;
  title: string;
  content: any;
};

export default function PdfRenderPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [data, setData] = useState<PdfRenderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!(pageId && token)) {
      setError("Missing page ID or token");
      return;
    }

    fetch("/api/pdf-export/render", {
      body: JSON.stringify({ pageId, token }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((result) => setData(result.data))
      .catch((err) => setError(err.message));
  }, [pageId, token]);

  useEffect(() => {
    if (data?.title) {
      document.title = data.title;
    }
  }, [data?.title]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!data) {
    return null;
  }

  return (
    <Container p={0} size={900}>
      <ReadonlyPageEditor
        content={data.content}
        key={data.pageId}
        pageId={data.pageId}
        printMode
        title={data.title}
      />
    </Container>
  );
}
