import { useComputedColorScheme } from "@mantine/core";
import { useEffect } from "react";
import { IPublicSpaceAppearance } from "@/features/public-space/types/public-space.types.ts";

export type DocsThemePreset = {
  id: string;
  nameKey: string;
  light: string;
  dark: string;
};

export const DOCS_THEME_PRESETS: DocsThemePreset[] = [
  { dark: "#6ea6f6", id: "default", light: "#2b7af1", nameKey: "Default" },
  { dark: "#2dd4bf", id: "forest", light: "#0f766e", nameKey: "Forest" },
  { dark: "#a78bfa", id: "violet", light: "#6d28d9", nameKey: "Violet" },
  { dark: "#fb923c", id: "ember", light: "#c2410c", nameKey: "Ember" },
  { dark: "#fb7185", id: "rose", light: "#be123c", nameKey: "Rose" },
];

export const DEFAULT_DOCS_PRESET = DOCS_THEME_PRESETS[0];

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

export function isValidDocsColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

export function resolveDocsAccent(
  appearance: IPublicSpaceAppearance | undefined,
  scheme: "light" | "dark"
): string {
  const custom =
    scheme === "dark"
      ? appearance?.primaryColorDark
      : appearance?.primaryColorLight;
  if (isValidDocsColor(custom)) {
    return custom;
  }
  return scheme === "dark"
    ? DEFAULT_DOCS_PRESET.dark
    : DEFAULT_DOCS_PRESET.light;
}

export function matchDocsPreset(
  appearance: IPublicSpaceAppearance | undefined
): DocsThemePreset | null {
  const light = appearance?.primaryColorLight;
  const dark = appearance?.primaryColorDark;
  if (!(light || dark)) {
    return DEFAULT_DOCS_PRESET;
  }
  return (
    DOCS_THEME_PRESETS.find(
      (preset) =>
        preset.light.toLowerCase() === light?.toLowerCase() &&
        preset.dark.toLowerCase() === dark?.toLowerCase()
    ) ?? null
  );
}

// Set on documentElement (not the shell root) so portaled Mantine surfaces on
// /docs routes (spotlight, drawers) follow the space accent too.
const ACCENT_VARIABLES = (accent: string): Record<string, string> => ({
  "--docs-accent": accent,
  "--docs-accent-soft": `color-mix(in srgb, ${accent} 10%, transparent)`,
  "--mantine-color-anchor": accent,
  "--mantine-primary-color-filled": accent,
  "--mantine-primary-color-filled-hover": `color-mix(in srgb, ${accent} 85%, black)`,
  "--mantine-primary-color-light": `color-mix(in srgb, ${accent} 10%, transparent)`,
  "--mantine-primary-color-light-color": accent,
  "--mantine-primary-color-light-hover": `color-mix(in srgb, ${accent} 15%, transparent)`,
});

export function useDocsAccent(appearance: IPublicSpaceAppearance | undefined) {
  const scheme = useComputedColorScheme("light");
  const light = appearance?.primaryColorLight;
  const dark = appearance?.primaryColorDark;

  useEffect(() => {
    const accent = resolveDocsAccent(
      { primaryColorDark: dark, primaryColorLight: light },
      scheme
    );
    const root = document.documentElement;
    const variables = ACCENT_VARIABLES(accent);
    for (const [name, value] of Object.entries(variables)) {
      root.style.setProperty(name, value);
    }
    return () => {
      for (const name of Object.keys(variables)) {
        root.style.removeProperty(name);
      }
    };
  }, [light, dark, scheme]);
}
