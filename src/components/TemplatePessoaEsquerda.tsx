import type { CSSProperties } from 'react';

interface TemplatePessoaEsquerdaColors {
  background: string;
  headline: string;
  subheadline: string;
  ctaBackground: string;
  ctaText: string;
}

interface TemplatePessoaEsquerdaCta {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface TemplatePessoaEsquerdaProps {
  photoUrl: string;
  headline: string;
  subheadline: string;
  cta?: TemplatePessoaEsquerdaCta;
  colors: TemplatePessoaEsquerdaColors;
  style?: CSSProperties;
}

export function TemplatePessoaEsquerda({
  photoUrl,
  headline,
  subheadline,
  cta,
  colors,
  style,
}: TemplatePessoaEsquerdaProps) {
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
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full justify-center md:w-1/2 md:justify-start">
          <div className="rounded-[32px] bg-white/10 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <img
              src={photoUrl}
              alt="Pessoa à esquerda"
              className="h-72 w-56 rounded-[28px] object-cover sm:h-80 sm:w-64"
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 text-left md:w-1/2">
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

          {cta?.href ? (
            <a
              className="mt-2 inline-flex w-fit items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
              style={ctaStyle}
              href={cta.href}
            >
              {cta.label}
            </a>
          ) : cta ? (
            <button
              className="mt-2 inline-flex w-fit items-center justify-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-opacity hover:opacity-90"
              style={ctaStyle}
              onClick={cta.onClick}
              type="button"
            >
              {cta.label}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
