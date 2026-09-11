import { Indicator, Text, Tooltip } from "@mantine/core";
import { useTranslation } from "react-i18next";
import semverGt from "semver/functions/gt";
import classes from "@/components/settings/settings.module.css";
import { useAppVersion } from "@/features/workspace/queries/workspace-query.ts";

export default function AppVersion() {
  const { t } = useTranslation();
  const { data: appVersion } = useAppVersion(true);
  let hasUpdate = false;
  try {
    hasUpdate =
      appVersion &&
      Number.parseFloat(appVersion.latestVersion) > 0 &&
      semverGt(appVersion.latestVersion, appVersion.currentVersion);
  } catch (err) {
    console.error(err);
  }

  return (
    <div className={classes.text}>
      <Tooltip
        disabled={!hasUpdate}
        label={t("{{latestVersion}} is available", {
          latestVersion: `v${appVersion?.latestVersion}`,
        })}
      >
        <Indicator
          color="gray"
          disabled={!hasUpdate}
          inline
          label={t("New update")}
          onClick={() => {
            window.open(
              "https://github.com/docmost/docmost/releases",
              "_blank"
            );
          }}
          position="middle-end"
          size={16}
          style={{ cursor: "pointer" }}
        >
          <Text
            c="dimmed"
            component="a"
            href="https://github.com/docmost/docmost/releases"
            mr={45}
            size="sm"
            target="_blank"
          >
            {appVersion?.currentVersion && <>v{appVersion?.currentVersion}</>}
          </Text>
        </Indicator>
      </Tooltip>
    </div>
  );
}
