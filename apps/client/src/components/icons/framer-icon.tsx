import { rem } from "@mantine/core";

interface Props {
  size?: number | string;
}

export function FramerIcon({ size }: Props) {
  return (
    <svg
      style={{ height: rem(size), width: rem(size) }}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 0h16v8h-8zm0 8h8l8 8H4zm0 8h8v8z" />
    </svg>
  );
}
