import { getApiKeys } from "@/ee/api-key";
import { getAuditLogs } from "@/ee/audit/services/audit-service";
import {
  getBilling,
  getBillingPlans,
} from "@/ee/billing/services/billing-service.ts";
import { getLicenseInfo } from "@/ee/licence/services/license-service.ts";
import { getVerificationList } from "@/ee/page-verification/services/page-verification-service";
import { getScimTokens } from "@/ee/scim/services/scim-token-service";
import { getSsoProviders } from "@/ee/security/services/security-service.ts";
import { getGroups } from "@/features/group/services/group-service.ts";
import { getShares } from "@/features/share/services/share-service.ts";
import { getSpaces } from "@/features/space/services/space-service.ts";
import { getWorkspaceMembers } from "@/features/workspace/services/workspace-service.ts";
import { QueryParams } from "@/lib/types.ts";
import { queryClient } from "@/main.tsx";

export const prefetchWorkspaceMembers = () => {
  const params: QueryParams = { limit: 100, query: "" };
  queryClient.prefetchQuery({
    queryFn: () => getWorkspaceMembers(params),
    queryKey: ["workspaceMembers", params],
  });
};

export const prefetchSpaces = () => {
  queryClient.prefetchQuery({
    queryFn: () => getSpaces({}),
    queryKey: ["spaces", {}],
  });
};

export const prefetchGroups = () => {
  queryClient.prefetchQuery({
    queryFn: () => getGroups({}),
    queryKey: ["groups", {}],
  });
};

export const prefetchBilling = () => {
  queryClient.prefetchQuery({
    queryFn: () => getBilling(),
    queryKey: ["billing"],
  });

  queryClient.prefetchQuery({
    queryFn: () => getBillingPlans(),
    queryKey: ["billing-plans"],
  });
};

export const prefetchLicense = () => {
  queryClient.prefetchQuery({
    queryFn: () => getLicenseInfo(),
    queryKey: ["license"],
  });
};

export const prefetchSsoProviders = () => {
  queryClient.prefetchQuery({
    queryFn: () => getSsoProviders(),
    queryKey: ["sso-providers"],
  });
};

export const prefetchShares = () => {
  queryClient.prefetchQuery({
    queryFn: () => getShares({}),
    queryKey: ["share-list", {}],
  });
};

export const prefetchApiKeys = () => {
  queryClient.prefetchQuery({
    queryFn: () => getApiKeys({}),
    queryKey: ["api-key-list", {}],
  });
};

export const prefetchApiKeyManagement = () => {
  queryClient.prefetchQuery({
    queryFn: () => getApiKeys({ adminView: true }),
    queryKey: ["api-key-list", { adminView: true }],
  });
};

export const prefetchAuditLogs = () => {
  const params = { limit: 50 };
  queryClient.prefetchQuery({
    queryFn: () => getAuditLogs(params),
    queryKey: ["audit-logs", params],
  });
};

export const prefetchVerifiedPages = () => {
  const params = { limit: 50 };
  queryClient.prefetchQuery({
    queryFn: () => getVerificationList(params),
    queryKey: ["verification-list", params],
  });
};

export const prefetchScimTokens = () => {
  queryClient.prefetchQuery({
    queryFn: () => getScimTokens({}),
    queryKey: ["scim-token-list", { cursor: undefined }],
  });
};
