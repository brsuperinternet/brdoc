export type LicenseType = "business" | "enterprise";

export interface ILicenseInfo {
  customerName: string;
  expiresAt: Date;
  id: string;
  issuedAt: Date;
  licenseType: LicenseType;
  seatCount: number;
  trial: boolean;
}
