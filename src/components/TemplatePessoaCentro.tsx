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
      className="w-full rounded-3xl px-6 py-10 sm:px-10 sm:py-12 font-sans"
      style={containerStyle}
    >
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <div className="space-y-3">
          <h2
            className="text-3xl font-semibold leading-tight sm:text-4xl"
            style={headlineStyle}
          >
            {headline}
          </h2>
          <p
            className="text-base leading-relaxed sm:text-lg"
            style={subheadlineStyle}
          >
            {subheadline}
          </p>
        </div>

        <div className="flex w-full justify-center">
          <div className="rounded-[32px] bg-white/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <img
              src={photoUrl}
              alt="Pessoa central"
              className="h-72 w-56 rounded-[28px] object-cover sm:h-80 sm:w-64"
            />
          </div>
        </div>

        {cta?.href ? (
          <a
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
            style={ctaStyle}
            href={cta.href}
          >
            {cta.label}
          </a>
        ) : cta ? (
          <button
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
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
