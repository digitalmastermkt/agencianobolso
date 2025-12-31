import type { CSSProperties } from 'react';
import { TemplatePessoaCentro, type TemplatePessoaCentroProps } from './TemplatePessoaCentro';

export interface BannerDecision {
  template: string;
  headline: string;
  subheadline: string;
  cta?: TemplatePessoaCentroProps['cta'];
  colors: TemplatePessoaCentroProps['colors'];
  style?: CSSProperties;
}

export function renderBannerFromDecision(decision: BannerDecision, photoUrl: string) {
  switch (decision.template) {
    case 'pessoa_centro':
      return (
        <TemplatePessoaCentro
          photoUrl={photoUrl}
          headline={decision.headline}
          subheadline={decision.subheadline}
          cta={decision.cta}
          colors={decision.colors}
          style={decision.style}
        />
      );
    default:
      return null;
  }
}
