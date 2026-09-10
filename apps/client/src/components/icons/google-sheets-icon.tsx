import { rem } from "@mantine/core";

interface Props {
  size?: number | string;
}

export function GoogleSheetsIcon({ size }: Props) {
  return (
    <svg
      style={{ height: rem(size), width: rem(size) }}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M37,45H11c-1.657,0-3-1.343-3-3V6c0-1.657,1.343-3,3-3h19l10,10v29C40,43.657,38.657,45,37,45z"
        fill="#43a047"
      />
      <path d="M40 13L30 13 30 3z" fill="#c8e6c9" />
      <path d="M30 13L40 23 40 13z" fill="#2e7d32" />
      <path
        d="M31,23H17h-2v2v2v2v2v2v2v2h18v-2v-2v-2v-2v-2v-2v-2H31z M17,25h4v2h-4V25z M17,29h4v2h-4V29z M17,33h4v2h-4V33z M31,35h-8v-2h8V35z M31,31h-8v-2h8V31z M31,27h-8v-2h8V27z"
        fill="#e8f5e9"
      />
    </svg>
  );
}
