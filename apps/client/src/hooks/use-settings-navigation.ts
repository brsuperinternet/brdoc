import { useAtomValue } from "jotai";
import { useNavigate } from "react-router-dom";
import { settingsOriginAtom } from "@/components/settings/atoms/settings-origin-atom";

export function useSettingsNavigation() {
  const navigate = useNavigate();
  const origin = useAtomValue(settingsOriginAtom);

  const goBack = () => {
    navigate(origin ?? "/home", { replace: true });
  };

  return { goBack };
}
