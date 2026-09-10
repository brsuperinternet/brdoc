import { Textarea } from "@mantine/core";
import { forwardRef } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
};

export const FormulaInput = forwardRef<HTMLTextAreaElement, Props>(
  function FormulaInput({ value, onChange, hasError }, ref) {
    return (
      <Textarea
        autosize
        maxRows={8}
        minRows={3}
        onChange={(e) => onChange(e.currentTarget.value)}
        placeholder='prop("Price") * prop("Qty")'
        ref={ref}
        styles={{
          input: {
            backgroundColor: "var(--mantine-color-gray-0)",
            borderColor: hasError
              ? "var(--mantine-color-red-6)"
              : "var(--mantine-color-blue-6)",
            borderWidth: 1.5,
            boxShadow: hasError
              ? "0 0 0 3px var(--mantine-color-red-1)"
              : "0 0 0 3px var(--mantine-color-blue-1)",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, 'JetBrains Mono', monospace",
            fontSize: 13,
            lineHeight: 1.65,
          },
        }}
        value={value}
      />
    );
  }
);
