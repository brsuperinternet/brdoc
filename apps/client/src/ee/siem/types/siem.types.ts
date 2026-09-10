export const SIEM_MAX_DESTINATIONS_PER_WORKSPACE = 2;

export type SiemDestinationType = "http" | "splunk_hec" | "datadog";
export type SiemDestinationStatus = "healthy" | "failing";

export const DATADOG_SITES = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
  "ap1.datadoghq.com",
  "ddog-gov.com",
] as const;

export interface ITlsOptions {
  rejectUnauthorized: boolean;
}

export interface IHttpConfig {
  authHeaderName: string;
  authHeaderPrefix: string;
  format: "json" | "ndjson";
  tls?: ITlsOptions;
  url: string;
}

export interface ISplunkHecConfig {
  channelId: string;
  host?: string;
  index?: string;
  source: string;
  sourcetype: string;
  tls?: ITlsOptions;
  url: string;
}

export interface IDatadogConfig {
  service: string;
  site: string;
  tags?: string;
}

export type ISiemConfig = IHttpConfig | ISplunkHecConfig | IDatadogConfig;

export interface ISiemDestination {
  config: ISiemConfig;
  consecutiveFailures: number;
  createdAt: string;
  cursorCreatedAt: string;
  enabled: boolean;
  failingSince: string | null;
  hasSecrets: Record<string, boolean>;
  id: string;
  lastDeliveredAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  name: string;
  nextAttemptAt: string | null;
  status: SiemDestinationStatus;
  type: SiemDestinationType;
  updatedAt: string;
}

export interface ISiemDestinationInput {
  config: Record<string, unknown>;
  enabled?: boolean;
  name: string;
  secrets?: Record<string, string>;
  type: SiemDestinationType;
}

export interface IUpdateSiemDestinationInput {
  config?: Record<string, unknown>;
  destinationId: string;
  enabled?: boolean;
  name?: string;
  secrets?: Record<string, string>;
}

export interface ITestSiemDestinationInput {
  config: Record<string, unknown>;
  destinationId?: string;
  secrets?: Record<string, string>;
  type: SiemDestinationType;
}

export interface ISiemTestResult {
  delivered: boolean;
  error?: string;
  statusCode?: number;
}
