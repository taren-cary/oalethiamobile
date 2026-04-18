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

import * as Haptics from 'expo-haptics';
import type { InAppPurchase } from 'expo-in-app-purchases';

import { supabase } from '@/lib/supabase';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { emitIapUpdated } from '../lib/iapEvents';

type ReceiptType = 'subscription' | 'credits';

type ProductMeta = {
  productId: string;
  receiptType: ReceiptType;
  /**
   * Credits-only purchases are consumable and should be treated as consumable on Android.
   * (On iOS, this flag is ignored by finishTransactionAsync.)
   */
  consumeOnAndroid: boolean;
  creditsToAdd?: number;
};

type IapModule = typeof import('expo-in-app-purchases');

let cachedIapModule: IapModule | null | undefined;

function getIapModule(): IapModule | null {
  if (cachedIapModule !== undefined) return cachedIapModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedIapModule = require('expo-in-app-purchases') as IapModule;
  } catch {
    cachedIapModule = null;
  }
  return cachedIapModule;
}

const IAP_UNAVAILABLE_MESSAGE =
  'In-app purchases are not available in this build (e.g. Expo Go). Use a development build or TestFlight to test purchases.';

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

const VERIFY_FUNCTION_SLUG = 'iap-verify-receipt';

const PRODUCT_META_BY_ID: Record<string, ProductMeta> = {
  [IAP_PRODUCTS.subscriptionMonthly.id]: {
    productId: IAP_PRODUCTS.subscriptionMonthly.id,
    receiptType: 'subscription',
    consumeOnAndroid: false,
  },
  [IAP_PRODUCTS.credits3Pack.id]: {
    productId: IAP_PRODUCTS.credits3Pack.id,
    receiptType: 'credits',
    consumeOnAndroid: true,
    creditsToAdd: IAP_PRODUCTS.credits3Pack.credits,
  },
};

let isConnected = false;
let isListenerRegistered = false;

const pendingByProductId = new Map<
  string,
  {
    resolve: (result: PurchaseResult) => void;
    timeoutHandle: ReturnType<typeof setTimeout> | null;
  }
>();

function getPending(productId: string) {
  return pendingByProductId.get(productId);
}

function clearPending(productId: string) {
  const pending = pendingByProductId.get(productId);
  if (!pending) return;
  if (pending.timeoutHandle) clearTimeout(pending.timeoutHandle);
  pendingByProductId.delete(productId);
}

async function ensureInitialized() {
  const mod = getIapModule();
  if (!mod) return false;
  const { InAppPurchases, IAPResponseCode } = mod;

  if (!isConnected) {
    await InAppPurchases.connectAsync();
    isConnected = true;
  }

  if (!isListenerRegistered) {
    InAppPurchases.setPurchaseListener(async ({ responseCode, results, errorCode }) => {
      // Make sure this never throws; purchase listeners can be called at unexpected times.
      try {
        if (responseCode === IAPResponseCode.USER_CANCELED) {
          // Resolve all pending purchases as cancelled.
          pendingByProductId.forEach((pending) => pending.resolve({ ok: false, cancelled: true }));
          pendingByProductId.clear();
          return;
        }

        if (responseCode !== IAPResponseCode.OK) {
          const message =
            errorCode != null ? `Purchase error (${errorCode})` : 'Purchase failed. Please try again.';
          pendingByProductId.forEach((pending) =>
            pending.resolve({ ok: false, errorMessage: message }),
          );
          pendingByProductId.clear();
          return;
        }

        const purchases = (results ?? []).filter(
          (r): r is InAppPurchase => typeof (r as any).productId === 'string',
        );

        for (const purchase of purchases) {
          const meta = PRODUCT_META_BY_ID[purchase.productId];
          if (!meta) continue;
          if (!purchase.transactionReceipt) {
            const pending = getPending(purchase.productId);
            if (pending) {
              clearPending(purchase.productId);
              pending.resolve({ ok: false, errorMessage: 'Missing transaction receipt.' });
            }
            continue;
          }

          await InAppPurchasesMaybeVerifyAndFinish(purchase, meta);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Purchase processing failed.';
        pendingByProductId.forEach((pending) => pending.resolve({ ok: false, errorMessage: message }));
        pendingByProductId.clear();
      }
    });

    isListenerRegistered = true;
  }

  return true;
}

async function InAppPurchasesMaybeVerifyAndFinish(
  purchase: InAppPurchase,
  meta: ProductMeta,
) {
  const mod = getIapModule();
  if (!mod) return;

  const { transactionReceipt } = purchase;
  if (!transactionReceipt) return;

  const { error } = await supabase.functions.invoke(VERIFY_FUNCTION_SLUG, {
    method: 'POST',
    body: {
      productId: purchase.productId,
      transactionReceipt,
      // meta.creditsToAdd is not trusted (server validates productId) but is still useful for credits receipts.
      creditsToAdd: meta.creditsToAdd,
      receiptType: meta.receiptType,
    },
  });

  if (error) {
    const message = error.message ?? 'Could not verify purchase.';
    const pending = getPending(purchase.productId);
    if (pending) {
      clearPending(purchase.productId);
      pending.resolve({ ok: false, errorMessage: message });
    }
    return;
  }

  // After successful verification, call the credit purchase endpoint if this is a credits purchase
  if (meta.receiptType === 'credits' && meta.creditsToAdd) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (session) {
        await fetch(`${API_BASE_URL}/api/credits/purchase`, {
          method: 'POST',
          headers: getAuthHeaders(session),
          body: JSON.stringify({ amount: meta.creditsToAdd }),
        });
      }
    } catch (e) {
      // Log but don't fail the purchase - the backend verification already succeeded
      console.warn('Failed to call credit purchase endpoint:', e);
    }
  }

  if (!purchase.acknowledged) {
    await mod.InAppPurchases.finishTransactionAsync(purchase, meta.consumeOnAndroid);
  }

  // Notify app state and resolve any pending call.
  emitIapUpdated();
  const pending = getPending(purchase.productId);
  if (pending) {
    clearPending(purchase.productId);
    pending.resolve({ ok: true });
  }
}

async function verifyReceiptOnServer(args: {
  productId: string;
  transactionReceipt: string;
  receiptType: ReceiptType;
  creditsToAdd?: number;
}) {
  const { error } = await supabase.functions.invoke(VERIFY_FUNCTION_SLUG, {
    method: 'POST',
    body: args,
  });

  if (error) throw new Error(error.message ?? 'Could not verify purchase.');

  // After successful verification, call the credit purchase endpoint if this is a credits purchase
  if (args.receiptType === 'credits' && args.creditsToAdd) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;
      if (session) {
        await fetch(`${API_BASE_URL}/api/credits/purchase`, {
          method: 'POST',
          headers: getAuthHeaders(session),
          body: JSON.stringify({ amount: args.creditsToAdd }),
        });
      }
    } catch (e) {
      // Log but don't fail the purchase - the backend verification already succeeded
      console.warn('Failed to call credit purchase endpoint:', e);
    }
  }
}

/**
 * Called when StoreKit returns no subscription receipt at all, meaning the Apple
 * subscription has fully lapsed (never purchased, or billing lapsed long enough
 * that Apple no longer surfaces the receipt). Ensures the DB is not left on premium.
 */
async function reconcileNoActiveSubscription(): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;
  if (!session) return;

  try {
    await fetch(`${API_BASE_URL}/api/reconcile-subscription`, {
      method: 'POST',
      headers: getAuthHeaders(session),
    });
  } catch {
    // Best-effort; the next foreground sync will retry.
  }
}

async function buyItem(productId: string): Promise<PurchaseResult> {
  const initialized = await ensureInitialized();
  if (!initialized) return { ok: false, errorMessage: IAP_UNAVAILABLE_MESSAGE };
  const mod = getIapModule();
  if (!mod) return { ok: false, errorMessage: IAP_UNAVAILABLE_MESSAGE };
  const { InAppPurchases, IAPResponseCode } = mod;

  const meta = PRODUCT_META_BY_ID[productId];
  if (!meta) return { ok: false, errorMessage: 'Unknown product.' };

  const { responseCode } = await InAppPurchases.getProductsAsync([productId]);
  if (responseCode !== IAPResponseCode.OK) {
    return { ok: false, errorMessage: 'Product not available for purchase on this device.' };
  }

  const purchasePromise = new Promise<PurchaseResult>((resolve) => {
    const timeoutHandle = setTimeout(() => {
      clearPending(productId);
      resolve({ ok: false, errorMessage: 'Purchase timed out. Please try again.' });
    }, 90_000);

    pendingByProductId.set(productId, { resolve, timeoutHandle });
  });

  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await InAppPurchases.purchaseItemAsync(productId);
    return await purchasePromise;
  } catch (e) {
    clearPending(productId);
    const message = e instanceof Error ? e.message : 'Purchase failed. Please try again.';
    return { ok: false, errorMessage: message };
  }
}

export const IapService: IapPurchaseService = {
  async buySubscriptionMonthly() {
    return buyItem(IAP_PRODUCTS.subscriptionMonthly.id);
  },
  async buyCredits3Pack() {
    return buyItem(IAP_PRODUCTS.credits3Pack.id);
  },
  async restorePurchases() {
    const initialized = await ensureInitialized();
    if (!initialized) return { ok: false, errorMessage: IAP_UNAVAILABLE_MESSAGE };
    const mod = getIapModule();
    if (!mod) return { ok: false, errorMessage: IAP_UNAVAILABLE_MESSAGE };
    const { InAppPurchases, IAPResponseCode } = mod;

    const { responseCode, results, errorCode } = await InAppPurchases.getPurchaseHistoryAsync({
      useGooglePlayCache: false,
    });

    if (responseCode !== IAPResponseCode.OK) {
      const message =
        errorCode != null ? `Restore error (${errorCode})` : 'Restore failed. Please try again.';
      return { ok: false, errorMessage: message };
    }

    try {
      const purchases = (results ?? []).filter(
        (r): r is InAppPurchase => typeof (r as any).productId === 'string',
      );

      for (const purchase of purchases) {
        const meta = PRODUCT_META_BY_ID[purchase.productId];
        if (!meta) continue;
        if (!purchase.transactionReceipt) continue;

        await verifyReceiptOnServer({
          productId: purchase.productId,
          transactionReceipt: purchase.transactionReceipt,
          receiptType: meta.receiptType,
          creditsToAdd: meta.creditsToAdd,
        });

        if (!purchase.acknowledged) {
          await InAppPurchases.finishTransactionAsync(purchase, meta.consumeOnAndroid);
        }
      }

      emitIapUpdated();
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Restore failed. Please try again.';
      return { ok: false, errorMessage: message };
    }
  },

  async syncOwnedEntitlements() {
    const initialized = await ensureInitialized();
    if (!initialized) {
      await reconcileNoActiveSubscription();
      return;
    }

    const mod = getIapModule();
    if (!mod) {
      await reconcileNoActiveSubscription();
      return;
    }
    const { InAppPurchases, IAPResponseCode } = mod;

    const { responseCode, results } = await InAppPurchases.getPurchaseHistoryAsync({
      useGooglePlayCache: true,
    });
    if (responseCode !== IAPResponseCode.OK) return;

    const purchases = (results ?? []).filter(
      (r): r is InAppPurchase => typeof (r as any).productId === 'string',
    );

    // Track whether we found any subscription receipt. If StoreKit returns nothing
    // for the subscription product, the entitlement has fully lapsed and we need
    // to reconcile the DB back to free tier.
    let foundSubscriptionReceipt = false;

    for (const purchase of purchases) {
      const meta = PRODUCT_META_BY_ID[purchase.productId];
      if (!meta) continue;
      if (!purchase.transactionReceipt) continue;

      if (meta.receiptType === 'subscription') {
        foundSubscriptionReceipt = true;
      }

      try {
        await verifyReceiptOnServer({
          productId: purchase.productId,
          transactionReceipt: purchase.transactionReceipt,
          receiptType: meta.receiptType,
          creditsToAdd: meta.creditsToAdd,
        });

        if (!purchase.acknowledged) {
          await InAppPurchases.finishTransactionAsync(purchase, meta.consumeOnAndroid);
        }
      } catch {
        // Avoid breaking app startup. User can re-trigger by going to Profile and restoring.
      }
    }

    // No subscription receipt in purchase history → Apple has no active entitlement.
    // Reconcile so the DB never stays on premium when the subscription has truly lapsed.
    if (!foundSubscriptionReceipt) {
      await reconcileNoActiveSubscription();
    }

    emitIapUpdated();
  },
};

