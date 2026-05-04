import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role to read stripe_price_config
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Use anon key for auth user validation
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const body = await req.json();
    const { price_id, tier: requestedTier, billing_cycle: requestedCycle } = body ?? {};

    let priceConfig: { plan_tier: string; billing_cycle: string; price_id: string } | null = null;

    if (requestedTier && requestedCycle) {
      // Preferred: look up price server-side by tier + cycle (no client exposure)
      const { data, error } = await supabaseClient
        .from("stripe_price_config")
        .select("plan_tier, billing_cycle, price_id")
        .eq("plan_tier", requestedTier)
        .eq("billing_cycle", requestedCycle)
        .single();
      if (error || !data) {
        console.error("[CREATE-CHECKOUT] Tier/cycle not found:", requestedTier, requestedCycle, error);
        return new Response(
          JSON.stringify({ error: "Plano inválido ou não configurado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      priceConfig = data;
    } else if (price_id) {
      const { data, error } = await supabaseClient
        .from("stripe_price_config")
        .select("plan_tier, billing_cycle, price_id")
        .eq("price_id", price_id)
        .single();
      if (error || !data) {
        console.error("[CREATE-CHECKOUT] Price not found in config:", price_id, error);
        return new Response(
          JSON.stringify({ error: "Preço inválido ou não configurado" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }
      priceConfig = data;
    } else {
      return new Response(
        JSON.stringify({ error: "Informe tier e billing_cycle (ou price_id)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const tier = priceConfig.plan_tier as "Essencial" | "Premium" | "Elite";
    const resolvedPriceId = priceConfig.price_id;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const email = userData.user.email;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe não configurado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Try to reuse existing customer by email
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data[0]?.id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/success`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        tier,
        billing_cycle: priceConfig.billing_cycle,
        email,
      },
    });

    console.log("[CREATE-CHECKOUT] Session created:", { tier, billing_cycle: priceConfig.billing_cycle, email });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CREATE-CHECKOUT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
