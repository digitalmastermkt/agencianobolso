// Tipos de criativo — define hierarquia visual, presença de CTA e atmosfera
// Espelhado nas Edge Functions (art-director-decision e generate-creative-v2)
// para evitar import cross-boundary.

import { Megaphone, Radio, Heart, Rocket, Building2, Bell, type LucideIcon } from "lucide-react";

export type CreativeType =
  | "trafego_pago"
  | "live_evento"
  | "data_comemorativa"
  | "lancamento"
  | "institucional"
  | "aviso_comunicado";

export interface CreativeTypeMeta {
  value: CreativeType;
  label: string;
  description: string;
  icon: LucideIcon;
  showCta: boolean;
  textPlaceholder: string;
}

export const CREATIVE_TYPES: CreativeTypeMeta[] = [
  {
    value: "trafego_pago",
    label: "Tráfego Pago",
    description: "Headline forte + CTA destacado. Foco em conversão.",
    icon: Megaphone,
    showCta: true,
    textPlaceholder: "Ex: Transforme sua vida em 30 dias",
  },
  {
    value: "live_evento",
    label: "Live / Evento",
    description: "Data e horário em destaque. Chamada para participar.",
    icon: Radio,
    showCta: true,
    textPlaceholder: "Ex: Live sobre Tráfego Pago — Quinta 20h",
  },
  {
    value: "data_comemorativa",
    label: "Data Comemorativa",
    description: "Mensagem afetiva + logo da marca. Sem CTA.",
    icon: Heart,
    showCta: false,
    textPlaceholder: "Ex: Feliz Dia das Mães — Com carinho, [Marca]",
  },
  {
    value: "lancamento",
    label: "Lançamento",
    description: "Pouco texto, muito impacto. Suspense ou data.",
    icon: Rocket,
    showCta: true,
    textPlaceholder: "Ex: Em breve. 25/05",
  },
  {
    value: "institucional",
    label: "Institucional",
    description: "Propósito ou conquista da marca. Sóbrio, sem urgência.",
    icon: Building2,
    showCta: false,
    textPlaceholder: "Ex: 10 anos transformando negócios",
  },
  {
    value: "aviso_comunicado",
    label: "Aviso / Comunicado",
    description: "Informação direta e legível. Layout clean.",
    icon: Bell,
    showCta: false,
    textPlaceholder: "Ex: Funcionamento — Seg a Sex, 9h às 18h",
  },
];

export const DEFAULT_CREATIVE_TYPE: CreativeType = "trafego_pago";

export function getCreativeTypeMeta(value?: string | null): CreativeTypeMeta {
  return (
    CREATIVE_TYPES.find((t) => t.value === value) ??
    CREATIVE_TYPES.find((t) => t.value === DEFAULT_CREATIVE_TYPE)!
  );
}
