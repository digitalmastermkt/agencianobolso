import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Invalid authorization token')
    }

    // Parse request body
    const { action, target_user_id, details, timestamp } = await req.json()

    // Validate required fields
    if (!action || !target_user_id) {
      throw new Error('Missing required fields: action and target_user_id')
    }

    // Log the security event
    const { error: logError } = await supabaseClient
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        action: action,
        table_name: 'profiles', // Default table for user-related events
        record_id: target_user_id,
        new_values: details || {},
        ip_address: req.headers.get('x-forwarded-for') || '0.0.0.0',
        user_agent: req.headers.get('user-agent') || 'Unknown'
      })

    if (logError) {
      console.error('Failed to log security event:', logError)
      throw logError
    }

    console.log(`Security event logged: ${action} by user ${user.id}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Security event logged successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error logging security event:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})