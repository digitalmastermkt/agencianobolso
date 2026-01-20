import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!stripeKey) {
    console.error("Missing STRIPE_SECRET_KEY");
    return new Response("Configuration error", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  // Create Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    let event: Stripe.Event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      const signature = req.headers.get("stripe-signature");
      if (!signature) {
        console.error("Missing stripe-signature header");
        return new Response("Missing signature", { status: 400 });
      }
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // For development without webhook secret
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`[STRIPE-WEBHOOK] Processing event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata || {};

        // Handle credits purchase
        if (metadata.type === "credits_purchase") {
          const userId = metadata.user_id;
          const credits = parseInt(metadata.credits || "0", 10);

          if (userId && credits > 0) {
            console.log(`[STRIPE-WEBHOOK] Adding ${credits} credits to user ${userId}`);

            const { data, error } = await supabaseAdmin.rpc("add_extra_credits", {
              p_user_id: userId,
              p_amount: credits,
              p_description: `Compra de ${credits} créditos extras via Stripe`,
            });

            if (error) {
              console.error("[STRIPE-WEBHOOK] Error adding credits:", error);
              return new Response("Error processing credits", { status: 500 });
            }

            console.log(`[STRIPE-WEBHOOK] Credits added successfully:`, data);
          }
        }

        // Handle subscription (existing logic)
        if (metadata.tier) {
          const email = metadata.email || session.customer_email;
          const tier = metadata.tier;

          if (email && tier) {
            console.log(`[STRIPE-WEBHOOK] Processing subscription for ${email}, tier: ${tier}`);

            // Get monthly credits for the tier
            const { data: planSettings } = await supabaseAdmin
              .from("plan_settings")
              .select("monthly_credits")
              .eq("plan", tier)
              .single();

            const monthlyCredits = planSettings?.monthly_credits || 10;

            // Find user by email
            const { data: users } = await supabaseAdmin.auth.admin.listUsers();
            const user = users?.users?.find(u => u.email === email);

            if (user) {
              // Update or create credits balance
              const now = new Date();
              const periodEnd = new Date(now);
              periodEnd.setMonth(periodEnd.getMonth() + 1);

              const { error: upsertError } = await supabaseAdmin
                .from("user_credits_balance")
                .upsert({
                  user_id: user.id,
                  credits_balance: monthlyCredits,
                  credits_monthly_limit: monthlyCredits,
                  current_billing_period_start: now.toISOString(),
                  current_billing_period_end: periodEnd.toISOString(),
                  last_reset_at: now.toISOString(),
                }, { onConflict: "user_id" });

              if (upsertError) {
                console.error("[STRIPE-WEBHOOK] Error updating credits balance:", upsertError);
              }

              // Update subscribers table
              const customerId = typeof session.customer === 'string' 
                ? session.customer 
                : session.customer?.id;

              await supabaseAdmin
                .from("subscribers")
                .upsert({
                  email,
                  user_id: user.id,
                  stripe_customer_id: customerId,
                  subscribed: true,
                  subscription_tier: tier,
                  subscription_end: periodEnd.toISOString(),
                }, { onConflict: "email" });
            }
          }
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id;

        // Find subscriber by customer ID
        const { data: subscriber } = await supabaseAdmin
          .from("subscribers")
          .select("user_id, email")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subscriber) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          
          await supabaseAdmin
            .from("subscribers")
            .update({
              subscribed: isActive,
              subscription_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          console.log(`[STRIPE-WEBHOOK] Updated subscription for ${subscriber.email}: active=${isActive}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Only process subscription renewals
        if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
          const customerId = typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id;

          // Find subscriber
          const { data: subscriber } = await supabaseAdmin
            .from("subscribers")
            .select("user_id, subscription_tier")
            .eq("stripe_customer_id", customerId)
            .single();

          if (subscriber?.user_id && subscriber?.subscription_tier) {
            // Get plan credits
            const { data: planSettings } = await supabaseAdmin
              .from("plan_settings")
              .select("monthly_credits")
              .eq("plan", subscriber.subscription_tier)
              .single();

            const monthlyCredits = planSettings?.monthly_credits || 10;

            // Reset monthly credits
            await supabaseAdmin.rpc("reset_monthly_credits", {
              p_user_id: subscriber.user_id,
              p_monthly_limit: monthlyCredits,
            });

            console.log(`[STRIPE-WEBHOOK] Reset credits for user ${subscriber.user_id}: ${monthlyCredits} credits`);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[STRIPE-WEBHOOK] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
