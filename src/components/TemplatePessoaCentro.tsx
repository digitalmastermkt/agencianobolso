import type { CSSProperties } from 'react';

interface TemplatePessoaCentroColors {
  background: string;
  headline: string;
  subheadline: string;
  ctaBackground: string;
  ctaText: string;
}

interface TemplatePessoaCentroCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface TemplatePessoaCentroProps {
  photoUrl: string;
  headline: string;
  subheadline: string;
  cta?: TemplatePessoaCentroCta;
  colors: TemplatePessoaCentroColors;
  style?: CSSProperties;
}

export function TemplatePessoaCentro({
  photoUrl,
  headline,
  subheadline,
  cta,
  colors,
  style,
}: TemplatePessoaCentroProps) {
  const containerStyle: CSSProperties = {
    background: colors.background,
    ...style,
  };

  const headlineStyle: CSSProperties = {
    color: colors.headline,
  };

  const subheadlineStyle: CSSProperties = {
    color: colors.subheadline,
  };

  const ctaStyle: CSSProperties = {
    background: colors.ctaBackground,
    color: colors.ctaText,
  };

  return (
    <section
      className="w-full rounded-3xl px-6 py-12 sm:px-12 sm:py-14 font-sans"
      style={containerStyle}
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h2
            className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            style={headlineStyle}
          >
            {headline}
          </h2>
          <p
            className="text-sm leading-relaxed sm:text-base"
            style={subheadlineStyle}
          >
            {subheadline}
          </p>
        </div>

        <div className="flex w-full justify-center">
          <div className="rounded-[32px] bg-white/10 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)]">
            <img
              src={photoUrl}
              alt="Pessoa central"
              className="h-72 w-56 rounded-[28px] object-cover sm:h-80 sm:w-64"
            />
          </div>
        </div>

        {cta?.href ? (
          <a
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-90 sm:text-sm"
            style={ctaStyle}
            href={cta.href}
          >
            {cta.label}
          </a>
        ) : cta ? (
          <button
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition-opacity hover:opacity-90 sm:text-sm"
            style={ctaStyle}
            onClick={cta.onClick}
            type="button"
          >
            {cta.label}
          </button>
        ) : null}
      </div>
    </section>
  );
}
