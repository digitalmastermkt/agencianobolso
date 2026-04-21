import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Master user email - secret with hardcoded fallback for resilience.
const MASTER_EMAIL_SECRET = (Deno.env.get("MASTER_USER_EMAIL") ?? "").toLowerCase().trim();
const MASTER_EMAILS = new Set<string>([
  "digitalmastermkt@gmail.com",
  ...(MASTER_EMAIL_SECRET.includes("@") ? [MASTER_EMAIL_SECRET] : []),
]);

const log = (step: string, details?: unknown) =>
  console.log(`[CHECK-SUBSCRIPTION] ${step}`, details ?? "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role to bypass RLS for upsert and read stripe_price_config
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    log("Start");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User email not available");

    // Master user bypass - always return Elite subscription
    if (MASTER_USER_EMAIL && user.email.toLowerCase() === MASTER_USER_EMAIL) {
      log("Master user detected, granting Elite access");
      return new Response(
        JSON.stringify({ 
          subscribed: true, 
          subscription_tier: "Elite", 
          subscription_end: null // Never expires
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Fetch all price configs from database to build mapping
    const { data: priceConfigs, error: configError } = await supabaseClient
      .from("stripe_price_config")
      .select("price_id, plan_tier");

    if (configError) {
      log("Error fetching price configs", configError);
      throw new Error("Failed to fetch price configuration");
    }

    // Build price-to-tier mapping dynamically
    const priceToTier: Record<string, "Essencial" | "Premium" | "Elite"> = {};
    priceConfigs?.forEach((config) => {
      priceToTier[config.price_id] = config.plan_tier as "Essencial" | "Premium" | "Elite";
    });

    log("Price mapping loaded", { count: Object.keys(priceToTier).length });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check for manual override first (beta/admin-granted plans)
    const { data: manualOverride } = await supabaseClient
      .from("subscribers")
      .select("subscribed, subscription_tier, subscription_end, manual_override")
      .eq("user_id", user.id)
      .eq("manual_override", true)
      .single();

    if (manualOverride && manualOverride.manual_override) {
      log("Manual override found for user", { tier: manualOverride.subscription_tier });
      
      // Provision credits for manual override users too
      if (manualOverride.subscribed && manualOverride.subscription_tier) {
        const overrideTier = manualOverride.subscription_tier as "Essencial" | "Premium" | "Elite";
        const { data: planSettings } = await supabaseClient
          .from("plan_settings")
          .select("monthly_credits")
          .eq("plan", overrideTier)
          .single();

        const monthlyCredits = planSettings?.monthly_credits || 10;

        const { data: currentBalance } = await supabaseClient
          .from("user_credits_balance")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!currentBalance) {
          log("Provisioning credits for manual override user", { tier: overrideTier, monthlyCredits });
          await supabaseClient.rpc("reset_monthly_credits", {
            p_user_id: user.id,
            p_monthly_limit: monthlyCredits,
            p_period_start: new Date().toISOString(),
            p_period_end: manualOverride.subscription_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
        }
      }

      return new Response(
        JSON.stringify({
          subscribed: manualOverride.subscribed,
          subscription_tier: manualOverride.subscription_tier,
          subscription_end: manualOverride.subscription_end,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Find (or not) a stripe customer for this email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined = customers.data[0]?.id;

    if (!customerId) {
      // No customer found, set as unsubscribed in DB
      await supabaseClient.from("subscribers").upsert(
        {
          email: user.email,
          user_id: user.id,
          stripe_customer_id: null,
          subscribed: false,
          subscription_tier: null,
          subscription_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );
      return new Response(
        JSON.stringify({ subscribed: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    const hasActive = subscriptions.data.length > 0;
    let tier: "Essencial" | "Premium" | "Elite" | null = null;
    let endIso: string | null = null;
    let periodStart: string | null = null;

    if (hasActive) {
      const sub = subscriptions.data[0];
      endIso = new Date(sub.current_period_end * 1000).toISOString();
      periodStart = new Date(sub.current_period_start * 1000).toISOString();
      const priceId = sub.items.data[0].price.id;
      tier = priceToTier[priceId] ?? null;
      
      if (!tier) {
        log("Warning: Price ID not found in config", priceId);
      }
    }

    // Upsert subscriber state
    await supabaseClient.from("subscribers").upsert(
      {
        email: user.email,
        user_id: user.id,
        stripe_customer_id: customerId,
        subscribed: hasActive,
        subscription_tier: tier,
        subscription_end: endIso,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    // ============ CREDIT PROVISIONING ============
    // If user has active subscription, reset their monthly credits
    if (hasActive && tier) {
      // Get monthly credits limit from plan_settings
      const { data: planSettings } = await supabaseClient
        .from("plan_settings")
        .select("monthly_credits")
        .eq("plan", tier)
        .single();

      const monthlyCredits = planSettings?.monthly_credits || 10;

      // Check if we need to reset credits (new billing period)
      const { data: currentBalance } = await supabaseClient
        .from("user_credits_balance")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Reset if: no record exists OR new billing period started
      const needsReset = !currentBalance || 
        (periodStart && (!currentBalance.current_billing_period_start || 
          new Date(periodStart) > new Date(currentBalance.current_billing_period_start)));

      if (needsReset) {
        log("Resetting monthly credits for user", { tier, monthlyCredits, periodStart });
        
        await supabaseClient.rpc("reset_monthly_credits", {
          p_user_id: user.id,
          p_monthly_limit: monthlyCredits,
          p_period_start: periodStart,
          p_period_end: endIso,
        });
      }
    }

    return new Response(
      JSON.stringify({ subscribed: hasActive, subscription_tier: tier, subscription_end: endIso }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    log("ERROR", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
