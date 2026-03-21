import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

type ReceiptType = "subscription" | "credits";

type VerifyBody = {
  productId: string;
  transactionReceipt: string;
  receiptType?: ReceiptType;
};

// Keep this allowlist aligned with `iap/IapService.ts`.
const IAP_ALLOWLIST = {
  subscriptionMonthly: {
    productId: "com.oalethia.oalethiapro.monthly",
    receiptType: "subscription" as const,
  },
  credits3Pack: {
    productId: "com.oalethia.oalethia.3credits",
    receiptType: "credits" as const,
    credits: 3,
  },
};

function getProductMeta(productId: string) {
  const all = Object.values(IAP_ALLOWLIST) as Array<{
    productId: string;
    receiptType: ReceiptType;
    credits?: number;
  }>;
  return all.find((p) => p.productId === productId);
}

function toIsoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function safeInt(v: unknown) {
  const n =
    typeof v === "string" ? Number(v) : typeof v === "number" ? v : Number.NaN;
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

async function verifyReceiptWithApple(params: { receiptData: string; password: string }) {
  const verifyProductionUrl = "https://buy.itunes.apple.com/verifyReceipt";
  const verifySandboxUrl = "https://sandbox.itunes.apple.com/verifyReceipt";

  const body = {
    "receipt-data": params.receiptData,
    password: params.password,
    "exclude-old-transactions": true,
  };

  const post = async (url: string) => {
    const resp = await fetch(url, {
      method: "POST",
      headers: { ...JSON_HEADERS },
      body: JSON.stringify(body),
    });
    const json = await resp.json().catch(() => null);
    return json;
  };

  // Try production first; Apple returns 21007 when receipt is from sandbox.
  let json: any = await post(verifyProductionUrl);
  if (!json) throw new Error("Apple verification failed (no response)");

  if (json.status === 21007) {
    json = await post(verifySandboxUrl);
  } else if (json.status === 21008) {
    json = await post(verifyProductionUrl);
  }

  if (json.status !== 0) {
    throw new Error(`Apple verifyReceipt failed (status=${json.status})`);
  }

  return json;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const appleSharedSecret = Deno.env.get("APPLE_SHARED_SECRET");
  if (!appleSharedSecret) {
    return new Response(JSON.stringify({ error: "APPLE_SHARED_SECRET is not configured" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase environment not configured" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const authClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: authUserData,
    error: authUserError,
  } = await authClient.auth.getUser();

  if (authUserError || !authUserData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const userId = authUserData.user.id;

  let body: VerifyBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { productId, transactionReceipt } = body ?? {};

  if (!productId || typeof productId !== "string") {
    return new Response(JSON.stringify({ error: "productId is required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (!transactionReceipt || typeof transactionReceipt !== "string") {
    return new Response(JSON.stringify({ error: "transactionReceipt is required" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const productMeta = getProductMeta(productId);
  if (!productMeta) {
    return new Response(JSON.stringify({ error: "Unknown productId" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const appleJson = await verifyReceiptWithApple({
      receiptData: transactionReceipt,
      password: appleSharedSecret,
    });

    const receipt = appleJson?.receipt;
    if (!receipt) {
      return new Response(JSON.stringify({ error: "Apple response missing receipt" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    // ── SUBSCRIPTION ──────────────────────────────────────────────────────────
    if (productMeta.receiptType === "subscription") {
      const latest = (appleJson?.latest_receipt_info ?? receipt.latest_receipt_info ?? []) as Array<Record<string, unknown>>;
      const matching = latest.filter((r) => r.product_id === productId);

      if (matching.length === 0) {
        return new Response(
          JSON.stringify({ error: "No matching subscription transactions found in receipt" }),
          { status: 400, headers: JSON_HEADERS },
        );
      }

      // Pick the transaction with the latest expiry.
      const selected = matching
        .sort((a, b) => safeInt((b as any).expires_date_ms) - safeInt((a as any).expires_date_ms))[0];

      const expiresMs = safeInt((selected as any).expires_date_ms);
      const purchaseMs = safeInt((selected as any).purchase_date_ms ?? (selected as any).original_purchase_date_ms);
      const transactionId =
        ((selected as any).transaction_id as string | undefined) ??
        ((selected as any).original_transaction_id as string | undefined);

      const isActive = expiresMs > Date.now();

      // Log when Apple confirmed the subscription is expired so operators can track churn.
      if (!isActive) {
        console.error(JSON.stringify({
          level: "WARN",
          event: "subscription_receipt_expired",
          userId,
          productId,
          expiresMs,
          now: Date.now(),
          message: "IAP receipt verified but subscription has expired — downgrading to free tier",
        }));
      }

      const { data: premiumTier, error: premiumErr } = await supabase
        .from("subscription_tiers")
        .select("id, monthly_credits")
        .eq("name", "premium")
        .maybeSingle();

      if (premiumErr || !premiumTier) {
        return new Response(JSON.stringify({ error: "Premium subscription tier not found" }), {
          status: 500,
          headers: JSON_HEADERS,
        });
      }

      const { data: freeTier } = await supabase
        .from("subscription_tiers")
        .select("id, monthly_credits")
        .eq("name", "free")
        .maybeSingle();

      if (!freeTier) {
        return new Response(JSON.stringify({ error: "Free subscription tier not found" }), {
          status: 500,
          headers: JSON_HEADERS,
        });
      }

      const monthlyCredits = isActive
        ? (premiumTier.monthly_credits ?? 10)
        : (freeTier.monthly_credits ?? 3);

      const currentPeriodStart = purchaseMs > 0 ? new Date(purchaseMs).toISOString() : null;
      const currentPeriodEnd = expiresMs > 0 ? new Date(expiresMs).toISOString() : null;

      const targetStatus = isActive ? "active" : "canceled";
      // Critical: only grant premium tier while Apple says the subscription is active.
      const tierId = isActive ? premiumTier.id : freeTier.id;

      const { data: existingSubs } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (existingSubs && existingSubs.length > 0) {
        await supabase
          .from("user_subscriptions")
          .update({
            tier_id: tierId,
            stripe_subscription_id: transactionId ?? null,
            stripe_customer_id: null,
            status: targetStatus,
            current_period_start: currentPeriodStart,
            current_period_end: currentPeriodEnd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("user_subscriptions").insert({
          user_id: userId,
          tier_id: tierId,
          stripe_subscription_id: transactionId ?? null,
          stripe_customer_id: null,
          status: targetStatus,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          updated_at: new Date().toISOString(),
        });
      }

      // Update credits to match new tier's monthly allotment.
      const { data: creditsRow } = await supabase
        .from("user_credits")
        .select("purchased_credits")
        .eq("user_id", userId)
        .maybeSingle();

      const purchasedCredits = creditsRow?.purchased_credits ?? 0;
      const newCredits = purchasedCredits + monthlyCredits;
      const today = toIsoDate(new Date());

      const { data: existingCreditsRows } = await supabase
        .from("user_credits")
        .select("user_id")
        .eq("user_id", userId)
        .limit(1);

      if (existingCreditsRows && existingCreditsRows.length > 0) {
        await supabase
          .from("user_credits")
          .update({
            credits: newCredits,
            last_reset_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      } else {
        await supabase.from("user_credits").insert({
          user_id: userId,
          credits: newCredits,
          purchased_credits: purchasedCredits,
          last_reset_date: today,
          updated_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({ ok: true, subscriptionStatus: targetStatus }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    }

    // ── CONSUMABLE CREDITS ────────────────────────────────────────────────────
    const inApp = (receipt.in_app ?? []) as Array<Record<string, unknown>>;
    const matchingInApp = inApp.filter((r) => r.product_id === productId);

    if (matchingInApp.length === 0) {
      return new Response(JSON.stringify({ error: "No matching credit purchases found in receipt" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const selectedInApp = matchingInApp
      .sort((a, b) => safeInt((b as any).purchase_date_ms) - safeInt((a as any).purchase_date_ms))[0];

    const creditTxnId =
      ((selectedInApp as any).transaction_id as string | undefined) ??
      ((selectedInApp as any).original_transaction_id as string | undefined);

    if (!creditTxnId) {
      return new Response(JSON.stringify({ error: "Missing transaction id in receipt" }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const quantity = selectedInApp.quantity != null ? safeInt((selectedInApp as any).quantity) : 1;
    const creditsPerPurchase = productMeta.credits ?? 0;
    const creditsToAdd = creditsPerPurchase * (quantity > 0 ? quantity : 1);

    // Idempotency: don't double-credit the same transaction.
    const { data: existingPurchase } = await supabase
      .from("credit_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("stripe_payment_intent_id", creditTxnId)
      .limit(1);

    if (existingPurchase && existingPurchase.length > 0) {
      return new Response(JSON.stringify({ ok: true, alreadyProcessed: true }), {
        status: 200,
        headers: JSON_HEADERS,
      });
    }

    const purchaseAmount = safeInt((selectedInApp as any).purchase_amount);

    await supabase.from("credit_purchases").insert({
      user_id: userId,
      stripe_payment_intent_id: creditTxnId,
      credits_purchased: creditsToAdd,
      amount_paid: purchaseAmount,
      status: "completed",
    });

    const { data: creditsRow2, error: creditsErr } = await supabase
      .from("user_credits")
      .select("credits, purchased_credits")
      .eq("user_id", userId)
      .maybeSingle();

    if (creditsErr) {
      return new Response(JSON.stringify({ error: "Failed to load user_credits" }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    const purchasedCredits2 = creditsRow2?.purchased_credits ?? 0;
    const currentCredits = creditsRow2?.credits ?? 0;

    if (creditsRow2) {
      await supabase.from("user_credits").update({
        credits: currentCredits + creditsToAdd,
        purchased_credits: purchasedCredits2 + creditsToAdd,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else {
      const { data: freeTierForCredits } = await supabase
        .from("subscription_tiers")
        .select("monthly_credits")
        .eq("name", "free")
        .maybeSingle();

      const freeCredits = freeTierForCredits?.monthly_credits ?? 3;
      await supabase.from("user_credits").insert({
        user_id: userId,
        credits: freeCredits + creditsToAdd,
        purchased_credits: creditsToAdd,
        last_reset_date: toIsoDate(new Date()),
        updated_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Receipt verification failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
