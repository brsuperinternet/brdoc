export interface MfaMethod {
  isEnabled: boolean;
  type: "totp" | "email";
}

export interface MfaSettings {
  backupCodesCount: number;
  isEnabled: boolean;
  lastUpdated?: string;
  methods: MfaMethod[];
}

export interface MfaSetupState {
  backupCodes?: string[];
  manualEntry?: string;
  method: "totp" | "email";
  qrCode?: string;
  secret?: string;
}

export interface MfaStatusResponse {
  backupCodesCount?: number;
  isEnabled?: boolean;
  method?: string | null;
}

export interface MfaSetupRequest {
  method: "totp";
}

export interface MfaSetupResponse {
  manualKey: string;
  method: string;
  qrCode: string;
}

export interface MfaEnableRequest {
  verificationCode: string;
}

export interface MfaEnableResponse {
  backupCodes: string[];
  success: boolean;
}

export interface MfaDisableRequest {
  confirmPassword?: string;
}

export interface MfaBackupCodesResponse {
  backupCodes: string[];
}

export interface MfaAccessValidationResponse {
  isMfaEnforced?: boolean;
  isTransferToken?: boolean;
  requiresMfaSetup?: boolean;
  userHasMfa?: boolean;
  valid: boolean;
}
