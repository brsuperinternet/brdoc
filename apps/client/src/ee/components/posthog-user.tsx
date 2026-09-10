import { useAtom } from "jotai";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";

export function PosthogUser() {
  const posthog = usePostHog();
  const [currentUser] = useAtom(currentUserAtom);

  useEffect(() => {
    if (currentUser) {
      const user = currentUser?.user;
      const workspace = currentUser?.workspace;
      if (!(user && workspace)) {
        return;
      }

      posthog?.identify(user.id, {
        createdAt: user.createdAt,
        email: user.email,
        lastActiveAt: new Date().toISOString(),
        name: user.name,
        source: "docmost-app",
        workspaceHostname: workspace.hostname,
        workspaceId: user.workspaceId,
      });
      posthog?.group("workspace", workspace.id, {
        createdAt: workspace.createdAt,
        hasStripeCustomerId: !!workspace.stripeCustomerId,
        hostname: workspace.hostname,
        isOnTrial: !!workspace.trialEndAt,
        lastActiveAt: new Date().toISOString(),
        memberCount: workspace.memberCount,
        name: workspace.name,
        plan: workspace?.plan,
        source: "docmost-app",
        status: workspace.status,
      });
    }
  }, [posthog, currentUser]);

  return null;
}
