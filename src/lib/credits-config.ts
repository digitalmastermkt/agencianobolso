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
