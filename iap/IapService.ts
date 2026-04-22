import * as Haptics from 'expo-haptics';
import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';

import { emitIapUpdated } from '../lib/iapEvents';

export interface PurchaseResult {
  ok: boolean;
  cancelled?: boolean;
  errorMessage?: string;
}

export interface IapPurchaseService {
  buySubscriptionMonthly: () => Promise<PurchaseResult>;
  buyCredits3Pack: () => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  syncOwnedEntitlements: () => Promise<void>;
}

const RC_API_KEY = 'appl_hIuxXyffRcsPlVMyDhdRSPBvKkp';

export const IAP_PRODUCTS = {
  subscriptionMonthly: {
    id: 'com.oalethia.oalethiapro.monthly',
    type: 'subscription' as const,
  },
  credits3Pack: {
    id: 'com.oalethia.oalethia.3credits',
    type: 'consumable' as const,
    credits: 3,
  },
};

let configured = false;

export function configureRevenueCat(userId: string) {
  Purchases.setLogLevel(LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey: RC_API_KEY, appUserID: userId });
  configured = true;
}

async function buyPackage(productId: string): Promise<PurchaseResult> {
  if (!configured) {
    return { ok: false, errorMessage: 'In-app purchases are not available. Please try again.' };
  }

  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Try offerings first; if none are configured, fall through to direct product fetch.
    let pkg: PurchasesPackage | null = null;
    try {
      const offerings = await Purchases.getOfferings();
      const allPackages = Object.values(offerings.all).flatMap((o) => o.availablePackages);
      pkg = allPackages.find((p) => p.product.identifier === productId) ?? null;
    } catch {
      // No offerings configured — will purchase by product ID directly below.
    }

    if (pkg) {
      await Purchases.purchasePackage(pkg);
    } else {
      const products = await Purchases.getProducts([productId]);
      const product = products[0];
      if (!product) {
        return { ok: false, errorMessage: 'Product not available. Please try again later.' };
      }
      await Purchases.purchaseStoreProduct(product);
    }

    emitIapUpdated();
    return { ok: true };
  } catch (e: any) {
    if (e?.userCancelled) {
      return { ok: false, cancelled: true };
    }
    return { ok: false, errorMessage: e?.message ?? 'Purchase failed. Please try again.' };
  }
}

export const IapService: IapPurchaseService = {
  async buySubscriptionMonthly() {
    return buyPackage(IAP_PRODUCTS.subscriptionMonthly.id);
  },

  async buyCredits3Pack() {
    return buyPackage(IAP_PRODUCTS.credits3Pack.id);
  },

  async restorePurchases() {
    if (!configured) {
      return { ok: false, errorMessage: 'In-app purchases are not available. Please try again.' };
    }
    try {
      await Purchases.restorePurchases();
      emitIapUpdated();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, errorMessage: e?.message ?? 'Restore failed. Please try again.' };
    }
  },

  async syncOwnedEntitlements() {
    if (!configured) return;
    try {
      await Purchases.syncPurchases();
      emitIapUpdated();
    } catch {
      // Best-effort; next foreground sync will retry.
    }
  },
};
