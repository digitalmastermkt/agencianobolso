import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FormSecurityOptions {
  formName: string;
  maxSubmissionsPerHour?: number;
  enableHoneypot?: boolean;
  validateInputSafety?: boolean;
}

export function useFormSecurity(options: FormSecurityOptions) {
  const [isChecking, setIsChecking] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState('');
  const { toast } = useToast();

  // Input sanitization and validation
  const sanitizeInput = useCallback((input: string): string => {
    return input
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .slice(0, 1000); // Limit length
  }, []);

  // Validate input for suspicious patterns
  const validateInputSafety = useCallback((input: string): boolean => {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ];

    return !suspiciousPatterns.some(pattern => pattern.test(input));
  }, []);

  // Check rate limiting before form submission
  const checkRateLimit = useCallback(async (): Promise<boolean> => {
    if (!options.formName) return true;

    setIsChecking(true);
    try {
      const { data, error } = await supabase.rpc('check_form_rate_limit', {
        form_name: options.formName,
        max_per_hour: options.maxSubmissionsPerHour || 10
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Allow submission if check fails
      }

      if (!data) {
        toast({
          title: "Limite de envios atingido",
          description: `Você atingiu o limite de ${options.maxSubmissionsPerHour || 10} envios por hora. Tente novamente mais tarde.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow submission if check fails
    } finally {
      setIsChecking(false);
    }
  }, [options.formName, options.maxSubmissionsPerHour, toast]);

  // Check honeypot for bot detection
  const checkHoneypot = useCallback((): boolean => {
    if (!options.enableHoneypot) return true;
    
    if (honeypotValue !== '') {
      // Honeypot field was filled - likely a bot
      toast({
        title: "Erro de validação",
        description: "Falha na verificação de segurança. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  }, [honeypotValue, options.enableHoneypot, toast]);

  // Validate form data before submission
  const validateFormData = useCallback((formData: Record<string, any>): boolean => {
    if (!options.validateInputSafety) return true;

    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' && !validateInputSafety(value)) {
        toast({
          title: "Entrada inválida",
          description: `O campo ${key} contém caracteres não permitidos.`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  }, [options.validateInputSafety, validateInputSafety, toast]);

  // Main security check function
  const performSecurityChecks = useCallback(async (formData: Record<string, any>): Promise<boolean> => {
    // Check honeypot first (client-side)
    if (!checkHoneypot()) return false;

    // Validate input safety
    if (!validateFormData(formData)) return false;

    // Check rate limiting (server-side)
    if (!await checkRateLimit()) return false;

    return true;
  }, [checkHoneypot, validateFormData, checkRateLimit]);

  // Enhanced authentication logging
  // Note: IP-based rate limiting cannot be done reliably from the client.
  // The browser cannot obtain the real client IP. These calls log/check using
  // a placeholder IP and are intentionally best-effort; real enforcement should
  // happen server-side (e.g. in an edge function reading x-forwarded-for).
  const logAuthAttempt = useCallback(async (
    email: string,
    success: boolean,
    failureReason?: string
  ) => {
    try {
      const userAgent = navigator.userAgent;
      await supabase.rpc('log_auth_attempt', {
        p_ip_address: '0.0.0.0',
        p_user_agent: userAgent,
        p_email: email,
        p_success: success,
        p_failure_reason: failureReason
      });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }, []);

  // Best-effort client-side gate. Real rate limiting must be enforced server-side.
  const checkAuthSecurity = useCallback(async (email?: string): Promise<boolean> => {
    try {
      const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_auth_rate_limit', {
        p_ip_address: '0.0.0.0',
        p_email: email
      });

      if (rateLimitError) {
        console.error('Rate limit check failed:', rateLimitError);
        return true;
      }

      if (!rateLimitOk) {
        toast({
          title: "Muitas tentativas",
          description: "Muitas tentativas de login. Tente novamente mais tarde.",
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Auth security check error:', error);
      return true;
    }
  }, [toast]);

  // Log security event
  const logSecurityEvent = useCallback(async (eventType: string, details?: any) => {
    try {
      await supabase.rpc('log_auth_event', {
        event_type: eventType,
        details: details ? JSON.stringify(details) : null
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }, []);

  return {
    performSecurityChecks,
    sanitizeInput,
    validateInputSafety,
    logSecurityEvent,
    logAuthAttempt,
    checkAuthSecurity,
    isChecking,
    honeypotValue,
    setHoneypotValue,
  };
}