import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CUSTOMER-PORTAL] ${step}`, details ?? "");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User email not available");

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Ensure the Stripe customer exists for this user
    let customerId: string | null = null;
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    if (existing.data.length > 0) {
      customerId = existing.data[0].id;
      log("Found Stripe customer", { customerId });
    } else {
      const created = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = created.id;
      log("Created Stripe customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:5173";

    // Ensure a Billing Portal configuration exists (Stripe requires a default or explicit configuration)
    let configurationId: string | undefined = undefined;
    try {
      const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
      if (configs.data.length > 0) {
        configurationId = configs.data[0].id;
        log("Using existing portal configuration", { configurationId });
      } else {
        const conf = await stripe.billingPortal.configurations.create({
          business_profile: {
            privacy_policy_url: `${origin}/privacy`,
            terms_of_service_url: `${origin}/terms`,
          },
          features: {
            customer_update: { allowed_updates: ["address", "email", "phone"], enabled: true },
            payment_method_update: { enabled: true },
            subscription_cancel: { enabled: true, mode: "at_period_end" },
            subscription_update: { enabled: true, default_allowed_updates: ["price"], proration_behavior: "create_prorations" },
          },
        });
        configurationId = conf.id;
        log("Created portal configuration", { configurationId });
      }
    } catch (e) {
      log("Portal configuration check/create failed; proceeding without explicit configuration", e);
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/dashboard`,
      ...(configurationId ? { configuration: configurationId } : {}),
    });

    return new Response(
      JSON.stringify({ url: portal.url }),
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
