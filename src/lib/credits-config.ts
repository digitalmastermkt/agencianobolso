// Configuração centralizada de custos de créditos
export const CREDIT_COSTS = {
  GENERATE_ART: 1,
  CREATE_BRAND_PROFILE: 2,
  UPDATE_BRAND_PROFILE: 1,
} as const;

export type CreditActionType = keyof typeof CREDIT_COSTS;

// Descrições legíveis para UI
export const CREDIT_ACTION_LABELS: Record<CreditActionType, string> = {
  GENERATE_ART: 'Gerar Arte',
  CREATE_BRAND_PROFILE: 'Criar Perfil de Marca',
  UPDATE_BRAND_PROFILE: 'Atualizar Perfil de Marca',
};

// Limites de perfis de marca por plano
export const BRAND_PROFILE_LIMITS = {
  Essencial: 1,
  Premium: 3,
  Elite: null, // null = ilimitado
} as const;

export type PlanTier = keyof typeof BRAND_PROFILE_LIMITS;

// Créditos mensais por plano
export const MONTHLY_CREDITS = {
  Essencial: 15,
  Premium: 35,
  Elite: 75,
} as const;

// Preços mensais por plano (em reais)
export const MONTHLY_PRICES = {
  Essencial: 67,
  Premium: 147,
  Elite: 297,
} as const;

// Preços anuais por plano (em reais)
export const ANNUAL_PRICES = {
  Essencial: 670,
  Premium: 1470,
  Elite: 2970,
} as const;
