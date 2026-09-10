import { Loader, Paper, ScrollArea } from "@mantine/core";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { memo } from "react";
import classes from "./ai-menu.module.css";

interface ResultPreviewProps {
  isLoading: boolean;
  output: string;
}
const ResultPreview = memo(({ output, isLoading }: ResultPreviewProps) => {
  if (!(output || isLoading)) {
    return;
  }

  const parsedOutput = `${marked.parse(output)}`;

  return (
    <Paper className={classes.resultPreview} mb={4} radius="md" shadow="lg">
      <ScrollArea.Autosize mah={300} scrollbarSize={5} type="scroll">
        <div className={classes.resultPreviewWrapper}>
          {parsedOutput && (
            <div
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(parsedOutput),
              }}
            />
          )}
          {isLoading && <Loader display="inline-block" ml="xs" size={12} />}
        </div>
      </ScrollArea.Autosize>
    </Paper>
  );
});

export { ResultPreview };
