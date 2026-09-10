import {
  ColorInput,
  Group,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { IconColorPicker } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Feature } from "@/ee/features.ts";
import { useHasFeature } from "@/ee/hooks/use-feature.ts";
import { useUpgradeLabel } from "@/ee/hooks/use-upgrade-label.ts";
import { usePublishSpaceMutation } from "@/features/public-space/queries/public-space-query.ts";
import {
  DEFAULT_DOCS_PRESET,
  DOCS_THEME_PRESETS,
  isValidDocsColor,
  matchDocsPreset,
} from "@/features/public-space/theme/docs-theme.ts";
import { IPublicSpaceAppearance } from "@/features/public-space/types/public-space.types.ts";
import classes from "./appearance-settings.module.css";

type AppearanceSettingsProps = {
  spaceId: string;
  appearance?: IPublicSpaceAppearance;
};

export default function AppearanceSettings({
  spaceId,
  appearance,
}: AppearanceSettingsProps) {
  const { t } = useTranslation();
  const publishMutation = usePublishSpaceMutation();
  const hasAppearance = useHasFeature(Feature.PUBLIC_SPACE_APPEARANCE);
  const upgradeLabel = useUpgradeLabel();

  const matchedPreset = matchDocsPreset(appearance);
  const [customOpen, setCustomOpen] = useState(matchedPreset === null);
  const [customLight, setCustomLight] = useState(
    appearance?.primaryColorLight ?? DEFAULT_DOCS_PRESET.light
  );
  const [customDark, setCustomDark] = useState(
    appearance?.primaryColorDark ?? DEFAULT_DOCS_PRESET.dark
  );

  useEffect(() => {
    setCustomOpen(matchDocsPreset(appearance) === null);
    setCustomLight(appearance?.primaryColorLight ?? DEFAULT_DOCS_PRESET.light);
    setCustomDark(appearance?.primaryColorDark ?? DEFAULT_DOCS_PRESET.dark);
  }, [appearance?.primaryColorLight, appearance?.primaryColorDark]);

  const saveAppearance = (payload: {
    primaryColorLight: string | null;
    primaryColorDark: string | null;
  }) => {
    if (!hasAppearance) {
      return;
    }
    publishMutation.mutate({ appearance: payload, enabled: true, spaceId });
  };

  const selectPreset = (presetId: string) => {
    setCustomOpen(false);
    const preset = DOCS_THEME_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    if (preset.id === DEFAULT_DOCS_PRESET.id) {
      saveAppearance({ primaryColorDark: null, primaryColorLight: null });
      return;
    }
    saveAppearance({
      primaryColorDark: preset.dark,
      primaryColorLight: preset.light,
    });
  };

  const commitCustom = (light: string, dark: string) => {
    if (!(isValidDocsColor(light) && isValidDocsColor(dark))) {
      return;
    }
    saveAppearance({ primaryColorDark: dark, primaryColorLight: light });
  };

  const swatches = DOCS_THEME_PRESETS.flatMap((preset) => [
    preset.light,
    preset.dark,
  ]);

  return (
    <div>
      <Text mt="md" size="md">
        {t("Appearance")}
      </Text>
      <Text c="dimmed" size="sm">
        {t("Choose the primary color of the public docs site.")}
      </Text>

      <Tooltip
        disabled={hasAppearance}
        label={upgradeLabel}
        position="top-start"
      >
        <div className={classes.presetRow} style={{ marginTop: 10 }}>
          {DOCS_THEME_PRESETS.map((preset) => {
            const selected = !customOpen && matchedPreset?.id === preset.id;
            return (
              <UnstyledButton
                aria-pressed={selected}
                className={classes.presetCard}
                data-selected={selected || undefined}
                disabled={!hasAppearance}
                key={preset.id}
                onClick={() => selectPreset(preset.id)}
              >
                <span
                  className={classes.presetSwatch}
                  style={{
                    background: `linear-gradient(135deg, ${preset.light} 50%, ${preset.dark} 50%)`,
                  }}
                />
                <Text size="xs">{t(preset.nameKey)}</Text>
              </UnstyledButton>
            );
          })}

          <UnstyledButton
            aria-pressed={customOpen}
            className={classes.presetCard}
            data-selected={customOpen || undefined}
            disabled={!hasAppearance}
            onClick={() => setCustomOpen(true)}
          >
            <span className={classes.customSwatch}>
              <IconColorPicker aria-hidden size={13} stroke={2} />
            </span>
            <Text size="xs">{t("Custom")}</Text>
          </UnstyledButton>
        </div>
      </Tooltip>

      {customOpen && hasAppearance && (
        <Group align="flex-start" grow mt="sm">
          <ColorInput
            format="hex"
            label={t("Light mode color")}
            onChange={setCustomLight}
            onChangeEnd={(value) => {
              setCustomLight(value);
              commitCustom(value, customDark);
            }}
            swatches={swatches}
            value={customLight}
          />
          <ColorInput
            format="hex"
            label={t("Dark mode color")}
            onChange={setCustomDark}
            onChangeEnd={(value) => {
              setCustomDark(value);
              commitCustom(customLight, value);
            }}
            swatches={swatches}
            value={customDark}
          />
        </Group>
      )}
    </div>
  );
}
