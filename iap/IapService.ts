export interface PurchaseResult {
  ok: boolean;
  cancelled?: boolean;
  errorMessage?: string;
}

export interface IapPurchaseService {
  buySubscriptionMonthly: () => Promise<PurchaseResult>;
  buyCredits3Pack: () => Promise<PurchaseResult>;
}

// Placeholder IDs; replace with real App Store Connect product IDs when available.
export const IAP_PRODUCTS = {
  subscriptionMonthly: {
    id: 'oalethia.premium.monthly',
    type: 'subscription' as const,
  },
  credits3Pack: {
    id: 'oalethia.credits.3pack',
    type: 'consumable' as const,
    credits: 3,
  },
};

export const IapService: IapPurchaseService = {
  async buySubscriptionMonthly() {
    // TODO: Implement with StoreKit (expo-in-app-purchases or react-native-iap)
    return { ok: false, errorMessage: 'In-app purchases are not configured yet.' };
  },
  async buyCredits3Pack() {
    // TODO: Implement with StoreKit (expo-in-app-purchases or react-native-iap)
    return { ok: false, errorMessage: 'In-app purchases are not configured yet.' };
  },
};

