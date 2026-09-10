export enum BillingPlan {
  STANDARD = "standard",
  BUSINESS = "business",
}

export interface IBilling {
  amount: number;
  billingScheme: string | null;
  cancelAt: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date;
  createdAt: Date;
  currency: string;
  deletedAt: Date;
  id: string;
  interval: string;
  metadata: Record<string, any>;
  periodEndAt: Date;
  periodStartAt: Date;
  planName: string | null;
  quantity: number;
  status: string;
  stripeCustomerId: string;
  stripeItemId: string;
  stripePriceId: string;
  stripeProductId: string;
  stripeSubscriptionId: string;
  tieredFlatAmount: number | null;
  tieredUnitAmount: number | null;
  tieredUpTo: string | null;
  updatedAt: Date;
  workspaceId: string;
}

export interface ICheckoutLink {
  url: string;
}

export interface IBillingPortal {
  url: string;
}

export interface IBillingPlan {
  billingScheme: string | null;
  currency: string;
  description: string;
  features: string[];
  monthlyId: string;
  name: string;
  price?: {
    monthly: string;
    yearly: string;
  };
  pricingTiers?: PricingTier[];
  productId: string;
  yearlyId: string;
}

interface PricingTier {
  custom?: boolean;
  monthly?: number;
  upTo: number;
  yearly?: number;
}
