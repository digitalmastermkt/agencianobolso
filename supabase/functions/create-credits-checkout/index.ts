import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit packages configuration - Updated for 4x margin
const CREDIT_PACKAGES: Record<string, { credits: number; price_cents: number; name: string }> = {
  "credits_10": { credits: 10, price_cents: 4000, name: "10 Créditos Extras" },
  "credits_25": { credits: 25, price_cents: 9000, name: "25 Créditos Extras" },
  "credits_50": { credits: 50, price_cents: 16000, name: "50 Créditos Extras" },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const { package_id } = await req.json();

    const creditPackage = CREDIT_PACKAGES[package_id];
    if (!creditPackage) {
      return new Response(
        JSON.stringify({ error: "Pacote de créditos inválido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const email = userData.user.email;
    const userId = userData.user.id;

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
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: creditPackage.name,
              description: `Pacote de ${creditPackage.credits} créditos extras para usar na plataforma`,
            },
            unit_amount: creditPackage.price_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/success?credits=${creditPackage.credits}`,
      cancel_url: `${origin}/cancel`,
      metadata: {
        type: "credits_purchase",
        package_id,
        credits: String(creditPackage.credits),
        user_id: userId,
        email,
      },
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[CREATE-CREDITS-CHECKOUT] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
