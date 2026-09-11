import "@mantine/core/styles.css";
import "@mantine/spotlight/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import "@/styles/a11y-overrides.css";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { mantineCssResolver, theme } from "@/theme";
import App from "./App.tsx";
import "./i18n";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const container = document.getElementById("root") as HTMLElement;
const root = ((container as any).__reactRoot ??=
  ReactDOM.createRoot(container));

root.render(
  <BrowserRouter>
    <MantineProvider cssVariablesResolver={mantineCssResolver} theme={theme}>
      <ModalsProvider>
        <QueryClientProvider client={queryClient}>
          <Notifications limit={3} position="bottom-center" zIndex={10_000} />
          <HelmetProvider>
            <PostHogProvider client={posthog}>
              <App />
            </PostHogProvider>
          </HelmetProvider>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>
  </BrowserRouter>
);
